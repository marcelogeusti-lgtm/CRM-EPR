import React from 'react';
import { Search, Settings, Edit3 } from 'lucide-react';

export default function EmailPage() {
  return (
    <div className="h-screen flex flex-col bg-white dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#262626]">
        <div className="flex items-center gap-6">
          <h1 className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">Caixa de Entrada</h1>
          
          <div className="relative w-64 hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Busca e filtro" 
              className="w-full bg-transparent border-none pl-9 pr-4 py-1.5 text-[13px] text-zinc-200 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-[11px] font-bold text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-[#262626] rounded bg-white dark:bg-[#141414] hover:bg-zinc-50 dark:hover:bg-[#1a1a1a] transition-colors">
            CONFIGURAÇÕES
          </button>
          <button className="px-3 py-1.5 text-[11px] font-bold text-blue-500 border border-blue-500/30 rounded bg-blue-50 dark:bg-blue-600/10 hover:bg-blue-100 dark:hover:bg-blue-600/20 transition-colors">
            ESCREVER
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="flex items-center border-b border-[#262626] bg-zinc-50 dark:bg-[#141414]">
        <div className="w-12 flex items-center justify-center border-r border-[#262626] py-3">
           <div className="w-4 h-4 rounded-sm border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-transparent" />
        </div>
        <div className="flex-1 py-3 px-4 border-r border-[#262626] text-[11px] font-bold text-zinc-500 tracking-wide">
          DE
        </div>
        <div className="flex-[2] py-3 px-4 border-r border-[#262626] text-[11px] font-bold text-zinc-500 tracking-wide">
          MENSAGEM E CONEXÃO DE LEAD
        </div>
        <div className="w-32 py-3 px-4 text-[11px] font-bold text-zinc-500 tracking-wide">
          DATA
        </div>
      </div>

      {/* Table Body - Empty State */}
      <div className="flex-1 bg-white dark:bg-[#0a0a0a] p-4">
        <p className="text-[13px] text-red-500">
          Desculpe, não há mensagens.
        </p>
      </div>

    </div>
  );
}
