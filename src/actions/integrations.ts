'use server';

import { prisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// Únicos provedores com lógica real por trás (envio/recebimento de mensagem,
// disparo de webhook). Os demais aparecem no catálogo de apps só como vitrine —
// bloqueado aqui pra não deixar o tenant "instalar" algo que não faz nada.
const IMPLEMENTED_PROVIDERS = ['whatsapp', 'n8n'];

export async function saveIntegration(provider: string, apiKey?: string, webhookUrl?: string, config?: string) {
  const tenantId = await requireTenantId();

  if (!IMPLEMENTED_PROVIDERS.includes(provider)) {
    return { success: false, error: 'Esta integração ainda não está disponível.' };
  }

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
