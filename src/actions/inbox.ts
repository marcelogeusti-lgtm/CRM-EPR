'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sendText } from '@/lib/whatsapp';
import { revalidatePath } from 'next/cache';


async function getDefaultTenant() {
  const user = await getCurrentUser();
  return user?.tenantId;
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

import { unstable_noStore as noStore } from 'next/cache';

export async function getDealActivities(dealId: string) {
  noStore();
  const tenantId = await getDefaultTenant();

  return await prisma.activity.findMany({
    where: { dealId, tenantId },
    orderBy: { createdAt: 'asc' }
  });
}

const WHATSAPP_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function sendMessage(dealId: string, content: string): Promise<{ success: boolean; error?: string }> {
  const tenantId = await getDefaultTenant();
  if (!tenantId) throw new Error('Tenant não encontrado');

  const deal = await prisma.deal.findUnique({
    where: { id: dealId, tenantId },
    include: { contact: true }
  });

  if (!deal || !deal.contact?.phone) {
    throw new Error('Deal ou Telefone não encontrado');
  }

  const integration = await prisma.integration.findFirst({
    where: { tenantId, provider: 'whatsapp', isActive: true }
  });

  const conversation = await prisma.conversation.findFirst({
    where: { dealId }
  });

  // Janela de 24h da Cloud API: texto livre só é aceito se o contato mandou
  // alguma mensagem nas últimas 24h. Fora disso a Meta recusa e exige um
  // template aprovado (HSM) — checamos antes de gravar/enviar pra não
  // fingir que a mensagem saiu quando na prática ela nunca vai chegar.
  if (integration) {
    const lastInbound = conversation
      ? await prisma.message.findFirst({
          where: { conversationId: conversation.id, authorType: 'CONTACT' },
          orderBy: { createdAt: 'desc' }
        })
      : null;

    const windowOpen = !!lastInbound && Date.now() - lastInbound.createdAt.getTime() < WHATSAPP_WINDOW_MS;

    if (!windowOpen) {
      return {
        success: false,
        error: 'Janela de 24h expirada: envie um template aprovado (HSM) para retomar a conversa.'
      };
    }
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
  if (conversation) {
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        authorType: 'USER',
        content
      }
    });
  }

  // 2. Disparar mensagem via API Oficial da Meta
  let result: { success: boolean; error?: string } = { success: true };

  if (integration?.apiKey && integration.config) {
    try {
      const config = JSON.parse(integration.config);
      result = await sendText(config.metaPhoneId, integration.apiKey, deal.contact.phone, content);
      if (!result.success) {
        console.error('❌ Erro ao enviar via Meta:', result.error);
      }
    } catch (error) {
      console.error('❌ Configuração da integração do WhatsApp inválida:', error);
      result = { success: false, error: 'Configuração da integração do WhatsApp inválida.' };
    }
  } else {
    console.warn('⚠️ Integração do WhatsApp não configurada ou sem Token Permanente.');
  }

  revalidatePath('/inbox');
  revalidatePath('/pipeline');

  return result;
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
