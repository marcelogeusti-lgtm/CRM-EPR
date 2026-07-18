import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendText, sendMedia, type SendableMediaType } from '@/lib/whatsapp';
import { buildSystemPrompt } from '@/lib/agentPrompt';

// A resposta automática da IA (chamada à OpenAI + envio via Meta) pode
// passar do timeout padrão da Vercel antes de terminar.
export const maxDuration = 30;

/**
 * Valida a assinatura HMAC-SHA256 que a Meta envia no header
 * `x-hub-signature-256`. Sem isso, qualquer um pode forjar mensagens
 * fazendo POST no endpoint. Usa comparação de tempo constante.
 */
function isValidMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    console.error('❌ [WEBHOOK META] META_APP_SECRET não configurado — recusando por segurança.');
    return false;
  }
  if (!signatureHeader?.startsWith('sha256=')) return false;

  const expected =
    'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody, 'utf-8').digest('hex');

  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}


// 1. ROTA GET - Desafio de Verificação (Webhook Challenge da Meta)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Parâmetros enviados pela Meta
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token) {
    try {
      // Busca todas as integrações ativas do tipo whatsapp ou instagram
      const integrations = await prisma.integration.findMany({
        where: { 
          provider: { in: ['whatsapp', 'instagram'] },
          isActive: true
        }
      });

      // Verifica se existe algum Tenant com esse verify_token específico
      const validIntegration = integrations.find(i => {
        if (!i.config) return false;
        try {
          const cfg = JSON.parse(i.config);
          return cfg.verifyToken === token;
        } catch (e) {
          return false;
        }
      });

      if (validIntegration) {
        console.log('✅ [WEBHOOK META] Verificação aceita para o provedor:', validIntegration.provider);
        // A Meta EXIGE que o challenge seja retornado puro (texto/número) e com status 200
        return new NextResponse(challenge, { status: 200 });
      } else {
        console.warn('❌ [WEBHOOK META] Token de verificação não encontrado no Banco de Dados:', token);
        return new NextResponse('Forbidden: Token mismatch', { status: 403 });
      }

    } catch (error) {
      console.error('Erro ao verificar Webhook:', error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }
  }

  return new NextResponse('Bad Request: Missing parameters', { status: 400 });
}

// Helper para processar mensagens do WhatsApp
async function processWhatsAppMessage(fromPhone: string, textBody: string, phoneNumberId: string) {
  // 1. Encontrar o Tenant dono deste phoneNumberId
  const integrations = await prisma.integration.findMany({
    where: { provider: 'whatsapp', isActive: true }
  });
  
  const integration = integrations.find(i => {
    if(!i.config) return false;
    try {
      const cfg = JSON.parse(i.config);
      return cfg.metaPhoneId === phoneNumberId;
    } catch(e) { return false; }
  });

  // SEM fallback: se não houver integração que reivindique este phone_number_id,
  // recusamos. Cair no "primeiro tenant" misturaria mensagens de clientes
  // diferentes na mesma conta — vazamento grave de dados.
  if (!integration) {
    console.warn(`❌ [WEBHOOK] Nenhuma integração registrada para o phone_number_id ${phoneNumberId}. Mensagem ignorada.`);
    return;
  }
  const tenantId = integration.tenantId;

  // 2. Procurar ou criar o Contato
  let contact = await prisma.contact.findFirst({
    where: { tenantId, phone: fromPhone }
  });
  if(!contact) {
    contact = await prisma.contact.create({
      data: { tenantId, name: `WhatsApp ${fromPhone}`, phone: fromPhone }
    });
    console.log(`👤 Novo Contato criado: ${contact.name}`);
  }

  // 3. Procurar ou criar o Deal (No primeiro funil, primeiro stage)
  const pipeline = await prisma.pipeline.findFirst({ 
    where: { tenantId }, 
    include: { stages: { orderBy: { order: 'asc' } } } 
  });
  if(!pipeline || pipeline.stages.length === 0) {
    console.warn('❌ [WEBHOOK] Nenhum Pipeline encontrado para criar o Deal.');
    return;
  }
  const firstStage = pipeline.stages[0];

  let deal = await prisma.deal.findFirst({
    where: { tenantId, contactId: contact.id }
  });
  
  if(!deal) {
    deal = await prisma.deal.create({
      data: {
        tenantId,
        pipelineId: pipeline.id,
        stageId: firstStage.id,
        contactId: contact.id,
        title: `Negociação - ${contact.name}`
      }
    });
    console.log(`💼 Novo Negócio criado no Pipeline: ${deal.title}`);
  }

  // 4. Procurar ou criar Channel
  let channel = await prisma.channel.findFirst({
    where: { tenantId, provider: 'whatsapp' }
  });
  if(!channel) {
    channel = await prisma.channel.create({
      data: { tenantId, name: 'WhatsApp Oficial', provider: 'whatsapp' }
    });
  }

  // 5. Procurar ou criar Conversation
  let conversation = await prisma.conversation.findFirst({
    where: { dealId: deal.id, channelId: channel.id }
  });
  if(!conversation) {
    conversation = await prisma.conversation.create({
      data: { dealId: deal.id, channelId: channel.id }
    });
    console.log(`💬 Nova Conversa iniciada!`);
  }

  // 6. Inserir Message (Nova Arquitetura)
  const newMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      authorType: 'CONTACT',
      content: textBody
    }
  });

  // 7. Inserir Activity (Para compatibilidade com o Frontend Atual da Timeline)
  await prisma.activity.create({
    data: {
      tenantId,
      dealId: deal.id,
      type: 'MESSAGE',
      content: textBody,
      author: 'Contact'
    }
  });

  console.log(`💾 Mensagem gravada no DB com sucesso! ID: ${newMessage.id}`);

  // 8. Se o Agente de IA estiver ativo pra este tenant, gera e envia a
  // resposta automática. Isolado num try/catch próprio pra uma falha aqui
  // (chave da OpenAI ausente, erro da Meta etc.) nunca derrubar o
  // processamento do webhook — a mensagem do contato já foi salva acima
  // de qualquer forma.
  try {
    await maybeSendAiReply({
      tenantId,
      dealId: deal.id,
      conversationId: conversation.id,
      toPhone: fromPhone,
      phoneNumberId,
      accessToken: integration.apiKey || '',
    });
  } catch (error) {
    console.error('❌ [WEBHOOK] Falha ao gerar/enviar resposta automática da IA:', error);
  }
}

async function maybeSendAiReply(params: {
  tenantId: string;
  dealId: string;
  conversationId: string;
  toPhone: string;
  phoneNumberId: string;
  accessToken: string;
}) {
  if (!params.accessToken) return;

  const agent = await prisma.aiAgent.findUnique({
    where: { tenantId: params.tenantId },
    include: { scriptSteps: true, objections: true, knowledgeSources: true },
  });
  if (!agent || !agent.isActive) return;

  const openaiConfig = await prisma.systemConfig.findUnique({ where: { key: 'OPENAI_MASTER_KEY' } });
  if (!openaiConfig?.value) {
    console.warn('⚠️ [WEBHOOK] Agente de IA ativo, mas a chave mestre da OpenAI não está configurada em /admin.');
    return;
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: params.tenantId } });
  const systemPrompt = buildSystemPrompt(agent, tenant?.pixKey);

  // Últimas mensagens da conversa como histórico — dá contexto pra IA sem
  // reprocessar a conversa inteira a cada troca.
  const recentMessages = await prisma.message.findMany({
    where: { conversationId: params.conversationId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  const history = recentMessages
    .reverse()
    .map(m => ({
      role: (m.authorType === 'CONTACT' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    }));

  const openai = createOpenAI({ apiKey: openaiConfig.value });

  // Etapas do script com arquivo anexado (áudio/imagem/vídeo) — viram uma
  // ferramenta que a IA pode chamar no momento certo da conversa. Sem
  // etapa com mídia, não passa `tools` — nem precisa da chamada extra.
  const mediaSteps = agent.scriptSteps.filter(s => s.mediaType !== 'TEXT' && s.mediaUrl);
  const tools = mediaSteps.length
    ? {
        enviarMidiaDaEtapa: tool({
          description:
            'Envia pro WhatsApp do lead o arquivo (áudio, imagem ou vídeo) anexado a uma etapa específica do script.',
          inputSchema: z.object({
            stepId: z.string().describe('id da etapa cujo arquivo de mídia deve ser enviado'),
          }),
          execute: async ({ stepId }: { stepId: string }) => {
            const step = mediaSteps.find(s => s.id === stepId);
            if (!step?.mediaUrl) return { success: false, error: 'Etapa não encontrada ou sem mídia.' };
            const result = await sendMedia(
              params.phoneNumberId,
              params.accessToken,
              params.toPhone,
              step.mediaType as SendableMediaType,
              step.mediaUrl
            );
            if (result.success) {
              await prisma.message.create({
                data: { conversationId: params.conversationId, authorType: 'AI', content: `[${step.mediaType.toLowerCase()}] ${step.title}` },
              });
              await prisma.activity.create({
                data: { tenantId: params.tenantId, dealId: params.dealId, type: 'MESSAGE', content: `[${step.mediaType.toLowerCase()}] ${step.title}`, author: 'Agent' },
              });
            }
            return result;
          },
        }),
      }
    : undefined;

  const { text: replyText } = await generateText({
    model: openai('gpt-4o-mini'),
    system: systemPrompt,
    messages: history,
    tools,
    stopWhen: tools ? stepCountIs(3) : undefined,
  });

  if (!replyText?.trim()) return;

  const sendResult = await sendText(params.phoneNumberId, params.accessToken, params.toPhone, replyText);
  if (!sendResult.success) {
    console.error('❌ [WEBHOOK] Falha ao enviar resposta da IA via WhatsApp:', sendResult.error);
    return;
  }

  await prisma.message.create({
    data: { conversationId: params.conversationId, authorType: 'AI', content: replyText },
  });
  // author: 'Agent' (não 'AI') de propósito — é o valor que a timeline do
  // Inbox (LeadInboxPanel) reconhece como mensagem enviada por nós, pra
  // renderizar do lado certo da conversa.
  await prisma.activity.create({
    data: { tenantId: params.tenantId, dealId: params.dealId, type: 'MESSAGE', content: replyText, author: 'Agent' },
  });
}

// 2. ROTA POST - Recepção de Mensagens (Onde a Mágica Acontece)
export async function POST(request: Request) {
  try {
    // Lê o corpo CRU (texto) — necessário para conferir a assinatura byte a byte.
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    if (!isValidMetaSignature(rawBody, signature)) {
      console.warn('❌ [WEBHOOK META] Assinatura inválida. Request recusado.');
      return new NextResponse('Invalid signature', { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const objectType = body.object;

    if (objectType === 'page') {
      // ======== LÓGICA INSTAGRAM ========
      body.entry?.forEach((entry: any) => {
        const pageId = entry.id;
        entry.messaging?.forEach((messagingEvent: any) => {
          const senderId = messagingEvent.sender.id;
          const message = messagingEvent.message;
          if (message && message.text) {
            console.log(`💬 [INSTAGRAM] Mensagem de ${senderId} para página ${pageId}: ${message.text}`);
            // Futuro: Implementar a mesma lógica de processWhatsAppMessage para Instagram
          }
        });
      });
      return NextResponse.json({ success: true, message: 'EVENT_RECEIVED' }, { status: 200 });

    } else if (objectType === 'whatsapp_business_account') {
      // ======== LÓGICA WHATSAPP ========
      // Como o processamento envolve DB, usaremos Promise.all para não travar a resposta imediata
      const processPromises: Promise<void>[] = [];

      body.entry?.forEach((entry: any) => {
        entry.changes?.forEach((change: any) => {
          if (change.value && change.value.messages) {
            const phoneNumberId = change.value.metadata.phone_number_id;
            change.value.messages.forEach((msg: any) => {
              if (msg.type === 'text') {
                const fromPhone = msg.from;
                const textBody = msg.text.body;
                console.log(`🟢 [WHATSAPP] Mensagem de ${fromPhone}: ${textBody}`);
                
                // Enfileira o processamento assíncrono no Banco de Dados
                processPromises.push(processWhatsAppMessage(fromPhone, textBody, phoneNumberId));
              }
            });
          }
        });
      });
      
      // A Meta exige resposta rápida (200 OK), então deixamos o Promise.all rodar em background (ou aguardamos se for rápido)
      await Promise.all(processPromises);

      return NextResponse.json({ success: true, message: 'EVENT_RECEIVED' }, { status: 200 });

    } else {
      return new NextResponse('Not Found', { status: 404 });
    }

  } catch (error) {
    console.error('❌ [WEBHOOK META] Erro crítico ao processar POST:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
