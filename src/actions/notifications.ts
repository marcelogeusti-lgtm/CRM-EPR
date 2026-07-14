'use server';

import { prisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/auth';

export type NotificationType = 'NEW_LEAD' | 'NEW_MESSAGE' | 'TASK_DUE';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  date: Date;
  dealId?: string;
}

const LOOKBACK_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Feed derivado — não existe tabela de notificações ainda, então isso é
 * somente leitura (sem marcar como lida/não lida). Junta leads novos,
 * mensagens recebidas e tarefas vencendo/atrasadas dos últimos 14 dias.
 */
export async function getNotifications(): Promise<NotificationItem[]> {
  const tenantId = await requireTenantId();
  const since = new Date(Date.now() - LOOKBACK_MS);
  const now = new Date();

  const [newDeals, newMessages, dueTasks] = await Promise.all([
    prisma.deal.findMany({
      where: { tenantId, createdAt: { gte: since } },
      include: { contact: true },
      orderBy: { createdAt: 'desc' },
      take: 15,
    }),
    prisma.activity.findMany({
      where: { tenantId, type: 'MESSAGE', author: 'Contact', createdAt: { gte: since } },
      include: { deal: { include: { contact: true } } },
      orderBy: { createdAt: 'desc' },
      take: 15,
    }),
    prisma.task.findMany({
      where: { tenantId, isCompleted: false, dueDate: { lte: now } },
      orderBy: { dueDate: 'desc' },
      take: 15,
    }),
  ]);

  const items: NotificationItem[] = [
    ...newDeals.map(deal => ({
      id: `lead-${deal.id}`,
      type: 'NEW_LEAD' as const,
      title: 'Novo lead',
      description: deal.contact?.name ? `${deal.contact.name} — ${deal.title}` : deal.title,
      date: deal.createdAt,
      dealId: deal.id,
    })),
    ...newMessages.map(activity => ({
      id: `msg-${activity.id}`,
      type: 'NEW_MESSAGE' as const,
      title: 'Nova mensagem recebida',
      description: activity.deal?.contact?.name
        ? `${activity.deal.contact.name}: ${activity.content.slice(0, 80)}`
        : activity.content.slice(0, 80),
      date: activity.createdAt,
      dealId: activity.dealId,
    })),
    ...dueTasks.map(task => ({
      id: `task-${task.id}`,
      type: 'TASK_DUE' as const,
      title: task.dueDate < now ? 'Tarefa atrasada' : 'Tarefa vence hoje',
      description: task.title,
      date: task.dueDate,
      dealId: task.dealId ?? undefined,
    })),
  ];

  return items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 30);
}
