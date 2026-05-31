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

  // 2. Disparar Webhook para o n8n
  // O seu n8n deve ter um webhook recebendo POST nesta URL
  const N8N_OUTGOING_WEBHOOK_URL = process.env.N8N_OUTGOING_WEBHOOK_URL || 'http://localhost:5678/webhook/send-whatsapp';

  try {
    await fetch(N8N_OUTGOING_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contactName: deal.contact.name,
        phone: deal.contact.phone,
        message: content,
        dealId: deal.id
      })
    });
  } catch (error) {
    console.error('Falha ao enviar webhook pro n8n:', error);
    // Em um sistema real, você trataria retentativas aqui
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
