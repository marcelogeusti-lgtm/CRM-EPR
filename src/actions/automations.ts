'use server';

import { prisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getStageAutomations() {
  const tenantId = await requireTenantId();

  const [pipeline, n8nIntegration] = await Promise.all([
    prisma.pipeline.findFirst({
      where: { tenantId },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: { automation: true },
        },
      },
    }),
    prisma.integration.findFirst({
      where: { tenantId, provider: 'n8n', isActive: true },
    }),
  ]);

  return {
    stages: pipeline?.stages ?? [],
    hasN8nWebhook: !!n8nIntegration?.webhookUrl,
  };
}

/**
 * Roda a automação configurada para uma etapa quando um deal entra nela.
 * Chamado por updateLeadStage() em src/app/actions/pipeline.ts.
 * Nunca lança — falha de automação não pode quebrar a movimentação do deal.
 */
export async function runStageAutomations(tenantId: string, stageId: string, dealId: string) {
  try {
    const automation = await prisma.stageAutomation.findUnique({ where: { stageId } });
    if (!automation) return;

    if (automation.activateAgent) {
      // Tenant pode ter mais de um Agente de IA (um por número/integração)
      // — ativa todos. Refinar pra "qual agente ativar" é decisão de
      // produto separada, fora de escopo desta automação por etapa.
      await prisma.aiAgent.updateMany({ where: { tenantId }, data: { isActive: true } });
    }

    if (automation.fireN8nWebhook) {
      const integration = await prisma.integration.findFirst({
        where: { tenantId, provider: 'n8n', isActive: true },
      });
      if (integration?.webhookUrl) {
        const deal = await prisma.deal.findUnique({
          where: { id: dealId },
          include: { contact: true, stage: true },
        });
        await fetch(integration.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'deal.stage_changed',
            dealId,
            dealTitle: deal?.title,
            stageId,
            stageName: deal?.stage?.name,
            contact: deal?.contact ? { name: deal.contact.name, phone: deal.contact.phone } : null,
          }),
        }).catch(err => console.error('❌ [AUTOMATION] Falha ao chamar webhook n8n:', err));
      }
    }
  } catch (error) {
    console.error('❌ [AUTOMATION] Falha ao rodar automação da etapa:', error);
  }
}

export async function setStageAutomation(
  stageId: string,
  data: { activateAgent?: boolean; fireN8nWebhook?: boolean }
) {
  const tenantId = await requireTenantId();

  // Confere que a etapa pertence a um pipeline deste tenant antes de gravar.
  const stage = await prisma.stage.findFirst({
    where: { id: stageId, pipeline: { tenantId } },
  });
  if (!stage) throw new Error('Etapa não encontrada');

  await prisma.stageAutomation.upsert({
    where: { stageId },
    update: data,
    create: { tenantId, stageId, ...data },
  });

  revalidatePath('/automations');
}
