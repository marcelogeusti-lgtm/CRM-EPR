'use client';

import React from 'react';
import { Search, Plus, MoreVertical, SlidersHorizontal, Users } from 'lucide-react';
import { PageHeader } from '@/components/system/PageHeader';
import { motion } from 'framer-motion';

export default function ContactsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* PageHeader unificado */}
      <PageHeader 
        title="Gestão de Contatos"
        description="Gerencie sua base de clientes e leads com facilidade."
        actions={
          <button className="h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-sm flex items-center gap-2 text-sm">
            <Plus className="size-[18px]" />
            Novo Contato
          </button>
        }
      />

      {/* Tabela de Contatos */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm"
      >
        {/* Barra de Filtros e Busca */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-[18px] text-zinc-400" />
            <input 
              type="text" 
              placeholder="Buscar contatos por nome, email ou telefone..." 
              className="w-full bg-white border border-zinc-200 rounded-xl pl-12 pr-4 h-11 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
            />
          </div>
          <button className="h-11 px-4 bg-white hover:bg-zinc-50 text-zinc-600 rounded-xl transition-all font-medium border border-zinc-200 flex items-center gap-2 text-sm shadow-sm">
            <SlidersHorizontal className="size-[18px] text-zinc-400" />
            Filtros
          </button>
        </div>

        {/* Tabela Física */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                <th className="pb-4 font-semibold">Nome</th>
                <th className="pb-4 font-semibold">Contato</th>
                <th className="pb-4 font-semibold">Tags</th>
                <th className="pb-4 font-semibold">Data Cadastro</th>
                <th className="pb-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-zinc-600 text-sm divide-y divide-zinc-50">
              <tr className="hover:bg-zinc-50/50 transition-colors">
                <td className="py-4">
                  <div className="font-bold text-zinc-900">João Silva</div>
                  <div className="text-xs text-zinc-400">Empresa Alpha</div>
                </td>
                <td className="py-4">
                  <div className="font-medium">joao@alpha.com</div>
                  <div className="text-xs text-zinc-400">+55 11 99999-9999</div>
                </td>
                <td className="py-4">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs rounded-full font-bold border border-blue-100">
                    Lead Quente
                  </span>
                </td>
                <td className="py-4 text-xs text-zinc-400">Hoje, 10:45</td>
                <td className="py-4 text-right">
                  <button className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-zinc-600">
                    <MoreVertical className="size-[18px]" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

    </div>
  );
}
