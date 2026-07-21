'use server';

import { prisma } from '@/lib/prisma';
import { requireTenantId, requireUser, requireAdmin } from '@/lib/auth';
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

const STATUS_LABELS: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  ABERTA: 'Aberta',
  EM_ANDAMENTO: 'Em Andamento',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

export async function updateServiceOrderStatus(id: string, status: string, reason?: string) {
  const user = await requireUser();
  const tenantId = user.tenantId;

  const order = await prisma.serviceOrder.findFirst({ where: { id, tenantId } });
  if (!order) return { success: false, error: 'Ordem de Serviço não encontrada.' };

  if (order.status === status) {
    return { success: true }; // nada mudou, não precisa validar nem registrar
  }

  const isReopeningFromConcluida = order.status === 'CONCLUIDA' && status !== 'CONCLUIDA';

  if (isReopeningFromConcluida) {
    try {
      await requireAdmin();
    } catch {
      return { success: false, error: 'Só administradores podem reabrir uma Ordem de Serviço concluída.' };
    }
    if (!reason?.trim()) {
      return { success: false, error: 'Informe o motivo da reabertura.' };
    }
  }

  await prisma.serviceOrder.update({
    where: { id: order.id },
    data: {
      status,
      completedAt: status === 'CONCLUIDA' ? new Date() : null,
    },
  });

  await prisma.serviceOrderHistory.create({
    data: {
      tenantId,
      serviceOrderId: order.id,
      userId: user.id,
      field: 'STATUS',
      fromValue: STATUS_LABELS[order.status] || order.status,
      toValue: STATUS_LABELS[status] || status,
      reason: isReopeningFromConcluida ? reason!.trim() : null,
    },
  });

  revalidatePath('/service-orders');
  return { success: true };
}

export interface UpdateServiceOrderInput {
  employeeId?: string | null;
  paymentStatus?: string;
  paymentMethod?: string | null;
  value?: number;
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Pagamento Pendente',
  PARCIAL: 'Pagamento Parcial',
  PAGO: 'Pago',
};

export async function updateServiceOrder(id: string, data: UpdateServiceOrderInput) {
  const user = await requireUser();
  const tenantId = user.tenantId;

  const order = await prisma.serviceOrder.findFirst({ where: { id, tenantId } });
  if (!order) return { success: false, error: 'Ordem de Serviço não encontrada.' };

  const isEmployeeChange = 'employeeId' in data && data.employeeId !== order.employeeId;
  const isPaymentStatusChange = 'paymentStatus' in data && data.paymentStatus !== order.paymentStatus;

  let fromEmployeeName: string | null = null;
  let toEmployeeName: string | null = null;
  if (isEmployeeChange) {
    const [fromEmployee, toEmployee] = await Promise.all([
      order.employeeId ? prisma.employee.findUnique({ where: { id: order.employeeId } }) : null,
      data.employeeId ? prisma.employee.findUnique({ where: { id: data.employeeId } }) : null,
    ]);
    fromEmployeeName = fromEmployee?.name || null;
    toEmployeeName = toEmployee?.name || null;
  }

  await prisma.serviceOrder.update({ where: { id: order.id }, data });

  if (isEmployeeChange) {
    await prisma.serviceOrderHistory.create({
      data: {
        tenantId,
        serviceOrderId: order.id,
        userId: user.id,
        field: 'EMPLOYEE',
        fromValue: fromEmployeeName,
        toValue: toEmployeeName,
        reason: null,
      },
    });
  }

  if (isPaymentStatusChange) {
    const newPaymentStatus = data.paymentStatus!;
    await prisma.serviceOrderHistory.create({
      data: {
        tenantId,
        serviceOrderId: order.id,
        userId: user.id,
        field: 'PAYMENT',
        fromValue: PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus,
        toValue: PAYMENT_STATUS_LABELS[newPaymentStatus] || newPaymentStatus,
        reason: null,
      },
    });
  }

  revalidatePath('/service-orders');
  return { success: true };
}

export async function getServiceOrderHistory(serviceOrderId: string) {
  const tenantId = await requireTenantId();

  return prisma.serviceOrderHistory.findMany({
    where: { serviceOrderId, tenantId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
}
