'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function saveIntegration(provider: string, apiKey?: string, webhookUrl?: string) {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error('Tenant not found');

  await prisma.integration.upsert({
    where: {
      tenantId_provider: {
        tenantId: tenant.id,
        provider: provider
      }
    },
    update: {
      apiKey: apiKey,
      webhookUrl: webhookUrl,
      isActive: true
    },
    create: {
      tenantId: tenant.id,
      provider: provider,
      apiKey: apiKey,
      webhookUrl: webhookUrl,
      isActive: true
    }
  });

  revalidatePath('/integrations');
  return { success: true };
}

export async function getIntegrations() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) return [];

  return prisma.integration.findMany({
    where: { tenantId: tenant.id }
  });
}
