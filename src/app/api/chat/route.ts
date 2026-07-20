import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { buildSystemPrompt } from '@/lib/agentPrompt';
import { NextResponse } from 'next/server';


// Aumenta o tempo limite de execução na Vercel (útil para IA)
export const maxDuration = 30; 

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 1. Buscar a Chave Mestre da OpenAI no Banco de Dados
    const openaiConfig = await prisma.systemConfig.findUnique({
      where: { key: 'OPENAI_MASTER_KEY' }
    });

    if (!openaiConfig || !openaiConfig.value) {
      return NextResponse.json(
        { error: 'Chave da OpenAI não configurada no Painel Admin.' },
        { status: 400 }
      );
    }

    // 2. Buscar as regras (Persona) do Agente de IA do tenant logado.
    const user = await getCurrentUser();
    const agent = user
      ? await prisma.aiAgent.findUnique({
          where: { tenantId: user.tenantId },
          include: {
            scriptSteps: { include: { blocks: { orderBy: { order: 'asc' } } } },
            objections: true,
            knowledgeSources: true,
          },
        })
      : null;

    // Constrói o Prompt de Sistema com base nas configurações
    const systemPrompt = agent
      ? buildSystemPrompt(agent, user?.tenant?.pixKey)
      : 'Você é um assistente útil e amigável.';

    // 3. Inicializar a OpenAI com a chave do banco de dados
    const openai = createOpenAI({
      apiKey: openaiConfig.value,
    });

    // 4. Gerar e transmitir a resposta em tempo real (Streaming)
    const result = await streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages: messages as any,
    });
    return result.toTextStreamResponse();
    
  } catch (error) {
    console.error('Erro no AI SDK:', error);
    return NextResponse.json(
      { error: 'Ocorreu um erro ao gerar a resposta da IA.' },
      { status: 500 }
    );
  }
}
