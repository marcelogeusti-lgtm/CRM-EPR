import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Autenticação básica (em prod, use headers ou secret keys)
    const apiKey = req.headers.get('x-api-key');
    if (apiKey !== 'n8n-kommo-secret-123') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId, type, contact, message, dealValue } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    // Pipeline Check
    let pipeline = await prisma.pipeline.findFirst({ where: { tenantId } });
    if (!pipeline) {
      pipeline = await prisma.pipeline.create({
        data: {
          tenantId,
          name: 'Funil Principal',
          stages: {
            create: [
              { name: 'COMENTÁRIO OU DM', order: 0, color: 'bg-zinc-500' }
            ]
          }
        }
      });
    }

    const firstStage = await prisma.stage.findFirst({
      where: { pipelineId: pipeline.id },
      orderBy: { order: 'asc' }
    });

    if (!firstStage) {
      return NextResponse.json({ error: 'No stages found' }, { status: 500 });
    }

    // 1. Acha ou Cria o Contato pelo Telefone
    let dbContact = await prisma.contact.findFirst({
      where: { phone: contact.phone, tenantId }
    });

    if (!dbContact) {
      dbContact = await prisma.contact.create({
        data: {
          tenantId,
          name: contact.name || 'Desconhecido',
          phone: contact.phone
        }
      });
    }

    // 2. Acha ou Cria o Deal ativo para este contato
    let deal = await prisma.deal.findFirst({
      where: { 
        contactId: dbContact.id, 
        tenantId,
        stage: { name: { notIn: ['WON', 'LOST'] } }
      }
    });

    if (!deal) {
      deal = await prisma.deal.create({
        data: {
          tenantId,
          contactId: dbContact.id,
          pipelineId: pipeline.id,
          stageId: firstStage.id,
          title: `Oportunidade: ${dbContact.name}`,
          value: dealValue || 0
        }
      });

      // Log the creation
      await prisma.activity.create({
        data: {
          tenantId,
          dealId: deal.id,
          type: 'STATUS_CHANGE',
          content: 'Deal criado automaticamente pelo n8n',
          author: 'System'
        }
      });
    }

    // 3. Se houver uma mensagem, salva como Activity
    if (type === 'NEW_MESSAGE' && message) {
      await prisma.activity.create({
        data: {
          tenantId,
          dealId: deal.id,
          type: 'MESSAGE',
          content: message.text,
          author: message.author || 'Client'
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      dealId: deal.id,
      contactId: dbContact.id
    });

  } catch (error: any) {
    console.error('N8N Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
