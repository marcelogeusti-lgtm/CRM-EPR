'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getDashboardStats() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) return null;

  const deals = await prisma.deal.findMany({
    where: { tenantId: tenant.id }
  });

  const totalLeads = deals.length;
  const totalValue = deals.reduce((acc, deal) => acc + (deal.value || 0), 0);
  
  // Pipeline distribution for the chart
  const pipelineData = [
    { name: 'Novos', count: deals.filter(d => d.stage === 'NEW').length },
    { name: 'Conversando', count: deals.filter(d => d.stage === 'IN_PROGRESS').length },
    { name: 'Proposta', count: deals.filter(d => d.stage === 'PROPOSAL').length },
    { name: 'Fechados', count: deals.filter(d => d.stage === 'WON').length },
    { name: 'Perdidos', count: deals.filter(d => d.stage === 'LOST').length }
  ];

  const winRate = totalLeads > 0 
    ? Math.round((deals.filter(d => d.stage === 'WON').length / totalLeads) * 100)
    : 0;

  return {
    totalLeads,
    totalValue,
    winRate,
    pipelineData
  };
}
