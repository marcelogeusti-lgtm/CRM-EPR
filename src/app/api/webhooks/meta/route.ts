import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { sendAiAgentReply } from '@/lib/aiReply';
import { matchTrigger, runFlow } from '@/lib/flowEngine';
import { downloadWhatsappMedia } from '@/lib/whatsapp';
import { uploadInboundMedia } from '@/lib/mediaStorage';

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

interface IncomingContent {
  type: 'text' | 'image' | 'audio' | 'video';
  text?: string;
  mediaId?: string;
}

// Helper para processar mensagens do WhatsApp
async function processWhatsAppMessage(fromPhone: string, incoming: IncomingContent, phoneNumberId: string) {
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

  // 1.5 Resolver o conteúdo: texto vem pronto, mídia precisa ser baixada
  // da Meta (só chega um media id no payload, não o arquivo) e
  // re-hospedada no storage do próprio Nexus antes de virar mensagem —
  // mesmo formato "[MEDIA:TIPO]url" que o envio manual pelo Inbox usa
  // (ver src/actions/inbox.ts), pra renderizar igual na timeline.
  let content: string;
  if (incoming.type === 'text') {
    content = incoming.text || '';
  } else {
    if (!incoming.mediaId) {
      console.warn(`⚠️ [WEBHOOK] Mensagem de mídia (${incoming.type}) sem media id. Ignorada.`);
      return;
    }
    const downloaded = await downloadWhatsappMedia(incoming.mediaId, integration.apiKey || '');
    if (!downloaded.success || !downloaded.buffer) {
      console.error(`❌ [WEBHOOK] Falha ao baixar mídia (${incoming.type}) do lead:`, downloaded.error);
      return;
    }
    const mediaType = incoming.type === 'image' ? 'IMAGE' : incoming.type === 'video' ? 'VIDEO' : 'AUDIO';
    const uploaded = await uploadInboundMedia(tenantId, mediaType, downloaded.buffer, downloaded.mimeType || '');
    if (!uploaded.success || !uploaded.url) {
      console.error(`❌ [WEBHOOK] Falha ao subir mídia (${incoming.type}) do lead pro storage:`, uploaded.error);
      return;
    }
    content = `[MEDIA:${mediaType}]${uploaded.url}`;
  }

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

  // 6. Contar mensagens anteriores do contato NESTA conversa, antes de
  // gravar a atual — usado logo abaixo pra saber se é a "primeira
  // mensagem" (gatilho WELCOME de um AutomationFlow).
  const priorContactMessages = await prisma.message.count({
    where: { conversationId: conversation.id, authorType: 'CONTACT' },
  });
  const isFirstMessage = priorContactMessages === 0;

  // 7. Inserir Message (Nova Arquitetura)
  const newMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      authorType: 'CONTACT',
      content
    }
  });

  // 8. Inserir Activity (Para compatibilidade com o Frontend Atual da Timeline)
  await prisma.activity.create({
    data: {
      tenantId,
      dealId: deal.id,
      type: 'MESSAGE',
      content,
      author: 'Contact'
    }
  });

  console.log(`💾 Mensagem gravada no DB com sucesso! ID: ${newMessage.id}`);

  // 9. Motor de fluxo (src/lib/flowEngine.ts) tem precedência sobre a
  // resposta padrão da IA: se algum AutomationFlow ativo casar com esta
  // mensagem (palavra-chave ou primeira mensagem), roda o fluxo — que pode
  // terminar num nó AI_HANDOFF se quiser a IA livre depois. Sem fluxo
  // correspondente, cai no comportamento de sempre (sendAiAgentReply).
  // Isolado num try/catch próprio: falha aqui (chave da OpenAI ausente,
  // erro da Meta etc.) nunca derruba o processamento do webhook — a
  // mensagem do contato já foi salva acima de qualquer forma.
  try {
    const replyContext = {
      tenantId,
      integrationId: integration.id,
      dealId: deal.id,
      conversationId: conversation.id,
      contactId: contact.id,
      toPhone: fromPhone,
      phoneNumberId,
      accessToken: integration.apiKey || '',
      messageText: content,
    };

    const matchedFlow = await matchTrigger(tenantId, content, isFirstMessage);
    if (matchedFlow) {
      await runFlow(matchedFlow, replyContext);
    } else {
      await sendAiAgentReply(replyContext);
    }
  } catch (error) {
    console.error('❌ [WEBHOOK] Falha ao gerar/enviar resposta automática (fluxo ou IA):', error);
  }
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
              const fromPhone = msg.from;

              if (msg.type === 'text') {
                const textBody = msg.text.body;
                console.log(`🟢 [WHATSAPP] Mensagem de ${fromPhone}: ${textBody}`);
                processPromises.push(
                  processWhatsAppMessage(fromPhone, { type: 'text', text: textBody }, phoneNumberId)
                );
              } else if (msg.type === 'image' || msg.type === 'audio' || msg.type === 'video') {
                console.log(`🟢 [WHATSAPP] Mídia (${msg.type}) de ${fromPhone}`);
                processPromises.push(
                  processWhatsAppMessage(
                    fromPhone,
                    { type: msg.type, mediaId: msg[msg.type]?.id },
                    phoneNumberId
                  )
                );
              }
              // Outros tipos (document, sticker, location, contacts,
              // interactive, button...) ainda não são tratados — a
              // mensagem chega mas é ignorada, sem quebrar o webhook.
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
