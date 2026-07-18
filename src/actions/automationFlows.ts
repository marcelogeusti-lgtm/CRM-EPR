'use server';

import { prisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function getFlows() {
  const tenantId = await requireTenantId();
  return prisma.automationFlow.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getFlow(id: string) {
  const tenantId = await requireTenantId();
  return prisma.automationFlow.findFirst({
    where: { id, tenantId },
    include: { nodes: true, edges: true },
  });
}

/**
 * Cria um fluxo em branco com um nó TRIGGER inicial e redireciona pro
 * editor. O TRIGGER começa como KEYWORD sem palavras-chave — o usuário
 * configura no canvas antes de ativar.
 */
export async function createFlow() {
  const tenantId = await requireTenantId();

  const flow = await prisma.automationFlow.create({
    data: {
      tenantId,
      name: 'Novo fluxo',
      triggerType: 'KEYWORD',
      triggerConfig: JSON.stringify({ keywords: [] }),
      isActive: false,
      nodes: {
        create: [
          { type: 'TRIGGER', positionX: 80, positionY: 200, data: '{}' },
        ],
      },
    },
  });

  redirect(`/automations/flows/${flow.id}`);
}

export interface FlowNodeInput {
  id: string;
  type: string;
  positionX: number;
  positionY: number;
  data: string;
}

export interface FlowEdgeInput {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle: string | null;
}

/**
 * Salva nome/gatilho + grafo inteiro (nós e conexões) numa transação só.
 * Substitui todo o conjunto a cada save — o canvas edita tudo localmente
 * (arrastar, conectar, remover) e manda o estado final de uma vez, mesmo
 * padrão de saveAiAgent() em src/actions/salesbot.ts. Os ids são gerados
 * no cliente (React Flow) e reaproveitados aqui — Prisma aceita id
 * explícito no create mesmo com @default(uuid()) no schema.
 */
export async function saveFlow(
  id: string,
  data: {
    name: string;
    triggerType: string;
    triggerConfig: string;
    nodes: FlowNodeInput[];
    edges: FlowEdgeInput[];
  }
) {
  const tenantId = await requireTenantId();

  const flow = await prisma.automationFlow.findFirst({ where: { id, tenantId } });
  if (!flow) throw new Error('Fluxo não encontrado.');

  await prisma.$transaction([
    prisma.automationFlow.update({
      where: { id },
      data: { name: data.name, triggerType: data.triggerType, triggerConfig: data.triggerConfig },
    }),
    prisma.automationFlowEdge.deleteMany({ where: { flowId: id } }),
    prisma.automationFlowNode.deleteMany({ where: { flowId: id } }),
    prisma.automationFlowNode.createMany({
      data: data.nodes.map((n) => ({
        id: n.id,
        flowId: id,
        type: n.type,
        positionX: n.positionX,
        positionY: n.positionY,
        data: n.data,
      })),
    }),
    prisma.automationFlowEdge.createMany({
      data: data.edges.map((e) => ({
        id: e.id,
        flowId: id,
        sourceNodeId: e.sourceNodeId,
        targetNodeId: e.targetNodeId,
        sourceHandle: e.sourceHandle,
      })),
    }),
  ]);

  revalidatePath(`/automations/flows/${id}`);
  revalidatePath('/automations');
}

export async function setFlowActive(id: string, isActive: boolean) {
  const tenantId = await requireTenantId();
  const flow = await prisma.automationFlow.findFirst({ where: { id, tenantId } });
  if (!flow) throw new Error('Fluxo não encontrado.');

  await prisma.automationFlow.update({ where: { id }, data: { isActive } });
  revalidatePath(`/automations/flows/${id}`);
  revalidatePath('/automations');
}

export async function deleteFlow(id: string) {
  const tenantId = await requireTenantId();
  const flow = await prisma.automationFlow.findFirst({ where: { id, tenantId } });
  if (!flow) throw new Error('Fluxo não encontrado.');

  await prisma.automationFlow.delete({ where: { id } });
  revalidatePath('/automations');
}
