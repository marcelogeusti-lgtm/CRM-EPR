import type { AiAgent, AgentScriptStep, AgentObjection } from '@prisma/client';

export type AiAgentWithScript = AiAgent & {
  scriptSteps: AgentScriptStep[];
  objections: AgentObjection[];
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
 */
export function buildSystemPrompt(agent: AiAgentWithScript): string {
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

  const attendanceSteps = agent.scriptSteps
    .filter(s => s.type === 'ATENDIMENTO')
    .sort((a, b) => a.order - b.order);
  if (attendanceSteps.length) {
    sections.push(
      `Script de atendimento — siga estas etapas, nesta ordem, conforme a conversa evoluir:\n${attendanceSteps
        .map((s, i) => `${i + 1}. ${s.title}${s.content ? `: ${s.content}` : ''}`)
        .join('\n')}`
    );
  }

  const closingSteps = agent.scriptSteps
    .filter(s => s.type === 'FECHAMENTO')
    .sort((a, b) => a.order - b.order);
  if (closingSteps.length) {
    sections.push(
      `Script de fechamento — quando o lead estiver pronto para comprar, siga:\n${closingSteps
        .map((s, i) => `${i + 1}. ${s.title}${s.content ? `: ${s.content}` : ''}`)
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

  return sections.join('\n\n');
}
