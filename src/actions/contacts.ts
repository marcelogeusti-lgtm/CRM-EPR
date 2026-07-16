'use server';

import { prisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createContact(formData: FormData) {
  const tenantId = await requireTenantId();

  const name = (formData.get('name') as string || '').trim();
  const phone = (formData.get('phone') as string || '').trim();
  const email = (formData.get('email') as string || '').trim();

  if (!name) {
    return { success: false, error: 'Nome é obrigatório.' };
  }

  const contact = await prisma.contact.create({
    data: {
      tenantId,
      name,
      phone: phone || null,
      email: email || null,
    },
  });

  revalidatePath('/lists');
  return { success: true, data: contact };
}
