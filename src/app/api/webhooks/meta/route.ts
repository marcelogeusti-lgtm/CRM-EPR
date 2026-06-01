import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Assumindo que temos a instancia do prisma exportada

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

// 2. ROTA POST - Recepção de Mensagens (Onde a Mágica Acontece)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('📥 [WEBHOOK META] Pacote recebido:', JSON.stringify(body, null, 2));

    // A Meta sempre manda um objeto principal, podendo ser 'page' (Instagram/Messenger) 
    // ou 'whatsapp_business_account' (WhatsApp).
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
            // TODO: Criar lógica para salvar Lead, criar Conversa no Inbox e disparar Socket.io
          }
        });
      });
      
      return NextResponse.json({ success: true, message: 'EVENT_RECEIVED' }, { status: 200 });

    } else if (objectType === 'whatsapp_business_account') {
      // ======== LÓGICA WHATSAPP ========
      body.entry?.forEach((entry: any) => {
        const accountId = entry.id;

        entry.changes?.forEach((change: any) => {
          if (change.value && change.value.messages) {
            const phoneNumberId = change.value.metadata.phone_number_id;
            
            // Loop nas mensagens (geralmente vem 1 por vez)
            change.value.messages.forEach((msg: any) => {
              const fromPhone = msg.from;
              
              if (msg.type === 'text') {
                const textBody = msg.text.body;
                console.log(`🟢 [WHATSAPP] Mensagem de ${fromPhone} no ID ${phoneNumberId}: ${textBody}`);
                // TODO: Salvar Lead, Atualizar Pipeline, Disparar Notificação na Tela
              }
            });
          }
        });
      });

      return NextResponse.json({ success: true, message: 'EVENT_RECEIVED' }, { status: 200 });

    } else {
      // Objeto desconhecido
      return new NextResponse('Not Found', { status: 404 });
    }

  } catch (error) {
    console.error('❌ [WEBHOOK META] Erro crítico ao processar POST:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
