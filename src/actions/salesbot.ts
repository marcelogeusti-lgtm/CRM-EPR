'use server';

import { prisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getAiAgent() {
  const tenantId = await requireTenantId();
  return prisma.aiAgent.findUnique({
    where: { tenantId },
    include: {
      scriptSteps: {
        orderBy: { order: 'asc' },
        include: { blocks: { orderBy: { order: 'asc' } } },
      },
      objections: { orderBy: { order: 'asc' } },
      knowledgeSources: { orderBy: { order: 'asc' } },
    },
  });
}

export async function getCompanySettings() {
  const tenantId = await requireTenantId();
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  return { pixKey: tenant?.pixKey || '' };
}

export async function saveCompanySettings(data: { pixKey: string }) {
  const tenantId = await requireTenantId();
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { pixKey: data.pixKey || null },
  });
  revalidatePath('/salesbot');
}

export interface ScriptStepBlockInput {
  type: string; // 'TEXT' | 'AUDIO' | 'IMAGE' | 'VIDEO'
  content: string | null; // texto literal — obrigatório se type = TEXT
  mediaUrl: string | null; // obrigatório se AUDIO/IMAGE/VIDEO
}

export interface ScriptStepInput {
  title: string;
  content: string;
  blocks: ScriptStepBlockInput[];
}

export interface ObjectionInput {
  title: string;
  response: string;
}

export interface KnowledgeSourceInput {
  title: string;
  content: string;
}

interface SaveAiAgentInput {
  systemPrompt: string;
  personalityTags: string[];
  responseSize: string;
  responseLanguage: string;
  pauseSeconds: number;
  directives: string[];
  typicalExpressions: string[];
  negativePrompt: string;
  attendanceSteps: ScriptStepInput[];
  closingSteps: ScriptStepInput[];
  objections: ObjectionInput[];
  knowledgeSources: KnowledgeSourceInput[];
  serviceOrderMode: string;
}

export async function saveAiAgent(data: SaveAiAgentInput) {
  const tenantId = await requireTenantId();

  const payload = {
    systemPrompt: data.systemPrompt,
    personalityTags: JSON.stringify(data.personalityTags),
    responseSize: data.responseSize,
    responseLanguage: data.responseLanguage,
    pauseSeconds: data.pauseSeconds,
    directives: JSON.stringify(data.directives),
    typicalExpressions: JSON.stringify(data.typicalExpressions),
    negativePrompt: data.negativePrompt,
    serviceOrderMode: data.serviceOrderMode,
  };

  const agent = await prisma.aiAgent.upsert({
    where: { tenantId },
    update: payload,
    create: { tenantId, ...payload },
  });

  // Substitui o conjunto inteiro de etapas/objeções a cada salvamento — a UI
  // edita tudo localmente (adicionar/remover/reordenar) e manda o estado
  // final de uma vez, então é mais simples e seguro do que tentar diffar
  // criar/atualizar/apagar item a item.
  //
  // Formato callback (não array) porque inserir os blocos de uma etapa
  // depende do id gerado ao criar a etapa.
  await prisma.$transaction(async (tx) => {
    await tx.agentScriptStep.deleteMany({ where: { aiAgentId: agent.id } });
    await tx.agentObjection.deleteMany({ where: { aiAgentId: agent.id } });
    await tx.agentKnowledgeSource.deleteMany({ where: { aiAgentId: agent.id } });

    const allSteps = [
      ...data.attendanceSteps.map((step, i) => ({ type: 'ATENDIMENTO', order: i, step })),
      ...data.closingSteps.map((step, i) => ({ type: 'FECHAMENTO', order: i, step })),
    ];

    for (const { type, order, step } of allSteps) {
      const createdStep = await tx.agentScriptStep.create({
        data: {
          aiAgentId: agent.id,
          type,
          order,
          title: step.title,
          content: step.content,
        },
      });

      if (step.blocks.length) {
        await tx.agentScriptStepBlock.createMany({
          data: step.blocks.map((block, i) => ({
            stepId: createdStep.id,
            order: i,
            type: block.type,
            content: block.content,
            mediaUrl: block.mediaUrl,
          })),
        });
      }
    }

    await tx.agentObjection.createMany({
      data: data.objections.map((obj, i) => ({
        aiAgentId: agent.id,
        order: i,
        title: obj.title,
        response: obj.response,
      })),
    });
    await tx.agentKnowledgeSource.createMany({
      data: data.knowledgeSources.map((source, i) => ({
        aiAgentId: agent.id,
        order: i,
        title: source.title,
        content: source.content,
      })),
    });
  });

  revalidatePath('/salesbot');
  return agent;
}

const STATS_PERIOD_DAYS = 30;

// Só as métricas que dá pra calcular com dado real hoje. "Taxa de
// conversão" fica de fora de propósito: o funil do tenant não tem uma
// etapa marcada como "ganho"/"fechado" (ver Stage no schema — só tem
// nome livre, sem flag), então qualquer cálculo de conversão seria
// inventado. Volta quando existir uma etapa final definida.
export async function getAiAgentStats() {
  const tenantId = await requireTenantId();
  const since = new Date(Date.now() - STATS_PERIOD_DAYS * 24 * 60 * 60 * 1000);

  const [aiMessages, newLeads] = await Promise.all([
    prisma.message.findMany({
      where: {
        authorType: 'AI',
        createdAt: { gte: since },
        conversation: { deal: { tenantId } },
      },
      select: { conversationId: true },
    }),
    prisma.deal.count({ where: { tenantId, createdAt: { gte: since } } }),
  ]);

  return {
    periodDays: STATS_PERIOD_DAYS,
    conversationsTouched: new Set(aiMessages.map(m => m.conversationId)).size,
    aiMessagesSent: aiMessages.length,
    newLeads,
  };
}

export async function setAiAgentActive(isActive: boolean) {
  const tenantId = await requireTenantId();

  const agent = await prisma.aiAgent.upsert({
    where: { tenantId },
    update: { isActive },
    create: { tenantId, isActive },
  });

  revalidatePath('/salesbot');
  return agent;
}
