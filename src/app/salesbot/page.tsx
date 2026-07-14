'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Phone, User, Database, Zap, Settings, RefreshCw, Send, ChevronLeft, Volume2, Maximize, Activity, X, Loader2, Check } from 'lucide-react';
import { getAiAgent, saveAiAgent, setAiAgentActive } from '@/actions/salesbot';

type Tab = 'painel' | 'persona' | 'fontes' | 'acoes' | 'integracoes' | 'configs';

const DEFAULT_PERSONA = "Você é um assistente de vendas e consulta inteligente que ajuda os clientes a escolher o sistema de gestão NEXT para suas barbearias...";
const DEFAULT_DIRECTIVES = [
  "Comunique-se em primeira pessoa, como um representante real.",
  "Saudações devem ser feitas apenas na primeira interação.",
  "Pergunte de forma educada se as informações estiverem incompletas."
];

export default function SalesbotPage() {
  const [activeTab, setActiveTab] = useState<Tab>('persona');
  const [isAgentActive, setIsAgentActive] = useState(false);
  const [isTogglingAgent, setIsTogglingAgent] = useState(false);

  // Persona states
  const [isLoadingAgent, setIsLoadingAgent] = useState(true);
  const [isSavingPersona, setIsSavingPersona] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [persona, setPersona] = useState(DEFAULT_PERSONA);
  const [tone, setTone] = useState("Amigável");
  const [responseSize, setResponseSize] = useState("Médias");
  const [pauseSeconds, setPauseSeconds] = useState("3");
  const [directives, setDirectives] = useState<string[]>(DEFAULT_DIRECTIVES);

  useEffect(() => {
    getAiAgent().then(agent => {
      if (agent) {
        setIsAgentActive(agent.isActive);
        setPersona(agent.systemPrompt || DEFAULT_PERSONA);
        setTone(agent.toneOfVoice);
        setResponseSize(agent.responseSize);
        setPauseSeconds(String(agent.pauseSeconds));
        try {
          const parsed = agent.directives ? JSON.parse(agent.directives) : DEFAULT_DIRECTIVES;
          setDirectives(Array.isArray(parsed) ? parsed : DEFAULT_DIRECTIVES);
        } catch {
          setDirectives(DEFAULT_DIRECTIVES);
        }
      }
      setIsLoadingAgent(false);
    });
  }, []);

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
        toneOfVoice: tone,
        responseSize,
        pauseSeconds: parseInt(pauseSeconds, 10) || 0,
        directives,
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

  function updateDirective(idx: number, value: string) {
    setDirectives(prev => prev.map((d, i) => i === idx ? value : d));
  }

  function removeDirective(idx: number) {
    setDirectives(prev => prev.filter((_, i) => i !== idx));
  }

  function addDirective() {
    setDirectives(prev => [...prev, '']);
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

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-zinc-200">Tom de voz</label>
                  <select 
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50"
                  >
                    <option>Amigável</option>
                    <option>Profissional</option>
                    <option>Direto e Objetivo</option>
                    <option>Entusiasta</option>
                  </select>
                </div>
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

              <div className="space-y-3 pt-4 border-t border-[#222]">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-zinc-200">Diretrizes (Regras Opcionais)</label>
                  <button onClick={addDirective} className="text-indigo-400 text-sm hover:text-indigo-300 font-medium">+ Adicionar diretriz</button>
                </div>
                <div className="space-y-2">
                  {directives.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-[#161616] border border-[#2a2a2a] p-1.5 pl-3 rounded-lg text-sm text-zinc-400">
                      <input
                        value={rule}
                        onChange={(e) => updateDirective(idx, e.target.value)}
                        placeholder="Escreva uma regra para o agente seguir..."
                        className="flex-1 bg-transparent focus:outline-none text-zinc-300"
                      />
                      <button onClick={() => removeDirective(idx)} className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors shrink-0">
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                  {directives.length === 0 && (
                    <p className="text-xs text-zinc-600">Nenhuma diretriz adicional configurada.</p>
                  )}
                </div>
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

          {activeTab !== 'persona' && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 animate-in fade-in">
              <Database className="size-12 mb-4 opacity-20" />
              <h3 className="text-lg font-bold text-zinc-400">Em Desenvolvimento</h3>
              <p className="text-sm mt-2 max-w-sm text-center">A aba de {tabs.find(t=>t.id===activeTab)?.name} está sendo construída para integração com o Banco de Dados Vetorial (RAG).</p>
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
