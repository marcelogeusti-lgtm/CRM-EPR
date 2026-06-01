import React from 'react';
import { PrismaClient } from '@prisma/client';
import { Users, Building2, Search, Filter } from 'lucide-react';

const prisma = new PrismaClient();

export default async function ListsPage() {
  const tenant = await prisma.tenant.findFirst();
  
  const contacts = await prisma.contact.findMany({
    where: { tenantId: tenant?.id },
    include: { company: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#222]">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Listas e Contatos</h1>
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            + Novo Contato
          </button>
        </div>
        
        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Buscar contatos, empresas ou telefones..." 
              className="w-full bg-[#111] border border-[#222] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-zinc-600"
            />
          </div>
          <button className="px-4 py-2.5 bg-[#111] border border-[#222] rounded-lg text-sm text-zinc-300 hover:text-white transition-colors flex items-center gap-2">
            <Filter className="size-4" />
            Filtros
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1a1a1a] text-zinc-400 font-medium border-b border-[#222]">
              <tr>
                <th className="px-6 py-4">Nome do Contato</th>
                <th className="px-6 py-4">Telefone / E-mail</th>
                <th className="px-6 py-4">Empresa</th>
                <th className="px-6 py-4">Data de Criação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {contacts.map(contact => (
                <tr key={contact.id} className="hover:bg-[#161616] transition-colors group cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-zinc-200">{contact.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-400">
                    <div className="flex flex-col gap-1">
                      {contact.phone && <span>{contact.phone}</span>}
                      {contact.email && <span className="text-xs text-zinc-500">{contact.email}</span>}
                      {!contact.phone && !contact.email && <span>-</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {contact.company ? (
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Building2 className="size-4 text-zinc-500" />
                        {contact.company.name}
                      </div>
                    ) : (
                      <span className="text-zinc-600">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-zinc-500">
                    {new Date(contact.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}

              {contacts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="size-8 text-zinc-600" />
                      <p>Nenhum contato encontrado no seu CRM.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
