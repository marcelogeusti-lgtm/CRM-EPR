'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';


export async function getDashboardStats() {
  const user = await getCurrentUser();
  if (!user) return null;

  const tenantId = user.tenantId;

  const [deals, contactsCount, usersCount, activeIntegration, aiAgent] = await Promise.all([
    prisma.deal.findMany({ where: { tenantId }, include: { stage: true } }),
    prisma.contact.count({ where: { tenantId } }),
    prisma.user.count({ where: { tenantId } }),
    prisma.integration.findFirst({ where: { tenantId, isActive: true } }),
    prisma.aiAgent.findUnique({ where: { tenantId } }),
  ]);

  const totalLeads = deals.length;
  const totalValue = deals.reduce((acc, deal) => acc + (deal.value || 0), 0);

  // Pipeline distribution for the chart - dynamically generated based on the new Schema
  const stageCounts: Record<string, number> = {};
  deals.forEach(d => {
    const stageName = d.stage?.name || 'Sem Etapa';
    stageCounts[stageName] = (stageCounts[stageName] || 0) + 1;
  });

  const pipelineData = Object.keys(stageCounts).map(name => ({
    name,
    count: stageCounts[name]
  }));

  // Win rate based on stages that sound like a "Win" or "Oferta"
  const wonDeals = deals.filter(d => {
    const n = (d.stage?.name || '').toUpperCase();
    return n.includes('WON') || n.includes('OFERTA') || n.includes('GANHO');
  }).length;

  const winRate = totalLeads > 0 ? Math.round((wonDeals / totalLeads) * 100) : 0;

  return {
    userName: user.name,
    totalLeads,
    totalValue,
    winRate,
    pipelineData,
    contactsCount,
    usersCount,
    hasChannelConnected: !!activeIntegration,
    aiAgentConfigured: !!aiAgent?.systemPrompt,
    aiAgentActive: aiAgent?.isActive ?? false,
  };
}
