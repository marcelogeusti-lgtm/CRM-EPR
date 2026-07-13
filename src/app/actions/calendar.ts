'use server';

import { prisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/auth';
import { revalidatePath } from 'next/cache';


export async function getTasks() {
  try {
    const tenantId = await requireTenantId();

    const tasks = await prisma.task.findMany({
      where: { tenantId },
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

    const tenantId = await requireTenantId();

    const task = await prisma.task.create({
      data: {
        title,
        type,
        dueDate,
        tenantId
      }
    });

    revalidatePath('/calendar');
    return { success: true, data: task };
  } catch (error) {
    console.error('Error creating task:', error);
    return { success: false, error: 'Failed to create task' };
  }
}
