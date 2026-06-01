'use client';

import React, { useState } from 'react';
import { Bot, Sparkles, Phone, User, Database, Zap, Settings, RefreshCw, Send, ChevronLeft, Volume2, Maximize, Activity } from 'lucide-react';

type Tab = 'painel' | 'persona' | 'fontes' | 'acoes' | 'integracoes' | 'configs';

export default function SalesbotPage() {
  const [activeTab, setActiveTab] = useState<Tab>('persona');
  const [isAgentActive, setIsAgentActive] = useState(false);
  
  // Persona states
  const [persona, setPersona] = useState("Você é um assistente de vendas e consulta inteligente que ajuda os clientes a escolher o sistema de gestão NEXT para suas barbearias...");
  const [tone, setTone] = useState("Amigável");
  const [responseSize, setResponseSize] = useState("Médias");
  const [pauseSeconds, setPauseSeconds] = useState("3");

  // Simulator states
  const [simMessage, setSimMessage] = useState('');
  const [simChat, setSimChat] = useState([
    { id: 1, author: 'AI', text: 'Sou seu agente de IA! Você pode me testar fazendo perguntas para ver o que eu sei.', time: '02:27' }
  ]);

  const handleSimulateSend = () => {
    if(!simMessage.trim()) return;
    const userMsg = { id: Date.now(), author: 'USER', text: simMessage, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) };
    setSimChat(prev => [...prev, userMsg]);
    setSimMessage('');
    
    // Simulate AI typing
    setTimeout(() => {
      setSimChat(prev => [...prev, { 
        id: Date.now()+1, 
        author: 'AI', 
        text: 'Neste momento eu sou apenas a interface visual do seu Cérebro. O motor da OpenAI será conectado em breve!', 
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) 
      }]);
    }, 1500);
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
              onClick={() => setIsAgentActive(!isAgentActive)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                isAgentActive ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
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
                  <button className="text-indigo-400 text-sm hover:text-indigo-300 font-medium">+ Adicionar diretriz</button>
                </div>
                <div className="space-y-2">
                  {[
                    "Comunique-se em primeira pessoa, como um representante real.",
                    "Saudações devem ser feitas apenas na primeira interação.",
                    "Pergunte de forma educada se as informações estiverem incompletas."
                  ].map((rule, idx) => (
                    <div key={idx} className="bg-[#161616] border border-[#2a2a2a] p-3 rounded-lg text-sm text-zinc-400">
                      {rule}
                    </div>
                  ))}
                </div>
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
            onClick={() => setSimChat([{ id: 1, author: 'AI', text: 'Sou seu agente de IA! Você pode me testar fazendo perguntas para ver o que eu sei.', time: '02:27' }])}
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
            
            {simChat.map((msg) => (
              <div key={msg.id} className={`flex relative z-10 ${msg.author === 'USER' ? 'justify-end' : 'justify-start'}`}>
                {msg.author === 'AI' && (
                  <div className="w-6 h-6 rounded-full bg-indigo-500 shrink-0 mr-2 flex items-center justify-center mt-auto shadow-sm">
                    <Sparkles className="size-3 text-white" />
                  </div>
                )}
                <div className={`p-3 rounded-2xl max-w-[85%] shadow-sm relative ${
                  msg.author === 'USER' 
                    ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-none' 
                    : 'bg-white text-[#111b21] rounded-tl-none'
                }`}>
                  <p className="text-[13px] leading-relaxed">{msg.text}</p>
                  <span className="text-[10px] text-gray-500 float-right mt-1 ml-3">{msg.time}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Phone Input Area */}
          <div className="bg-[#f0f2f5] p-3 flex items-center gap-2 shrink-0">
            <div className="flex-1 bg-white rounded-full flex items-center px-4 py-2 shadow-sm border border-gray-200">
              <input 
                type="text" 
                value={simMessage}
                onChange={(e) => setSimMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSimulateSend()}
                placeholder="Mensagem..." 
                className="w-full text-[14px] focus:outline-none text-gray-800 bg-transparent"
              />
            </div>
            <button 
              onClick={handleSimulateSend}
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                simMessage.trim() ? 'bg-emerald-500 text-white shadow-md' : 'bg-transparent text-gray-400'
              }`}
            >
              {simMessage.trim() ? <Send className="size-4 ml-1" /> : <Volume2 className="size-5" />}
            </button>
          </div>
        </div>

      </div>
      
    </div>
  );
}
