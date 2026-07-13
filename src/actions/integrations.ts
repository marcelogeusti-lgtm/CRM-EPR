'use server';

import { prisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/auth';
import { revalidatePath } from 'next/cache';


export async function saveIntegration(provider: string, apiKey?: string, webhookUrl?: string, config?: string) {
  const tenantId = await requireTenantId();

  await prisma.integration.upsert({
    where: {
      tenantId_provider: {
        tenantId,
        provider: provider
      }
    },
    update: {
      apiKey: apiKey,
      webhookUrl: webhookUrl,
      config: config,
      isActive: true
    },
    create: {
      tenantId,
      provider: provider,
      apiKey: apiKey,
      webhookUrl: webhookUrl,
      config: config,
      isActive: true
    }
  });

  revalidatePath('/integrations');
  return { success: true };
}

export async function getIntegrations() {
  const tenantId = await requireTenantId();

  return prisma.integration.findMany({
    where: { tenantId }
  });
}
