import { prisma } from '@/lib/prisma';
import type { AutomationFlow, AutomationFlowNode, AutomationFlowEdge } from '@prisma/client';
import { sendText, sendMedia, type SendableMediaType } from '@/lib/whatsapp';
import { sendAiAgentReply, type AiReplyContext } from '@/lib/aiReply';
import { addTagToContact } from '@/lib/tags';

type FlowWithGraph = AutomationFlow & { nodes: AutomationFlowNode[]; edges: AutomationFlowEdge[] };

/**
 * Acha o primeiro AutomationFlow ativo do tenant cujo gatilho casa com a
 * mensagem recebida. Chamado pelo webhook do WhatsApp antes de cair no
 * comportamento padrão do Agente de IA (sendAiAgentReply) — ver regra de
 * precedência no plano desta fase.
 */
export async function matchTrigger(
  tenantId: string,
  messageText: string,
  isFirstMessage: boolean
): Promise<FlowWithGraph | null> {
  const flows = await prisma.automationFlow.findMany({
    where: { tenantId, isActive: true },
    include: { nodes: true, edges: true },
  });

  for (const flow of flows) {
    if (flow.triggerType === 'WELCOME' && isFirstMessage) return flow;

    if (flow.triggerType === 'KEYWORD') {
      try {
        const config = flow.triggerConfig ? JSON.parse(flow.triggerConfig) : {};
        const keywords: string[] = Array.isArray(config.keywords) ? config.keywords : [];
        const lowerMessage = messageText.toLowerCase();
        if (keywords.some((k) => k && lowerMessage.includes(String(k).toLowerCase()))) {
          return flow;
        }
      } catch {
        // triggerConfig malformado — ignora esse fluxo em vez de derrubar o webhook
      }
    }
  }

  return null;
}

export interface RunFlowContext extends AiReplyContext {
  contactId: string;
  messageText: string;
}

/**
 * Executa o grafo do fluxo a partir do nó TRIGGER até não ter mais próximo
 * nó (ou até MAX_STEPS, proteção contra ciclo no grafo). Sem nó de espera
 * nesta fase — roda tudo numa passada só, dentro da mesma invocação do
 * webhook (ver "Descobertas" no plano desta fase: por isso não existe
 * estado de execução persistente por contato).
 */
export async function runFlow(flow: FlowWithGraph, context: RunFlowContext): Promise<void> {
  const nodeById = new Map(flow.nodes.map((n) => [n.id, n]));
  const outgoingEdges = (nodeId: string) => flow.edges.filter((e) => e.sourceNodeId === nodeId);

  let current = flow.nodes.find((n) => n.type === 'TRIGGER');
  if (!current) return;

  const visited = new Set<string>();
  const MAX_STEPS = 50;

  for (let step = 0; current && step < MAX_STEPS; step++) {
    if (visited.has(current.id)) break;
    visited.add(current.id);

    let nextEdges = outgoingEdges(current.id);

    if (current.type !== 'TRIGGER') {
      let data: Record<string, unknown> = {};
      try {
        data = current.data ? JSON.parse(current.data) : {};
      } catch {
        data = {};
      }

      switch (current.type) {
        case 'SEND_MESSAGE': {
          const text = typeof data.text === 'string' ? data.text : '';
          if (text) {
            const result = await sendText(context.phoneNumberId, context.accessToken, context.toPhone, text);
            if (result.success) await recordOutbound(context, text);
            else console.error('❌ [FLOW ENGINE] Falha ao enviar SEND_MESSAGE:', result.error);
          }
          break;
        }
        case 'SEND_MEDIA': {
          const mediaUrl = typeof data.mediaUrl === 'string' ? data.mediaUrl : '';
          const mediaType = data.mediaType as SendableMediaType | undefined;
          if (mediaUrl && mediaType) {
            const result = await sendMedia(context.phoneNumberId, context.accessToken, context.toPhone, mediaType, mediaUrl);
            if (result.success) await recordOutbound(context, `[${mediaType.toLowerCase()}] mídia do fluxo`);
            else console.error('❌ [FLOW ENGINE] Falha ao enviar SEND_MEDIA:', result.error);
          }
          break;
        }
        case 'ADD_TAG': {
          const tagName = typeof data.tagName === 'string' ? data.tagName.trim() : '';
          if (tagName) await addTagToContact(context.tenantId, context.contactId, tagName);
          break;
        }
        case 'CONDITION': {
          const result = await evaluateCondition(data, context);
          nextEdges = nextEdges.filter((e) => e.sourceHandle === (result ? 'true' : 'false'));
          break;
        }
        case 'AI_HANDOFF': {
          await sendAiAgentReply(context);
          break;
        }
      }
    }

    const nextEdge = nextEdges[0];
    current = nextEdge ? nodeById.get(nextEdge.targetNodeId) : undefined;
  }
}

async function recordOutbound(context: RunFlowContext, content: string) {
  await prisma.message.create({
    data: { conversationId: context.conversationId, authorType: 'AI', content },
  });
  await prisma.activity.create({
    data: { tenantId: context.tenantId, dealId: context.dealId, type: 'MESSAGE', content, author: 'Agent' },
  });
}

async function evaluateCondition(data: Record<string, unknown>, context: RunFlowContext): Promise<boolean> {
  const rule = data.rule;
  const value = typeof data.value === 'string' ? data.value : '';

  if (rule === 'MESSAGE_CONTAINS') {
    return context.messageText.toLowerCase().includes(value.toLowerCase());
  }
  if (rule === 'HAS_TAG') {
    const count = await prisma.tagsOnContacts.count({
      where: { contactId: context.contactId, tag: { tenantId: context.tenantId, name: value } },
    });
    return count > 0;
  }
  return false;
}
