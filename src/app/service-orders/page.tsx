import React from 'react';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getServiceOrders } from '@/actions/serviceOrders';
import { getEmployees } from '@/actions/employees';
import { ServiceOrdersClient } from './service-orders-client';

export const dynamic = 'force-dynamic';

export default async function ServiceOrdersPage() {
  // Sequencial, não Promise.all: cada chamada abaixo valida a sessão contra
  // o Supabase (supabase.auth.getUser()). Se o token estiver expirado bem
  // nesse instante, rodar essas chamadas em paralelo faz duas ou três
  // tentativas de renovação de token colidirem entre si (visto nos logs do
  // Supabase — duas renovações pro mesmo usuário com 1s de diferença),
  // derrubando a sessão de quem está genuinamente logado. Rodando em série,
  // a primeira chamada já deixa o cookie renovado pronto pras próximas.
  const user = await getCurrentUser();
  const orders = await getServiceOrders();
  const employees = await getEmployees();
  const contacts = user
    ? await prisma.contact.findMany({ where: { tenantId: user.tenantId }, orderBy: { name: 'asc' } })
    : [];

  return (
    <ServiceOrdersClient initialOrders={orders} initialEmployees={employees} contacts={contacts} />
  );
}
