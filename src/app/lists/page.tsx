import React from 'react';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ListsClient } from './lists-client';

export const dynamic = 'force-dynamic';

export default async function ListsPage() {
  const user = await getCurrentUser();

  const contacts = user ? await prisma.contact.findMany({
    where: { tenantId: user.tenantId },
    include: { company: true },
    orderBy: { createdAt: 'desc' }
  }) : [];

  return <ListsClient initialContacts={contacts} />;
}
