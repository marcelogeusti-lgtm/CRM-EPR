import type { AiAgent, AgentScriptStep, AgentScriptStepBlock, AgentObjection, AgentKnowledgeSource } from '@prisma/client';

export type AiAgentWithScript = AiAgent & {
  scriptSteps: (AgentScriptStep & { blocks: AgentScriptStepBlock[] })[];
  objections: AgentObjection[];
  knowledgeSources: AgentKnowledgeSource[];
};

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Único ponto que monta o system prompt do Agente de IA a partir da
 * configuração salva no banco. Usado pelo simulador (/api/chat) e, na
 * Fase 1.3, pelo fluxo real de resposta via WhatsApp — nunca duplicar
 * esta lógica em outro lugar.
 *
 * `pixKey` vem do Tenant (não do AiAgent) — passado à parte pra não
 * acoplar dado de empresa dentro do tipo do agente.
 */
export function buildSystemPrompt(agent: AiAgentWithScript, pixKey?: string | null): string {
  const personalityTags = parseJsonArray(agent.personalityTags);
  const directives = parseJsonArray(agent.directives);
  const expressions = parseJsonArray(agent.typicalExpressions);

  const sections: string[] = [
    agent.systemPrompt || 'Você é um assistente de vendas útil e amigável.',
  ];

  sections.push(
    [
      'Diretrizes adicionais:',
      personalityTags.length ? `- Personalidade: ${personalityTags.join(', ')}` : null,
      `- Tamanho da resposta: ${agent.responseSize}`,
      `- Idioma: ${agent.responseLanguage}`,
    ]
      .filter(Boolean)
      .join('\n')
  );

  if (directives.length) {
    sections.push(`Regras de ouro:\n${directives.map(d => `- ${d}`).join('\n')}`);
  }

  const describeStep = (s: AgentScriptStep & { blocks: AgentScriptStepBlock[] }, i: number) => {
    const blocksNote = s.blocks.length
      ? ` [tem ${s.blocks.length} bloco(s) de conteúdo pra mandar nesta etapa, nesta ordem — use a ferramenta enviarBlocoDaEtapa uma vez pra cada blockId, na sequência: ${s.blocks
          .map(b => `"${b.id}" (${b.type === 'TEXT' ? `texto: "${b.content}"` : `arquivo de ${b.type.toLowerCase()}`})`)
          .join(', ')}]`
      : '';
    return `${i + 1}. ${s.title}${s.content ? `: ${s.content}` : ''}${blocksNote}`;
  };

  const attendanceSteps = agent.scriptSteps
    .filter(s => s.type === 'ATENDIMENTO')
    .sort((a, b) => a.order - b.order);
  if (attendanceSteps.length) {
    sections.push(
      `Script de atendimento — siga estas etapas, nesta ordem, conforme a conversa evoluir:\n${attendanceSteps
        .map(describeStep)
        .join('\n')}`
    );
  }

  const closingSteps = agent.scriptSteps
    .filter(s => s.type === 'FECHAMENTO')
    .sort((a, b) => a.order - b.order);
  if (closingSteps.length) {
    sections.push(
      `Script de fechamento — quando o lead estiver pronto para comprar, siga:\n${closingSteps
        .map(describeStep)
        .join('\n')}`
    );
  }

  if (agent.objections.length) {
    const sorted = [...agent.objections].sort((a, b) => a.order - b.order);
    sections.push(
      `Como lidar com objeções comuns:\n${sorted.map(o => `- "${o.title}": ${o.response}`).join('\n')}`
    );
  }

  if (expressions.length) {
    sections.push(`Use naturalmente expressões como: ${expressions.map(e => `"${e}"`).join(', ')}`);
  }

  if (agent.negativePrompt) {
    sections.push(`NUNCA faça ou diga:\n${agent.negativePrompt}`);
  }

  if (agent.knowledgeSources.length) {
    const sorted = [...agent.knowledgeSources].sort((a, b) => a.order - b.order);
    sections.push(
      `Informações do negócio (use isto como referência pra responder dúvidas, preços, medidas e especificações — não invente valores que não estejam aqui):\n\n${sorted
        .map(s => `### ${s.title}\n${s.content}`)
        .join('\n\n')}`
    );
  }

  if (pixKey) {
    sections.push(`Se o cliente pedir a chave Pix para pagamento, informe exatamente: ${pixKey}`);
  }

  return sections.join('\n\n');
}
