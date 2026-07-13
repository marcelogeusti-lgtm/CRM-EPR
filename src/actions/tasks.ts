'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';


export async function getPendingTasks() {
  const user = await getCurrentUser();
  if (!user) return [];

  // Tarefas são Activities do tipo TASK
  const tasks = await prisma.activity.findMany({
    where: {
      tenantId: user.tenantId,
      type: 'TASK'
    },
    include: {
      deal: {
        include: { contact: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return tasks;
}
