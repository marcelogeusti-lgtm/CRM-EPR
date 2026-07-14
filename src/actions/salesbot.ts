'use server';

import { prisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getAiAgent() {
  const tenantId = await requireTenantId();
  return prisma.aiAgent.findUnique({ where: { tenantId } });
}

interface SaveAiAgentInput {
  systemPrompt: string;
  toneOfVoice: string;
  responseSize: string;
  pauseSeconds: number;
  directives: string[];
}

export async function saveAiAgent(data: SaveAiAgentInput) {
  const tenantId = await requireTenantId();

  const payload = {
    systemPrompt: data.systemPrompt,
    toneOfVoice: data.toneOfVoice,
    responseSize: data.responseSize,
    pauseSeconds: data.pauseSeconds,
    directives: JSON.stringify(data.directives),
  };

  const agent = await prisma.aiAgent.upsert({
    where: { tenantId },
    update: payload,
    create: { tenantId, ...payload },
  });

  revalidatePath('/salesbot');
  return agent;
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
