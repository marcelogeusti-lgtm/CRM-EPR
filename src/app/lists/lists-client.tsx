'use client';

import React, { useMemo, useState } from 'react';
import { Users, Building2, Search, Filter, X } from 'lucide-react';
import { createContact } from '@/actions/contacts';

interface Contact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  createdAt: Date;
  company: { name: string } | null;
}

type CompanyFilter = 'all' | 'with' | 'without';

export function ListsClient({ initialContacts }: { initialContacts: Contact[] }) {
  const [contacts, setContacts] = useState(initialContacts);
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState<CompanyFilter>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return contacts.filter(c => {
      const matchesSearch = !query ||
        c.name.toLowerCase().includes(query) ||
        (c.phone || '').toLowerCase().includes(query) ||
        (c.email || '').toLowerCase().includes(query) ||
        (c.company?.name || '').toLowerCase().includes(query);

      const matchesCompany = companyFilter === 'all'
        ? true
        : companyFilter === 'with'
          ? !!c.company
          : !c.company;

      return matchesSearch && matchesCompany;
    });
  }, [contacts, search, companyFilter]);

  const handleCreateContact = async (formData: FormData) => {
    setIsSaving(true);
    setFormError('');
    const result = await createContact(formData);
    setIsSaving(false);

    if (!result.success || !result.data) {
      setFormError(result.error || 'Não foi possível criar o contato.');
      return;
    }

    setContacts(prev => [{ ...result.data, company: null }, ...prev]);
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#222]">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Listas e Contatos</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Novo Contato
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar contatos, empresas ou telefones..."
              className="w-full bg-[#111] border border-[#222] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-zinc-600"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(prev => !prev)}
              className="px-4 py-2.5 bg-[#111] border border-[#222] rounded-lg text-sm text-zinc-300 hover:text-white transition-colors flex items-center gap-2"
            >
              <Filter className="size-4" />
              Filtros
            </button>
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#141414] border border-[#262626] rounded-lg shadow-xl z-10 overflow-hidden">
                {([
                  { value: 'all', label: 'Todos os contatos' },
                  { value: 'with', label: 'Com empresa' },
                  { value: 'without', label: 'Sem empresa' },
                ] as { value: CompanyFilter; label: string }[]).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setCompanyFilter(opt.value); setIsFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${companyFilter === opt.value ? 'bg-blue-500/10 text-blue-400' : 'text-zinc-300 hover:bg-[#1a1a1a]'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
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
              {filteredContacts.map(contact => (
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

              {filteredContacts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="size-8 text-zinc-600" />
                      <p>{contacts.length === 0 ? 'Nenhum contato encontrado no seu CRM.' : 'Nenhum contato corresponde à busca/filtro.'}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#262626] rounded-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="size-5" />
            </button>

            <h2 className="text-lg font-bold text-zinc-100 mb-6">Novo Contato</h2>

            <form action={handleCreateContact} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 mb-2 block">Nome *</label>
                <input
                  name="name"
                  required
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 mb-2 block">Telefone</label>
                <input
                  name="phone"
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 mb-2 block">E-mail</label>
                <input
                  name="email"
                  type="email"
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>

              {formError && <p className="text-sm text-red-400">{formError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Contato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
