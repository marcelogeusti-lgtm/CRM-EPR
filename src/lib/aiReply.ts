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
    include: {
      scriptSteps: { include: { blocks: { orderBy: { order: 'asc' } } } },
      objections: true,
      knowledgeSources: true,
    },
  });
  if (!agent || !agent.isActive) return;

  const openaiConfig = await prisma.systemConfig.findUnique({ where: { key: 'OPENAI_MASTER_KEY' } });
  if (!openaiConfig?.value) {
    console.warn('⚠️ [AI REPLY] Agente de IA ativo, mas a chave mestre da OpenAI não está configurada em /admin.');
    return;
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: params.tenantId } });
  const sentBlockIds = new Set(
    (
      await prisma.sentScriptBlock.findMany({
        where: { conversationId: params.conversationId },
        select: { blockId: true },
      })
    ).map(r => r.blockId)
  );
  const systemPrompt = buildSystemPrompt(agent, tenant?.pixKey, sentBlockIds);

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

  // Blocos de conteúdo (texto literal ou mídia) de todas as etapas do
  // script — viram uma ferramenta que a IA pode chamar, um bloco de cada
  // vez, na ordem que o Marcelo montou, no momento certo da conversa. Sem
  // etapa com bloco, não passa `tools` — nem precisa da chamada extra.
  const allBlocks = agent.scriptSteps.flatMap(s => s.blocks);
  const tools = allBlocks.length
    ? {
        enviarBlocoDaEtapa: tool({
          description:
            'Envia pro WhatsApp do lead um bloco de conteúdo (texto literal, áudio, imagem ou vídeo) de uma etapa do script.',
          inputSchema: z.object({
            blockId: z.string().describe('id do bloco de conteúdo que deve ser enviado'),
          }),
          execute: async ({ blockId }: { blockId: string }) => {
            const block = allBlocks.find(b => b.id === blockId);
            if (!block) return { success: false, error: 'Bloco não encontrado.' };

            const result =
              block.type === 'TEXT'
                ? await sendText(params.phoneNumberId, params.accessToken, params.toPhone, block.content || '')
                : block.mediaUrl
                  ? await sendMedia(
                      params.phoneNumberId,
                      params.accessToken,
                      params.toPhone,
                      block.type as SendableMediaType,
                      block.mediaUrl
                    )
                  : { success: false, error: 'Bloco sem conteúdo.' };

            if (result.success) {
              const logContent = block.type === 'TEXT' ? block.content || '' : `[${block.type.toLowerCase()}]`;
              await prisma.message.create({
                data: { conversationId: params.conversationId, authorType: 'AI', content: logContent },
              });
              await prisma.activity.create({
                data: { tenantId: params.tenantId, dealId: params.dealId, type: 'MESSAGE', content: logContent, author: 'Agent' },
              });
              await prisma.sentScriptBlock.upsert({
                where: { conversationId_blockId: { conversationId: params.conversationId, blockId: block.id } },
                update: {},
                create: { conversationId: params.conversationId, blockId: block.id },
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
