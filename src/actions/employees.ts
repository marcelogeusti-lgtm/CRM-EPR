'use server';

import { prisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getEmployees() {
  const tenantId = await requireTenantId();
  return prisma.employee.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
  });
}

export async function createEmployee(data: { name: string; phone?: string; specialty?: string }) {
  const tenantId = await requireTenantId();

  if (!data.name.trim()) {
    return { success: false, error: 'Nome é obrigatório.' };
  }

  const employee = await prisma.employee.create({
    data: {
      tenantId,
      name: data.name.trim(),
      phone: data.phone?.trim() || null,
      specialty: data.specialty?.trim() || null,
    },
  });

  revalidatePath('/service-orders');
  return { success: true, data: employee };
}

export async function toggleEmployeeActive(id: string, isActive: boolean) {
  const tenantId = await requireTenantId();

  const result = await prisma.employee.updateMany({
    where: { id, tenantId },
    data: { isActive },
  });

  if (result.count === 0) return { success: false, error: 'Funcionário não encontrado.' };

  revalidatePath('/service-orders');
  return { success: true };
}
