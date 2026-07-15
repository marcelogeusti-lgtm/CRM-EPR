'use server';

import { prisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/auth';

const PERIOD_DAYS = 30;

export async function getInsightsStats() {
  const tenantId = await requireTenantId();
  const since = new Date(Date.now() - PERIOD_DAYS * 24 * 60 * 60 * 1000);

  const [messages, channels, aiAgent, tasks, newLeads] = await Promise.all([
    prisma.message.findMany({
      where: { conversation: { deal: { tenantId } }, createdAt: { gte: since } },
      select: { authorType: true, conversation: { select: { channel: { select: { provider: true, name: true } } } } },
    }),
    prisma.channel.findMany({ where: { tenantId } }),
    prisma.aiAgent.findUnique({ where: { tenantId } }),
    prisma.task.findMany({ where: { tenantId }, select: { isCompleted: true } }),
    prisma.deal.count({ where: { tenantId, createdAt: { gte: since } } }),
  ]);

  const byAuthorType: Record<string, number> = {};
  const byChannel: Record<string, number> = {};
  for (const m of messages) {
    byAuthorType[m.authorType] = (byAuthorType[m.authorType] || 0) + 1;
    const label = m.conversation?.channel?.name || m.conversation?.channel?.provider || 'Sem canal';
    byChannel[label] = (byChannel[label] || 0) + 1;
  }

  const completedTasks = tasks.filter(t => t.isCompleted).length;

  return {
    periodDays: PERIOD_DAYS,
    totalMessages: messages.length,
    receivedMessages: byAuthorType['CONTACT'] || 0,
    sentByAgentMessages: byAuthorType['USER'] || 0,
    sentByAiMessages: byAuthorType['AI'] || 0,
    channelBreakdown: Object.entries(byChannel).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    channelCount: channels.length,
    aiAgentActive: aiAgent?.isActive ?? false,
    totalTasks: tasks.length,
    completedTasks,
    pendingTasks: tasks.length - completedTasks,
    newLeads,
  };
}
