import { createOpenAI } from '@ai-sdk/openai';
import { generateText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendText, sendMedia, type SendableMediaType } from '@/lib/whatsapp';
import { buildSystemPrompt } from '@/lib/agentPrompt';

export interface AiReplyContext {
  tenantId: string;
  dealId: string;
  conversationId: string;
  toPhone: string;
  phoneNumberId: string;
  accessToken: string;
}

/**
 * Gera e envia a resposta do Agente de IA pro WhatsApp. Chamada tanto pelo
 * fluxo padrão do webhook (quando nenhum AutomationFlow casa com a
 * mensagem) quanto pelo nó AI_HANDOFF do motor de fluxo
 * (src/lib/flowEngine.ts) — ponto único, sem duplicar a lógica de prompt/
 * tool-calling/envio.
 */
export async function sendAiAgentReply(params: AiReplyContext) {
  if (!params.accessToken) return;

  const agent = await prisma.aiAgent.findUnique({
    where: { tenantId: params.tenantId },
    include: { scriptSteps: true, objections: true, knowledgeSources: true },
  });
  if (!agent || !agent.isActive) return;

  const openaiConfig = await prisma.systemConfig.findUnique({ where: { key: 'OPENAI_MASTER_KEY' } });
  if (!openaiConfig?.value) {
    console.warn('⚠️ [AI REPLY] Agente de IA ativo, mas a chave mestre da OpenAI não está configurada em /admin.');
    return;
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: params.tenantId } });
  const systemPrompt = buildSystemPrompt(agent, tenant?.pixKey);

  // Últimas mensagens da conversa como histórico — dá contexto pra IA sem
  // reprocessar a conversa inteira a cada troca.
  const recentMessages = await prisma.message.findMany({
    where: { conversationId: params.conversationId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  const history = recentMessages
    .reverse()
    .map(m => ({
      role: (m.authorType === 'CONTACT' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    }));

  const openai = createOpenAI({ apiKey: openaiConfig.value });

  // Etapas do script com arquivo anexado (áudio/imagem/vídeo) — viram uma
  // ferramenta que a IA pode chamar no momento certo da conversa. Sem
  // etapa com mídia, não passa `tools` — nem precisa da chamada extra.
  const mediaSteps = agent.scriptSteps.filter(s => s.mediaType !== 'TEXT' && s.mediaUrl);
  const tools = mediaSteps.length
    ? {
        enviarMidiaDaEtapa: tool({
          description:
            'Envia pro WhatsApp do lead o arquivo (áudio, imagem ou vídeo) anexado a uma etapa específica do script.',
          inputSchema: z.object({
            stepId: z.string().describe('id da etapa cujo arquivo de mídia deve ser enviado'),
          }),
          execute: async ({ stepId }: { stepId: string }) => {
            const step = mediaSteps.find(s => s.id === stepId);
            if (!step?.mediaUrl) return { success: false, error: 'Etapa não encontrada ou sem mídia.' };
            const result = await sendMedia(
              params.phoneNumberId,
              params.accessToken,
              params.toPhone,
              step.mediaType as SendableMediaType,
              step.mediaUrl
            );
            if (result.success) {
              await prisma.message.create({
                data: { conversationId: params.conversationId, authorType: 'AI', content: `[${step.mediaType.toLowerCase()}] ${step.title}` },
              });
              await prisma.activity.create({
                data: { tenantId: params.tenantId, dealId: params.dealId, type: 'MESSAGE', content: `[${step.mediaType.toLowerCase()}] ${step.title}`, author: 'Agent' },
              });
            }
            return result;
          },
        }),
      }
    : undefined;

  const { text: replyText } = await generateText({
    model: openai('gpt-4o-mini'),
    system: systemPrompt,
    messages: history,
    tools,
    stopWhen: tools ? stepCountIs(3) : undefined,
  });

  if (!replyText?.trim()) return;

  const sendResult = await sendText(params.phoneNumberId, params.accessToken, params.toPhone, replyText);
  if (!sendResult.success) {
    console.error('❌ [AI REPLY] Falha ao enviar resposta da IA via WhatsApp:', sendResult.error);
    return;
  }

  await prisma.message.create({
    data: { conversationId: params.conversationId, authorType: 'AI', content: replyText },
  });
  // author: 'Agent' (não 'AI') de propósito — é o valor que a timeline do
  // Inbox (LeadInboxPanel) reconhece como mensagem enviada por nós, pra
  // renderizar do lado certo da conversa.
  await prisma.activity.create({
    data: { tenantId: params.tenantId, dealId: params.dealId, type: 'MESSAGE', content: replyText, author: 'Agent' },
  });
}
