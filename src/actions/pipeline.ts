'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Em produção, isso seria instanciado globalmente
const prisma = new PrismaClient();

// Utilitário para garantir que existe um Tenant (Workspace) padrão
async function getDefaultTenant() {
  let tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { name: 'Minha Empresa' }
    });
  }
  return tenant.id;
}

export async function getDeals() {
  const tenantId = await getDefaultTenant();
  
  const deals = await prisma.deal.findMany({
    where: { tenantId },
    include: {
      contact: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return deals;
}

export async function updateDealStage(dealId: string, newStage: string) {
  const tenantId = await getDefaultTenant();

  await prisma.deal.update({
    where: { id: dealId, tenantId },
    data: { stage: newStage }
  });

  // Log da atividade para o Kommo Inbox View
  await prisma.activity.create({
    data: {
      tenantId,
      dealId,
      type: 'STATUS_CHANGE',
      content: `Movido para a etapa: ${newStage}`,
      author: 'System'
    }
  });

  revalidatePath('/pipeline');
}

export async function createDemoDeal() {
  const tenantId = await getDefaultTenant();

  const contact = await prisma.contact.create({
    data: {
      tenantId,
      name: 'João Carlos',
      phone: '5511999999999'
    }
  });

  await prisma.deal.create({
    data: {
      tenantId,
      contactId: contact.id,
      title: 'Site Institucional',
      value: 1500,
      stage: 'NEW'
    }
  });

  revalidatePath('/pipeline');
}
