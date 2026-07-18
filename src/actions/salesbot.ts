'use server';

import { prisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getAiAgent() {
  const tenantId = await requireTenantId();
  return prisma.aiAgent.findUnique({
    where: { tenantId },
    include: {
      scriptSteps: { orderBy: { order: 'asc' } },
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

export interface ScriptStepInput {
  title: string;
  content: string;
  mediaType: string; // 'TEXT' | 'AUDIO' | 'IMAGE' | 'VIDEO'
  mediaUrl: string | null;
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
  await prisma.$transaction([
    prisma.agentScriptStep.deleteMany({ where: { aiAgentId: agent.id } }),
    prisma.agentObjection.deleteMany({ where: { aiAgentId: agent.id } }),
    prisma.agentKnowledgeSource.deleteMany({ where: { aiAgentId: agent.id } }),
    prisma.agentScriptStep.createMany({
      data: [
        ...data.attendanceSteps.map((step, i) => ({
          aiAgentId: agent.id,
          type: 'ATENDIMENTO',
          order: i,
          title: step.title,
          content: step.content,
          mediaType: step.mediaType,
          mediaUrl: step.mediaUrl,
        })),
        ...data.closingSteps.map((step, i) => ({
          aiAgentId: agent.id,
          type: 'FECHAMENTO',
          order: i,
          title: step.title,
          content: step.content,
          mediaType: step.mediaType,
          mediaUrl: step.mediaUrl,
        })),
      ],
    }),
    prisma.agentObjection.createMany({
      data: data.objections.map((obj, i) => ({
        aiAgentId: agent.id,
        order: i,
        title: obj.title,
        response: obj.response,
      })),
    }),
    prisma.agentKnowledgeSource.createMany({
      data: data.knowledgeSources.map((source, i) => ({
        aiAgentId: agent.id,
        order: i,
        title: source.title,
        content: source.content,
      })),
    }),
  ]);

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
