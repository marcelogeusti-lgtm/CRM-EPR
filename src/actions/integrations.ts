'use server';

import { prisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { subscribeAppToWaba, getWhatsappProfile, registerPhoneNumber } from '@/lib/whatsapp';

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

// Puxa da Meta o estado atual do número (foto, nome verificado, se está
// ativo/verificado, qualidade) e guarda no config da integração — pra
// exibir sem o dono do CRM precisar abrir o painel da Meta.
export async function syncWhatsappProfile() {
  const tenantId = await requireTenantId();

  const integration = await prisma.integration.findUnique({
    where: { tenantId_provider: { tenantId, provider: 'whatsapp' } },
  });

  if (!integration?.apiKey) {
    return { success: false, error: 'Salve o Token de Acesso antes de sincronizar.' };
  }

  const config = integration.config ? JSON.parse(integration.config) : {};
  if (!config.metaPhoneId) {
    return { success: false, error: 'Informe o ID do Número de Telefone antes de sincronizar.' };
  }

  const result = await getWhatsappProfile(config.metaPhoneId, integration.apiKey);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  config.profile = { ...result.profile, syncedAt: new Date().toISOString() };

  await prisma.integration.update({
    where: { tenantId_provider: { tenantId, provider: 'whatsapp' } },
    data: { config: JSON.stringify(config) },
  });

  revalidatePath('/integrations');
  return { success: true, profile: config.profile };
}

// Registra o número na Cloud API (POST /{phone-number-id}/register) — sem
// isso a Meta não deixa o número enviar/receber mensagens pela API, mesmo
// com token, WABA ID e webhook certos.
export async function registerWhatsappNumber(pin: string) {
  const tenantId = await requireTenantId();

  if (!/^\d{6}$/.test(pin)) {
    return { success: false, error: 'O PIN deve ter exatamente 6 dígitos.' };
  }

  const integration = await prisma.integration.findUnique({
    where: { tenantId_provider: { tenantId, provider: 'whatsapp' } },
  });

  if (!integration?.apiKey) {
    return { success: false, error: 'Salve o Token de Acesso antes de registrar o número.' };
  }

  const config = integration.config ? JSON.parse(integration.config) : {};
  if (!config.metaPhoneId) {
    return { success: false, error: 'Informe o ID do Número de Telefone antes de registrar.' };
  }

  return registerPhoneNumber(config.metaPhoneId, integration.apiKey, pin);
}
