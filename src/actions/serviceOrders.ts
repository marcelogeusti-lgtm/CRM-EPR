'use server';

import { prisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

export async function getServiceOrders() {
  const tenantId = await requireTenantId();
  return prisma.serviceOrder.findMany({
    where: { tenantId },
    include: { contact: true, employee: true },
    orderBy: { number: 'desc' },
  });
}

export interface CreateServiceOrderInput {
  title: string;
  description?: string;
  value: number;
  contactId?: string;
  employeeId?: string;
  scheduledAt?: string; // data ISO vinda do formulário
}

const MAX_NUMBER_ATTEMPTS = 3;

export async function createServiceOrder(data: CreateServiceOrderInput) {
  const tenantId = await requireTenantId();

  if (!data.title.trim()) {
    return { success: false, error: 'Título é obrigatório.' };
  }

  // `number` é sequencial por tenant, calculado dentro da transação. Sob
  // concorrência real (duas OS criadas no mesmíssimo instante) a constraint
  // única pode colidir raramente — nesse caso tenta de novo com o próximo
  // número, em vez de propagar o erro pro usuário.
  for (let attempt = 0; attempt < MAX_NUMBER_ATTEMPTS; attempt++) {
    try {
      const order = await prisma.$transaction(async tx => {
        const last = await tx.serviceOrder.findFirst({
          where: { tenantId },
          orderBy: { number: 'desc' },
          select: { number: true },
        });

        return tx.serviceOrder.create({
          data: {
            tenantId,
            number: (last?.number ?? 0) + 1,
            title: data.title.trim(),
            description: data.description?.trim() || null,
            value: data.value,
            contactId: data.contactId || null,
            employeeId: data.employeeId || null,
            scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
            source: 'MANUAL',
          },
        });
      });

      revalidatePath('/service-orders');
      return { success: true, data: order };
    } catch (error) {
      const isUniqueCollision = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
      if (isUniqueCollision && attempt < MAX_NUMBER_ATTEMPTS - 1) continue;
      console.error('Error creating service order:', error);
      return { success: false, error: 'Falha ao criar Ordem de Serviço.' };
    }
  }

  return { success: false, error: 'Falha ao criar Ordem de Serviço.' };
}

export async function updateServiceOrderStatus(id: string, status: string) {
  const tenantId = await requireTenantId();

  const result = await prisma.serviceOrder.updateMany({
    where: { id, tenantId },
    data: {
      status,
      completedAt: status === 'CONCLUIDA' ? new Date() : undefined,
    },
  });

  if (result.count === 0) return { success: false, error: 'Ordem de Serviço não encontrada.' };

  revalidatePath('/service-orders');
  return { success: true };
}

export interface UpdateServiceOrderInput {
  employeeId?: string | null;
  paymentStatus?: string;
  paymentMethod?: string | null;
  value?: number;
}

export async function updateServiceOrder(id: string, data: UpdateServiceOrderInput) {
  const tenantId = await requireTenantId();

  const result = await prisma.serviceOrder.updateMany({
    where: { id, tenantId },
    data,
  });

  if (result.count === 0) return { success: false, error: 'Ordem de Serviço não encontrada.' };

  revalidatePath('/service-orders');
  return { success: true };
}
