'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Phone, User, Database, Zap, Settings, RefreshCw, Send, ChevronLeft, Volume2, Maximize, Activity, X, Loader2, Check, ChevronUp, ChevronDown, ShieldAlert } from 'lucide-react';
import { getAiAgent, saveAiAgent, setAiAgentActive, type ScriptStepInput, type ObjectionInput } from '@/actions/salesbot';

type Tab = 'painel' | 'persona' | 'fontes' | 'acoes' | 'integracoes' | 'configs';

const DEFAULT_PERSONA = "Você é um assistente de vendas e consulta inteligente que ajuda os clientes a escolher o sistema de gestão NEXT para suas barbearias...";
const DEFAULT_DIRECTIVES = [
  "Comunique-se em primeira pessoa, como um representante real.",
  "Saudações devem ser feitas apenas na primeira interação.",
  "Pergunte de forma educada se as informações estiverem incompletas."
];
const PERSONALITY_OPTIONS = [
  'Confiante', 'Inspirador', 'Amigável', 'Direto', 'Meigo', 'Firme',
  'Pé no chão', 'Orientado a ação', 'Emocional', 'Agressivo', 'SPIN Selling',
];

function moveItem<T>(arr: T[], index: number, direction: -1 | 1): T[] {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= arr.length) return arr;
  const copy = [...arr];
  [copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
  return copy;
}

function StringListEditor({
  items, onChange, addLabel, placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  addLabel: string;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2 bg-[#161616] border border-[#2a2a2a] p-1.5 pl-3 rounded-lg text-sm text-zinc-400">
          <input
            value={item}
            onChange={(e) => onChange(items.map((v, i) => i === idx ? e.target.value : v))}
            placeholder={placeholder}
            className="flex-1 bg-transparent focus:outline-none text-zinc-300"
          />
          <button onClick={() => onChange(items.filter((_, i) => i !== idx))} className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors shrink-0">
            <X className="size-4" />
          </button>
        </div>
      ))}
      {items.length === 0 && <p className="text-xs text-zinc-600">Nada configurado ainda.</p>}
      <button onClick={() => onChange([...items, ''])} className="text-indigo-400 text-sm hover:text-indigo-300 font-medium">{addLabel}</button>
    </div>
  );
}

function ScriptStepsEditor({
  steps, onChange, addLabel,
}: {
  steps: ScriptStepInput[];
  onChange: (steps: ScriptStepInput[]) => void;
  addLabel: string;
}) {
  return (
    <div className="space-y-3">
      {steps.map((step, idx) => (
        <div key={idx} className="bg-[#161616] border border-[#2a2a2a] rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-500 w-5 shrink-0">{idx + 1}.</span>
            <input
              value={step.title}
              onChange={(e) => onChange(steps.map((s, i) => i === idx ? { ...s, title: e.target.value } : s))}
              placeholder="Nome da etapa (ex: Apresentação)"
              className="flex-1 bg-transparent font-semibold text-sm text-zinc-200 focus:outline-none"
            />
            <button onClick={() => onChange(moveItem(steps, idx, -1))} disabled={idx === 0} className="p-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-20 disabled:hover:text-zinc-500">
              <ChevronUp className="size-4" />
            </button>
            <button onClick={() => onChange(moveItem(steps, idx, 1))} disabled={idx === steps.length - 1} className="p-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-20 disabled:hover:text-zinc-500">
              <ChevronDown className="size-4" />
            </button>
            <button onClick={() => onChange(steps.filter((_, i) => i !== idx))} className="p-1 text-zinc-500 hover:text-red-400">
              <X className="size-4" />
            </button>
          </div>
          <textarea
            value={step.content}
            onChange={(e) => onChange(steps.map((s, i) => i === idx ? { ...s, content: e.target.value } : s))}
            placeholder="O que a IA deve fazer/perguntar nesta etapa..."
            className="w-full h-16 bg-[#111] border border-[#2a2a2a] rounded-lg p-2 text-xs text-zinc-400 focus:outline-none focus:border-indigo-500/50 resize-none"
          />
        </div>
      ))}
      <button onClick={() => onChange([...steps, { title: '', content: '' }])} className="text-indigo-400 text-sm hover:text-indigo-300 font-medium">{addLabel}</button>
    </div>
  );
}

function ObjectionsEditor({
  objections, onChange,
}: {
  objections: ObjectionInput[];
  onChange: (objections: ObjectionInput[]) => void;
}) {
  return (
    <div className="space-y-3">
      {objections.map((obj, idx) => (
        <div key={idx} className="bg-[#161616] border border-[#2a2a2a] rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              value={obj.title}
              onChange={(e) => onChange(objections.map((o, i) => i === idx ? { ...o, title: e.target.value } : o))}
              placeholder='Objeção (ex: "Tá caro")'
              className="flex-1 bg-transparent font-semibold text-sm text-zinc-200 focus:outline-none"
            />
            <button onClick={() => onChange(objections.filter((_, i) => i !== idx))} className="p-1 text-zinc-500 hover:text-red-400 shrink-0">
              <X className="size-4" />
            </button>
          </div>
          <textarea
            value={obj.response}
            onChange={(e) => onChange(objections.map((o, i) => i === idx ? { ...o, response: e.target.value } : o))}
            placeholder="Como o agente deve responder a essa objeção..."
            className="w-full h-16 bg-[#111] border border-[#2a2a2a] rounded-lg p-2 text-xs text-zinc-400 focus:outline-none focus:border-indigo-500/50 resize-none"
          />
        </div>
      ))}
      <button onClick={() => onChange([...objections, { title: '', response: '' }])} className="text-indigo-400 text-sm hover:text-indigo-300 font-medium">+ Adicionar objeção</button>
    </div>
  );
}

export default function SalesbotPage() {
  const [activeTab, setActiveTab] = useState<Tab>('persona');
  const [isAgentActive, setIsAgentActive] = useState(false);
  const [isTogglingAgent, setIsTogglingAgent] = useState(false);

  // Persona states
  const [isLoadingAgent, setIsLoadingAgent] = useState(true);
  const [agentLoadError, setAgentLoadError] = useState('');
  const [isSavingPersona, setIsSavingPersona] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [persona, setPersona] = useState(DEFAULT_PERSONA);
  const [personalityTags, setPersonalityTags] = useState<string[]>(['Amigável']);
  const [responseSize, setResponseSize] = useState("Médias");
  const [pauseSeconds, setPauseSeconds] = useState("3");
  const [responseLanguage, setResponseLanguage] = useState("Correspondente");
  const [directives, setDirectives] = useState<string[]>(DEFAULT_DIRECTIVES);
  const [typicalExpressions, setTypicalExpressions] = useState<string[]>([]);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [attendanceSteps, setAttendanceSteps] = useState<ScriptStepInput[]>([]);
  const [closingSteps, setClosingSteps] = useState<ScriptStepInput[]>([]);
  const [objections, setObjections] = useState<ObjectionInput[]>([]);

  useEffect(() => {
    getAiAgent().then(agent => {
      if (agent) {
        setIsAgentActive(agent.isActive);
        setPersona(agent.systemPrompt || DEFAULT_PERSONA);
        setResponseSize(agent.responseSize);
        setResponseLanguage(agent.responseLanguage);
        setPauseSeconds(String(agent.pauseSeconds));
        setNegativePrompt(agent.negativePrompt || '');

        const parseArray = (value: string | null, fallback: string[]) => {
          try {
            const parsed = value ? JSON.parse(value) : fallback;
            return Array.isArray(parsed) ? parsed : fallback;
          } catch {
            return fallback;
          }
        };
        setPersonalityTags(parseArray(agent.personalityTags, ['Amigável']));
        setDirectives(parseArray(agent.directives, DEFAULT_DIRECTIVES));
        setTypicalExpressions(parseArray(agent.typicalExpressions, []));

        setAttendanceSteps(
          agent.scriptSteps.filter(s => s.type === 'ATENDIMENTO').map(s => ({ title: s.title, content: s.content || '' }))
        );
        setClosingSteps(
          agent.scriptSteps.filter(s => s.type === 'FECHAMENTO').map(s => ({ title: s.title, content: s.content || '' }))
        );
        setObjections(agent.objections.map(o => ({ title: o.title, response: o.response })));
      }
      setIsLoadingAgent(false);
    }).catch(err => {
      console.error(err);
      setAgentLoadError('Não foi possível carregar o agente. Tente recarregar a página.');
      setIsLoadingAgent(false);
    });
  }, []);

  function togglePersonalityTag(tag: string) {
    setPersonalityTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  async function handleToggleAgent() {
    setIsTogglingAgent(true);
    const next = !isAgentActive;
    try {
      const agent = await setAiAgentActive(next);
      setIsAgentActive(agent.isActive);
    } catch (e) {
      console.error(e);
      alert('Falha ao alterar o status do agente.');
    } finally {
      setIsTogglingAgent(false);
    }
  }

  async function handleSavePersona() {
    setIsSavingPersona(true);
    setJustSaved(false);
    try {
      await saveAiAgent({
        systemPrompt: persona,
        personalityTags,
        responseSize,
        responseLanguage,
        pauseSeconds: parseInt(pauseSeconds, 10) || 0,
        directives,
        typicalExpressions,
        negativePrompt,
        attendanceSteps,
        closingSteps,
        objections,
      });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (e) {
      console.error(e);
      alert('Falha ao salvar as configurações do agente.');
    } finally {
      setIsSavingPersona(false);
    }
  }

  // Simulator states
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', role: 'assistant', content: 'Sou seu agente de IA conectado ao Cérebro da OpenAI! Você pode me testar fazendo perguntas para ver o que eu sei.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { id: Date.now().toString(), role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      const aiMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: '' };
      setMessages([...newMessages, aiMsg]);

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          aiMsg.content += chunk;
          setMessages([...newMessages, { ...aiMsg }]);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'painel', name: 'Painel', icon: Activity },
    { id: 'persona', name: 'Persona', icon: User },
    { id: 'fontes', name: 'Fontes', icon: Database },
    { id: 'acoes', name: 'Ações', icon: Zap },
    { id: 'integracoes', name: 'Integrações', icon: Maximize },
    { id: 'configs', name: 'Configurações', icon: Settings },
  ] as const;

  return (
    <div className="flex h-full bg-[#0a0a0a] text-white overflow-hidden">

      {/* Left Area (Settings) */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="px-8 pt-6 pb-2 border-b border-[#222]">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Bot className="size-5 text-indigo-400" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-100">NEXT Assistente de Vendas</h1>
            </div>
            <button
              onClick={handleToggleAgent}
              disabled={isTogglingAgent || isLoadingAgent}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50 ${
                isAgentActive ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {isTogglingAgent && <Loader2 className="size-4 animate-spin" />}
              {isAgentActive ? 'Agente de IA Ativo' : 'Ativar agente de IA'}
            </button>
          </div>

          {/* Sub Navigation */}
          <div className="flex gap-6 overflow-x-auto custom-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === tab.id ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.name}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-500 rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

          {agentLoadError && (
            <div className="mb-6 max-w-3xl bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
              {agentLoadError}
            </div>
          )}

          {activeTab === 'persona' && (
            <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-sm font-medium text-zinc-400 mb-1">Configure o agente de IA para conversar com clientes do jeito que você preferir.</h2>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-200">Função e personalidade (Prompt de Sistema)</label>
                <textarea
                  value={persona}
                  onChange={(e) => setPersona(e.target.value)}
                  className="w-full h-40 bg-[#111] border border-[#333] rounded-xl p-4 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50 resize-none"
                  placeholder="Escreva como o agente deve se comportar..."
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-200">Personalidade do agente</label>
                <p className="text-xs text-zinc-500">Selecione as características que melhor definem como o agente deve atender.</p>
                <div className="flex flex-wrap gap-2">
                  {PERSONALITY_OPTIONS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => togglePersonalityTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                        personalityTags.includes(tag)
                          ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                          : 'bg-[#141414] border-[#333] text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-[#222]">
                <label className="text-sm font-bold text-zinc-200">Script de Atendimento</label>
                <p className="text-xs text-zinc-500">Etapas, em ordem, que a IA deve seguir para qualificar o lead.</p>
                <ScriptStepsEditor steps={attendanceSteps} onChange={setAttendanceSteps} addLabel="+ Adicionar etapa" />
              </div>

              <div className="space-y-3 pt-4 border-t border-[#222]">
                <label className="text-sm font-bold text-zinc-200">Script de Fechamento</label>
                <p className="text-xs text-zinc-500">Etapas para quando o lead estiver pronto para comprar.</p>
                <ScriptStepsEditor steps={closingSteps} onChange={setClosingSteps} addLabel="+ Adicionar etapa de fechamento" />
              </div>

              <div className="space-y-3 pt-4 border-t border-[#222]">
                <label className="text-sm font-bold text-zinc-200">Script de Objeções</label>
                <p className="text-xs text-zinc-500">Objeções comuns dos leads e como o agente deve responder.</p>
                <ObjectionsEditor objections={objections} onChange={setObjections} />
              </div>

              <div className="space-y-3 pt-4 border-t border-[#222]">
                <label className="text-sm font-bold text-zinc-200">Expressões Típicas</label>
                <p className="text-xs text-zinc-500">Frases/bordões que o agente pode usar para soar mais natural e no seu tom.</p>
                <StringListEditor
                  items={typicalExpressions}
                  onChange={setTypicalExpressions}
                  addLabel="+ Adicionar expressão"
                  placeholder='Ex: "faz sentido pra você?"'
                />
              </div>

              <div className="space-y-3 pt-4 border-t border-[#222]">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-zinc-200">Diretrizes (Regras Opcionais)</label>
                </div>
                <StringListEditor
                  items={directives}
                  onChange={setDirectives}
                  addLabel="+ Adicionar diretriz"
                  placeholder="Escreva uma regra para o agente seguir..."
                />
              </div>

              <div className="space-y-3 pt-4 border-t border-[#222]">
                <label className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                  <ShieldAlert className="size-4 text-red-400" />
                  Prompt Negativo
                </label>
                <p className="text-xs text-zinc-500">Defina o que o agente NUNCA deve fazer ou dizer.</p>
                <textarea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  className="w-full h-24 bg-[#111] border border-[#333] rounded-xl p-4 text-sm text-zinc-300 focus:outline-none focus:border-red-500/50 resize-none"
                  placeholder="Ex: nunca prometa prazos de entrega, nunca fale mal da concorrência..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222]">
                {justSaved && (
                  <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium animate-in fade-in">
                    <Check className="size-4" /> Salvo
                  </span>
                )}
                <button
                  onClick={handleSavePersona}
                  disabled={isSavingPersona || isLoadingAgent}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                >
                  {isSavingPersona && <Loader2 className="size-4 animate-spin" />}
                  Salvar alterações
                </button>
              </div>

            </div>
          )}

          {activeTab === 'configs' && (
            <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-sm font-medium text-zinc-400 mb-1">Parâmetros técnicos de como o agente formata e ritma as respostas.</h2>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-zinc-200">Tamanho das respostas</label>
                  <select
                    value={responseSize}
                    onChange={(e) => setResponseSize(e.target.value)}
                    className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50"
                  >
                    <option>Curtas</option>
                    <option>Médias</option>
                    <option>Longas (Explicativas)</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-zinc-200">Idioma</label>
                  <select
                    value={responseLanguage}
                    onChange={(e) => setResponseLanguage(e.target.value)}
                    className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50"
                  >
                    <option>Correspondente</option>
                    <option>Português</option>
                    <option>Inglês</option>
                    <option>Espanhol</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-200">Pausa antes da resposta (segundos)</label>
                <p className="text-xs text-zinc-500">Isso evita que o robô responda rápido demais e pareça artificial. Ele simulará a digitação.</p>
                <input
                  type="number"
                  value={pauseSeconds}
                  onChange={(e) => setPauseSeconds(e.target.value)}
                  className="w-full max-w-[150px] bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222]">
                {justSaved && (
                  <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium animate-in fade-in">
                    <Check className="size-4" /> Salvo
                  </span>
                )}
                <button
                  onClick={handleSavePersona}
                  disabled={isSavingPersona || isLoadingAgent}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                >
                  {isSavingPersona && <Loader2 className="size-4 animate-spin" />}
                  Salvar alterações
                </button>
              </div>
            </div>
          )}

          {(activeTab === 'painel' || activeTab === 'fontes' || activeTab === 'acoes' || activeTab === 'integracoes') && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 animate-in fade-in">
              <Database className="size-12 mb-4 opacity-20" />
              <h3 className="text-lg font-bold text-zinc-400">Em Desenvolvimento</h3>
              <p className="text-sm mt-2 max-w-sm text-center">
                {activeTab === 'fontes' && 'Base de conhecimento (RAG): documentos que a IA vai poder consultar para responder — ainda não construído.'}
                {activeTab === 'acoes' && 'Ferramentas que a IA poderá executar (function calling), como consultar dados do negócio no CRM — próximo passo da Fase 1.3 do roadmap.'}
                {activeTab === 'integracoes' && 'Vínculo deste agente com canais específicos (WhatsApp/Instagram) — hoje o agente vale para o workspace inteiro.'}
                {activeTab === 'painel' && 'Métricas do agente (conversas, taxa de conversão) — ainda não construído.'}
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Right Area (Simulator) */}
      <div className="w-[400px] bg-[#111] border-l border-[#222] p-6 flex flex-col shrink-0 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] pointer-events-none rounded-full" />

        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-indigo-400" />
            <h2 className="font-bold text-zinc-100">Simulador</h2>
          </div>
          <button
            onClick={() => setMessages([{ id: '1', role: 'assistant', content: 'Sou seu agente de IA conectado ao Cérebro da OpenAI! Você pode me testar fazendo perguntas para ver o que eu sei.' }])}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#222] rounded-lg text-xs text-zinc-400 transition-colors border border-[#333]"
          >
            <RefreshCw className="size-3" />
            Reiniciar
          </button>
        </div>

        {/* iPhone Frame */}
        <div className="relative flex-1 bg-white rounded-[40px] shadow-2xl overflow-hidden border-[8px] border-[#222] flex flex-col z-10 mx-2">

          {/* Notch */}
          <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50">
            <div className="w-32 h-6 bg-[#222] rounded-b-3xl"></div>
          </div>

          {/* Phone Header */}
          <div className="bg-[#f0f2f5] pt-10 pb-3 px-4 flex items-center gap-3 shrink-0 shadow-sm z-40">
            <ChevronLeft className="size-6 text-blue-500" />
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              <Sparkles className="size-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-[#111b21] leading-tight">Agente de IA</h3>
              <p className="text-[11px] text-emerald-600 font-medium">online</p>
            </div>
          </div>

          {/* Phone Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-[#e5ddd5] opacity-90 custom-scrollbar relative">
            {/* WhatsApp Doodle background simulation */}
            <div className="absolute inset-0 opacity-[0.06] bg-[url('https://static.whatsapp.net/rsrc.php/v3/yl/r/r2qK74-L7_D.png')] bg-repeat pointer-events-none" style={{ backgroundSize: '400px' }}></div>

            {messages.map((msg) => (
              <div key={msg.id} className={`flex relative z-10 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role !== 'user' && (
                  <div className="w-6 h-6 rounded-full bg-indigo-500 shrink-0 mr-2 flex items-center justify-center mt-auto shadow-sm">
                    <Sparkles className="size-3 text-white" />
                  </div>
                )}
                <div className={`p-3 rounded-2xl max-w-[85%] shadow-sm relative ${
                  msg.role === 'user'
                    ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-none'
                    : 'bg-white text-[#111b21] rounded-tl-none'
                }`}>
                  <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Phone Input Area */}
          <form onSubmit={onSubmit} className="bg-[#f0f2f5] p-3 flex items-center gap-2 shrink-0">
            <div className="flex-1 bg-white rounded-full flex items-center px-4 py-2 shadow-sm border border-gray-200">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Mensagem..."
                className="w-full text-[14px] focus:outline-none text-gray-800 bg-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                input.trim() && !isLoading ? 'bg-emerald-500 text-white shadow-md' : 'bg-transparent text-gray-400'
              }`}
            >
              {input.trim() ? <Send className="size-4 ml-1" /> : <Volume2 className="size-5" />}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
