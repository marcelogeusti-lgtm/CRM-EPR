'use server';

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getFeedbacks() {
  const user = await requireUser();

  return prisma.feedback.findMany({
    where: { tenantId: user.tenantId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function createFeedback(type: string, message: string) {
  const user = await requireUser();
  if (!message.trim()) throw new Error('Mensagem não pode ser vazia');

  await prisma.feedback.create({
    data: {
      tenantId: user.tenantId,
      userId: user.id,
      type,
      message: message.trim(),
    },
  });

  revalidatePath('/feedback');
}
