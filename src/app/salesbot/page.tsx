import React from 'react';
import { Bot, Sparkles, MessageSquare, BrainCircuit, ToggleRight, Settings2 } from 'lucide-react';

export default function SalesbotPage() {
  return (
    <div className="p-8 h-full bg-[#0a0a0a] overflow-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Bot className="size-6 text-indigo-400" />
              Salesbot (IA)
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Configure o seu colega de Inteligência Artificial para qualificar leads.</p>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2">
            <Sparkles className="size-4" />
            Salvar Bot
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Configurações do Bot */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                    <BrainCircuit className="size-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-200">Motor de Inteligência</h3>
                    <p className="text-xs text-zinc-500">Defina o comportamento principal da IA</p>
                  </div>
                </div>
                <ToggleRight className="size-8 text-indigo-500" />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Prompt de Sistema (O Cérebro)</label>
                  <textarea 
                    className="w-full h-32 bg-[#0a0a0a] border border-[#333333] rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50 resize-none"
                    defaultValue="Você é o Pulse, o assistente virtual de vendas da empresa. Seu objetivo é responder os clientes de forma educada, curta (estilo WhatsApp) e tentar agendar uma reunião. Não invente preços."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Modelo de IA</label>
                    <select className="w-full bg-[#0a0a0a] border border-[#333333] rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50 appearance-none">
                      <option>GPT-4o (OpenAI)</option>
                      <option>Claude 3.5 Sonnet</option>
                      <option>Gemini 1.5 Pro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Temperatura (Criatividade)</label>
                    <input type="range" min="0" max="100" defaultValue="30" className="w-full mt-3 accent-indigo-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 shadow-sm">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Settings2 className="size-4 text-emerald-400" />
                  </div>
                  <h3 className="font-bold text-zinc-200">Ações de Transferência</h3>
                </div>
                <p className="text-sm text-zinc-400 mb-4">O que o Bot deve fazer quando o cliente pedir para falar com humano?</p>
                
                <div className="bg-[#0a0a0a] border border-[#262626] p-4 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-zinc-300">Pausar a IA e notificar a equipe</span>
                  <ToggleRight className="size-6 text-emerald-500" />
                </div>
            </div>
          </div>

          {/* Preview do Chat */}
          <div className="bg-[#141414] border border-[#262626] rounded-xl shadow-sm flex flex-col h-[600px]">
            <div className="p-4 border-b border-[#262626] flex items-center gap-2">
              <MessageSquare className="size-4 text-zinc-400" />
              <span className="font-bold text-sm text-zinc-200">Simulador do Bot</span>
            </div>
            
            <div className="flex-1 p-4 bg-[url('https://i.imgur.com/3qC5xP7.png')] bg-repeat bg-[length:200px_200px] opacity-90 overflow-y-auto" style={{ backgroundBlendMode: 'overlay', backgroundColor: '#0f0f0f' }}>
               <div className="flex justify-end mb-4">
                  <div className="bg-indigo-600/20 border border-indigo-500/30 text-indigo-100 p-3 rounded-2xl rounded-tr-none max-w-[85%] text-sm">
                    <div className="flex items-center gap-1 mb-1 text-indigo-400">
                      <Bot className="size-3" />
                      <span className="text-[9px] font-bold uppercase tracking-widest">Pulse Bot</span>
                    </div>
                    Olá! Sou o assistente virtual. Como posso te ajudar com nosso CRM hoje?
                  </div>
                </div>
                <div className="flex justify-start mb-4">
                  <div className="bg-[#222222] border border-[#333333] text-zinc-200 p-3 rounded-2xl rounded-tl-none max-w-[85%] text-sm">
                    Gostaria de saber os preços.
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-indigo-600/20 border border-indigo-500/30 text-indigo-100 p-3 rounded-2xl rounded-tr-none max-w-[85%] text-sm">
                    <div className="flex items-center gap-1 mb-1 text-indigo-400">
                      <Bot className="size-3" />
                      <span className="text-[9px] font-bold uppercase tracking-widest">Pulse Bot</span>
                    </div>
                    Temos planos a partir de R$ 97/mês. Gostaria de agendar uma demonstração rápida com um de nossos especialistas?
                  </div>
                </div>
            </div>
            
            <div className="p-3 border-t border-[#262626] bg-[#141414]">
              <input 
                type="text" 
                placeholder="Teste seu bot..." 
                className="w-full bg-[#0a0a0a] border border-[#333333] rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
