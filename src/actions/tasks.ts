'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getPendingTasks() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) return [];

  // Tarefas são Activities do tipo TASK
  const tasks = await prisma.activity.findMany({
    where: { 
      tenantId: tenant.id,
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
