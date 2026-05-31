import React from 'react';
import { Bot, LineChart, Users } from 'lucide-react';

export default function TeamPage() {
  return (
    <div className="flex h-screen w-full bg-[#f9f9f9] dark:bg-[#0a0a0a]">
      {/* Lista de Chats (Esquerda) */}
      <div className="flex flex-col border-r border-[#262626] bg-white dark:bg-[#141414] w-[350px] shrink-0">
        
        {/* Header Left Panel */}
        <div className="p-4 border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-[#e5f5e8] dark:bg-green-500/10 text-[#4caf50] text-xs px-2 py-0.5 rounded font-medium">Todos</span>
          </div>
          <button className="text-zinc-500 hover:text-zinc-300">•••</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Chat com suporte */}
          <div className="p-4 border-b border-[#262626] flex items-center gap-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-[#1a1a1a] transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#1b1b29] flex items-center justify-center shrink-0">
              <span className="text-white text-lg font-bold">K</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-zinc-900 dark:text-zinc-200">Chat com suporte</span>
            </div>
          </div>

          {/* Relatório agendado */}
          <div className="p-4 border-b border-[#262626] flex items-center gap-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-[#1a1a1a] transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#e8f0fe] dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <Bot className="size-5 text-blue-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-zinc-900 dark:text-zinc-200">Relatório agendado</span>
            </div>
          </div>

          {/* Convidar membros da equipe */}
          <div className="p-4 border-b border-[#262626] flex items-center gap-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-[#1a1a1a] transition-colors">
            <div className="w-10 h-10 rounded-full border border-dashed border-zinc-400 dark:border-zinc-600 flex items-center justify-center shrink-0">
              <span className="text-zinc-500 text-xl font-light">+</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-200">Convidar membros da equipe</span>
              <span className="text-[11px] text-zinc-500">Colaborar & vender juntos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Painel Principal (Direita) */}
      <div className="flex-1 relative">
        <div className="h-full flex flex-col items-center justify-center text-zinc-600 px-6">
          <h2 className="text-[15px] text-zinc-800 dark:text-zinc-300 text-center max-w-md leading-relaxed mb-2">
            Converse com sua equipe dentro da Kommo
          </h2>
          
          <p className="text-[13px] text-zinc-500 text-center max-w-sm mb-6">
            Envie mensagens a colegas, compartilhe arquivos e mantenha-se alinhado em todas as decisões
          </p>
          
          <button className="bg-[#1877F2] hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg text-[13px] font-medium transition-colors">
            Convidar membros da equipe
          </button>
        </div>
      </div>
    </div>
  );
}
