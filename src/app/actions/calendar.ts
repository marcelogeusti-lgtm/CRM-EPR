'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

// Placeholder Tenant ID until Auth is implemented
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000000';

export async function getTasks() {
  try {
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      tenant = await prisma.tenant.create({ data: { name: 'Nexus Workspace' } });
    }

    const tasks = await prisma.task.findMany({
      where: { tenantId: tenant.id },
      include: {
        deal: {
          select: { title: true }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    return { success: true, data: tasks };
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return { success: false, error: 'Failed to fetch tasks' };
  }
}

export async function createTask(formData: FormData) {
  try {
    const title = formData.get('title') as string;
    const type = formData.get('type') as string || 'MEETING';
    
    // Convert string 'YYYY-MM-DDTHH:mm' to Date object
    const dateStr = formData.get('dueDate') as string;
    const dueDate = dateStr ? new Date(dateStr) : new Date();

    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      tenant = await prisma.tenant.create({ data: { name: 'Nexus Workspace' } });
    }

    const task = await prisma.task.create({
      data: {
        title,
        type,
        dueDate,
        tenantId: tenant.id
      }
    });

    revalidatePath('/calendar');
    return { success: true, data: task };
  } catch (error) {
    console.error('Error creating task:', error);
    return { success: false, error: 'Failed to create task' };
  }
}
