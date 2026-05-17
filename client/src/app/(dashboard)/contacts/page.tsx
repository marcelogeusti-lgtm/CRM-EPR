'use client';

import React from 'react';
import { Users, Search, Plus, MoreVertical } from 'lucide-react';

export default function ContactsPage() {
  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
              <Users className="h-10 w-10 text-blue-500" />
              Gestão de Contatos
            </h1>
            <p className="text-gray-400 mt-2 text-lg">
              Gerencie sua base de clientes e leads.
            </p>
          </div>
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Novo Contato
          </button>
        </div>

        {/* Content */}
        <div className="bg-[#111111]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar contatos por nome, email ou telefone..." 
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <button className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all font-medium border border-white/10">
              Filtros
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-sm">
                  <th className="pb-4 font-semibold">Nome</th>
                  <th className="pb-4 font-semibold">Contato</th>
                  <th className="pb-4 font-semibold">Tags</th>
                  <th className="pb-4 font-semibold">Data Cadastro</th>
                  <th className="pb-4 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4">
                    <div className="font-semibold text-white">João Silva</div>
                    <div className="text-sm text-gray-500">Empresa Alpha</div>
                  </td>
                  <td className="py-4">
                    <div>joao@alpha.com</div>
                    <div className="text-sm text-gray-500">+55 11 99999-9999</div>
                  </td>
                  <td className="py-4">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-md">Lead Quente</span>
                  </td>
                  <td className="py-4 text-sm">Hoje, 10:45</td>
                  <td className="py-4">
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
