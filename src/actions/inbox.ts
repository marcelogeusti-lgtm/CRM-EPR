'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

async function getDefaultTenant() {
  const tenant = await prisma.tenant.findFirst();
  return tenant?.id;
}

export async function getInboxDeals() {
  const tenantId = await getDefaultTenant();
  
  if (!tenantId) return [];

  const deals = await prisma.deal.findMany({
    where: { tenantId },
    include: {
      contact: true,
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return deals;
}

export async function getDealActivities(dealId: string) {
  const tenantId = await getDefaultTenant();

  return await prisma.activity.findMany({
    where: { dealId, tenantId },
    orderBy: { createdAt: 'asc' }
  });
}

export async function sendMessage(dealId: string, content: string) {
  const tenantId = await getDefaultTenant();
  if (!tenantId) throw new Error('Tenant não encontrado');

  const deal = await prisma.deal.findUnique({
    where: { id: dealId, tenantId },
    include: { contact: true }
  });

  if (!deal || !deal.contact?.phone) {
    throw new Error('Deal ou Telefone não encontrado');
  }

  // 1. Salvar no banco (Como Mensagem Enviada pelo Agente)
  await prisma.activity.create({
    data: {
      tenantId,
      dealId,
      type: 'MESSAGE',
      content,
      author: 'Agent'
    }
  });

  // 1.5 Salvar na tabela nova Message (Para coerência arquitetural)
  // Procuramos se existe uma Conversation ativa
  const conversation = await prisma.conversation.findFirst({
    where: { dealId }
  });
  if (conversation) {
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        authorType: 'USER',
        content
      }
    });
  }

  // 2. Disparar Mensagem de Volta via API Oficial da Meta
  // Busca as configurações salvas da integração do WhatsApp
  const integration = await prisma.integration.findFirst({
    where: { tenantId, provider: 'whatsapp', isActive: true }
  });

  if (integration && integration.apiKey && integration.config) {
    try {
      const config = JSON.parse(integration.config);
      const metaPhoneId = config.metaPhoneId;
      const accessToken = integration.apiKey;
      
      // Limpar o número de telefone (Remover +, espaços e traços)
      const cleanPhone = deal.contact.phone.replace(/\D/g, '');

      console.log(`📤 Enviando mensagem da Meta para ${cleanPhone}...`);

      const META_API_URL = `https://graph.facebook.com/v20.0/${metaPhoneId}/messages`;
      
      const response = await fetch(META_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: { body: content }
        })
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('❌ Erro da API da Meta:', responseData);
      } else {
        console.log('✅ Mensagem enviada com sucesso pela Meta!');
      }

    } catch (error) {
      console.error('❌ Falha ao tentar conectar com a Meta:', error);
    }
  } else {
    console.warn('⚠️ Integração do WhatsApp não configurada ou sem Token Permanente.');
  }

  revalidatePath('/inbox');
  revalidatePath('/pipeline');
}

export async function addInternalNote(dealId: string, content: string, type: 'NOTE' | 'TASK' = 'NOTE') {
  const tenantId = await getDefaultTenant();
  if (!tenantId) throw new Error('Tenant não encontrado');

  await prisma.activity.create({
    data: {
      tenantId,
      dealId,
      type,
      content,
      author: 'System' // Sistema ou Nome do Agente Atual
    }
  });

  revalidatePath('/inbox');
  revalidatePath('/pipeline');
}
