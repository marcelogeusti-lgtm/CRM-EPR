import React from 'react';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getServiceOrders } from '@/actions/serviceOrders';
import { getEmployees } from '@/actions/employees';
import { ServiceOrdersClient } from './service-orders-client';

export const dynamic = 'force-dynamic';

export default async function ServiceOrdersPage() {
  const user = await getCurrentUser();

  const [orders, employees, contacts] = await Promise.all([
    getServiceOrders(),
    getEmployees(),
    user
      ? prisma.contact.findMany({ where: { tenantId: user.tenantId }, orderBy: { name: 'asc' } })
      : Promise.resolve([]),
  ]);

  return (
    <ServiceOrdersClient initialOrders={orders} initialEmployees={employees} contacts={contacts} />
  );
}
