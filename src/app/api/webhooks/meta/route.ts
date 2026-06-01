import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  
  // Fallback para o primeiro tenant caso não ache pelo ID exato (Útil em ambiente de testes/MVP)
  const fallbackTenant = await prisma.tenant.findFirst();
  const tenantId = integration ? integration.tenantId : fallbackTenant?.id;
  
  if(!tenantId) {
    console.warn('❌ [WEBHOOK] Nenhum Tenant encontrado para processar a mensagem.');
    return;
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

  // 6. Inserir Message
  const newMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      authorType: 'CONTACT',
      content: textBody
    }
  });
  console.log(`💾 Mensagem gravada no DB com sucesso! ID: ${newMessage.id}`);
}

// 2. ROTA POST - Recepção de Mensagens (Onde a Mágica Acontece)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('📥 [WEBHOOK META] Pacote recebido:', JSON.stringify(body, null, 2));

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
