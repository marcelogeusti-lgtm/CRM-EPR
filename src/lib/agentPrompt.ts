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

// Cada tag de personalidade (ver PERSONALITY_OPTIONS em src/app/salesbot/page.tsx,
// as chaves aqui precisam bater com aquele array) descreve como ela deve se
// manifestar de verdade nas respostas — sem isso a IA só recebe o nome da
// tag ("Personalidade: Direto"), que não diz nada sobre COMO soar direto.
// Reexportado pra também virar tooltip na tela de Persona.
export const PERSONALITY_TRAIT_GUIDE: Record<string, { comoFunciona: string[]; exemploTom: string; impacto: string }> = {
  'Confiante': {
    comoFunciona: ['Fala com certeza, sem parecer insegura', 'Evita "talvez" ou excesso de ressalvas', 'Usa frases afirmativas e postura de liderança'],
    exemploTom: 'Isso funciona porque resolve exatamente esse problema.',
    impacto: 'gera autoridade, segurança e reduz objeções',
  },
  'Inspirador': {
    comoFunciona: ['Mostra possibilidades futuras', 'Faz o lead se imaginar num cenário melhor', 'Usa linguagem de progresso, evolução e conquista'],
    exemploTom: 'Você não está atrasado, você só está começando do jeito certo agora.',
    impacto: 'aumenta engajamento e motivação emocional',
  },
  'Amigável': {
    comoFunciona: ['Conversa como alguém próximo', 'Linguagem simples, humana e acolhedora', 'Não impõe, convida'],
    exemploTom: 'Fica tranquilo, isso é mais simples do que parece.',
    impacto: 'cria conexão e reduz resistência',
  },
  'Direto': {
    comoFunciona: ['Vai ao ponto, sem floreio', 'Frases curtas', 'Respostas práticas'],
    exemploTom: 'O problema é esse. A solução é essa. O próximo passo é esse.',
    impacto: 'clareza, objetividade e ação rápida',
  },
  'Meigo': {
    comoFunciona: ['Tom suave, empático', 'Validação emocional', 'Linguagem carinhosa sem ser infantil'],
    exemploTom: 'Eu sei que isso cansa, e tá tudo bem se sentir assim.',
    impacto: 'cria segurança emocional e acolhimento',
  },
  'Firme': {
    comoFunciona: ['Não passa a mão na cabeça', 'Corrige crenças erradas', 'Mantém empatia, mas impõe limites'],
    exemploTom: 'Se você continuar fazendo isso, o resultado não vai mudar.',
    impacto: 'autoridade, respeito e posicionamento',
  },
  'Pé no chão': {
    comoFunciona: ['Não promete milagres', 'Alinha expectativa com realidade', 'Fala de esforço, processo e constância'],
    exemploTom: 'Isso dá resultado, mas não da noite pro dia.',
    impacto: 'credibilidade e confiança real',
  },
  'Orientado a ação': {
    comoFunciona: ['Sempre termina com um próximo passo', 'Chamada clara para ação', 'Menos teoria, mais execução'],
    exemploTom: 'Agora faz isso: me manda seu peso e altura que eu já calculo pra você.',
    impacto: 'movimento do lead, evita estagnação',
  },
  'Emocional': {
    comoFunciona: ['Toca em dores, desejos e frustrações', 'Usa storytelling', 'Linguagem sensível e envolvente'],
    exemploTom: 'Talvez o que mais dói não seja o dinheiro, mas a sensação de estar parado.',
    impacto: 'conexão profunda e persuasão',
  },
  'Agressivo': {
    comoFunciona: ['Provoca (com estratégia, não com grosseria)', 'Usa confronto controlado', 'Quebra desculpas'],
    exemploTom: 'Se você já tentou de tudo e nada mudou, o problema não é falta de esforço.',
    impacto: 'gera impacto e quebra padrões — usar com cuidado, nunca ser rude',
  },
  'SPIN Selling': {
    comoFunciona: [
      'A IA não vende direto, ela conduz o lead a chegar sozinho na conclusão',
      'S-Situação: pergunta pra entender o cenário atual',
      'P-Problema: faz o lead reconhecer a dor',
      'I-Implicação: amplifica as consequências de não resolver',
      'N-Necessidade: leva o lead a desejar a solução',
    ],
    exemploTom: 'E isso te gera o quê? Se continuar assim, onde você acha que vai estar daqui a 6 meses?',
    impacto: 'o lead se convence sozinho, em vez de sentir que estão vendendo pra ele',
  },
};

// Combinações que se reforçam bem — citado no prompt só como dica de
// coerência, não como regra rígida.
const PERSONALITY_COMBO_HINTS = [
  'Confiante + Firme → autoridade',
  'Amigável + Meigo → conexão',
  'Emocional + Inspirador → desejo',
  'Direto + Orientado a ação → conversão',
];

/**
 * Único ponto que monta o system prompt do Agente de IA a partir da
 * configuração salva no banco. Usado pelo simulador (/api/chat) e, na
 * Fase 1.3, pelo fluxo real de resposta via WhatsApp — nunca duplicar
 * esta lógica em outro lugar.
 *
 * `pixKey` vem do Tenant (não do AiAgent) — passado à parte pra não
 * acoplar dado de empresa dentro do tipo do agente.
 *
 * `sentBlockIds` marca quais blocos já foram enviados NESTA conversa
 * (ver SentScriptBlock/src/lib/aiReply.ts) — sem isso a IA só tem o
 * histórico de mensagens pra inferir onde parou no funil, e com os dois
 * scripts inteiros no prompt ela tende a "esquecer" de avançar. Omitido
 * no simulador (/api/chat), que não tem conversa persistida.
 */
export function buildSystemPrompt(
  agent: AiAgentWithScript,
  pixKey?: string | null,
  sentBlockIds?: Set<string>
): string {
  const personalityTags = parseJsonArray(agent.personalityTags);
  const directives = parseJsonArray(agent.directives);
  const expressions = parseJsonArray(agent.typicalExpressions);

  const sections: string[] = [
    agent.systemPrompt || 'Você é um assistente de vendas útil e amigável.',
  ];

  sections.push(
    [
      'Diretrizes adicionais:',
      `- Tamanho da resposta: ${agent.responseSize}`,
      `- Idioma: ${agent.responseLanguage}`,
    ].join('\n')
  );

  if (personalityTags.length) {
    const traitLines = personalityTags.map(tag => {
      const guide = PERSONALITY_TRAIT_GUIDE[tag];
      if (!guide) return `- ${tag}`;
      return `- ${tag}: ${guide.comoFunciona.join('; ')}. Exemplo de tom: "${guide.exemploTom}" (impacto: ${guide.impacto}).`;
    });
    const relevantCombos = PERSONALITY_COMBO_HINTS.filter(hint =>
      personalityTags.some(tag => hint.startsWith(tag))
    );
    sections.push(
      [
        'Personalidade selecionada — como cada traço deve se manifestar de verdade nas respostas (não é só um rótulo):',
        ...traitLines,
        relevantCombos.length ? `Dica de coerência entre os traços escolhidos: ${relevantCombos.join('; ')}.` : null,
      ]
        .filter(Boolean)
        .join('\n')
    );
  }

  if (directives.length) {
    sections.push(`Regras de ouro:\n${directives.map(d => `- ${d}`).join('\n')}`);
  }

  sections.push(
    [
      'Regras sobre como avançar o funil de vendas (IMPORTANTE):',
      '- Você NUNCA deve simplesmente responder a pergunta do lead e parar por aí. Depois de responder, se ainda houver bloco marcado como [PENDENTE] na etapa atual do script (abaixo), você DEVE chamar enviarBlocoDaEtapa para ele — a menos que a condição de "quando usar" da etapa ainda não tenha sido satisfeita pela conversa até agora.',
      '- Nunca chame enviarBlocoDaEtapa para um bloco marcado como [JÁ ENVIADO] — isso duplicaria a mensagem pro lead.',
      '- Se você chamar enviarBlocoDaEtapa para um bloco de ÁUDIO, IMAGEM ou VÍDEO nesta resposta, seu texto final (se houver) deve ser curto e NUNCA repetir, resumir ou antecipar o que esse arquivo já diz — o arquivo enviado é a resposta principal; o texto é só um complemento opcional (ex.: uma pergunta curta de transição).',
      '- Quando a pergunta do lead não fizer parte do funil, responda com naturalidade dentro da persona usando as fontes de conhecimento abaixo como referência — nunca invente fatos, preços ou promessas que não estejam no prompt — e depois volte a avançar o funil normalmente.',
    ].join('\n')
  );

  const describeStep = (s: AgentScriptStep & { blocks: AgentScriptStepBlock[] }, i: number) => {
    const blocksNote = s.blocks.length
      ? ` [${s.blocks.length} bloco(s) de conteúdo desta etapa, nesta ordem: ${s.blocks
          .map(b => {
            const desc =
              b.type === 'TEXT' ? `texto: "${b.content}"`
              : b.type === 'LINK' ? `link: "${b.content}"`
              : `arquivo de ${b.type.toLowerCase()}`;
            const status = sentBlockIds?.has(b.id) ? '[JÁ ENVIADO]' : '[PENDENTE]';
            return `"${b.id}" (${desc}) ${status}`;
          })
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
