'use server';

import { prisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { subscribeAppToWaba } from '@/lib/whatsapp';

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

// Inscreve o app na WABA do tenant pra ativar o recebimento de webhooks
// (necessário uma vez por número real/produção — ver src/lib/whatsapp.ts).
export async function subscribeWhatsappWebhook() {
  const tenantId = await requireTenantId();

  const integration = await prisma.integration.findUnique({
    where: { tenantId_provider: { tenantId, provider: 'whatsapp' } },
  });

  if (!integration?.apiKey) {
    return { success: false, error: 'Salve o Token de Acesso antes de inscrever o webhook.' };
  }

  const config = integration.config ? JSON.parse(integration.config) : {};
  if (!config.metaWabaId) {
    return { success: false, error: 'Informe o ID da Conta do WhatsApp Business (WABA ID) antes de inscrever.' };
  }

  return subscribeAppToWaba(config.metaWabaId, integration.apiKey);
}
