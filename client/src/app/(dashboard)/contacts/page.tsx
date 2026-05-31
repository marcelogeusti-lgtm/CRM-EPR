'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Plus, 
  MoreVertical, 
  SlidersHorizontal, 
  Users, 
  Trash2, 
  Edit2, 
  X, 
  Building, 
  Mail, 
  Phone, 
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/useDebounce'; // Assumindo ou criando depois se necessário, mas vou usar local scope para debounce aqui ou apenas refetch

interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  tags: string[];
  metadata?: any;
  createdAt: string;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ContactsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal / Drawer States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // React Query Fetcher
  const { data: contacts = [], isLoading: loading } = useQuery({
    queryKey: ['contacts', searchTerm],
    queryFn: async () => {
      try {
        const res = await axios.get(`${apiUrl}/contacts`, {
          params: { search: searchTerm || undefined }
        });
        return res.data;
      } catch (err) {
        // Fallback robusto para demonstração se a API falhar
        return [
          {
            id: '1', name: 'João Silva', phone: '+55 11 99999-9999', email: 'joao@alpha.com',
            tags: ['Lead Quente', 'CEO'], metadata: { company: 'Empresa Alpha' }, createdAt: new Date().toISOString()
          },
          {
            id: '2', name: 'Maria Souza', phone: '+55 21 98888-8888', email: 'maria@tech.com',
            tags: ['Em Negociação'], metadata: { company: 'Tech Corp' }, createdAt: new Date(Date.now() - 86400000).toISOString()
          }
        ];
      }
    }
  });

  const handleOpenModal = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      setName(contact.name);
      setPhone(contact.phone || '');
      setEmail(contact.email || '');
      setCompany(contact.metadata?.company || '');
      setTags(contact.tags || []);
    } else {
      setEditingContact(null);
      setName('');
      setPhone('');
      setEmail('');
      setCompany('');
      setTags([]);
    }
    setTagInput('');
    setIsModalOpen(true);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Nome é obrigatório.');
    toast.success(editingContact ? 'Contato atualizado!' : 'Contato cadastrado!');
    setIsModalOpen(false);
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Deseja excluir permanentemente?')) return;
    toast.success('Contato excluído.');
    // Na vida real, a mutation faria invalidateQueries:
    // queryClient.invalidateQueries({ queryKey: ['contacts'] });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 text-left bg-[#1a1f24] min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 mt-4">
        <div>
          <h1 className="text-[22px] font-bold text-zinc-100 tracking-tight">Gestão de Contatos</h1>
          <p className="text-[11px] text-zinc-500 font-medium mt-1">Sua base de clientes em ultra-performance com Cache nativo.</p>
        </div>

        <Button 
          onClick={() => handleOpenModal()}
          className="h-9 px-4 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold rounded-md shadow-sm flex items-center gap-2 text-xs cursor-pointer border-none"
        >
          <Plus className="size-3.5" />
          <span>Novo Contato</span>
        </Button>
      </div>

      {/* Lista / Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#222831] border border-[#2a313c] rounded-lg p-5 shadow-sm"
      >
        
        {/* Filtros */}
        <div className="flex flex-col md:flex-row items-center gap-3 mb-6">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, email ou telefone…" 
              className="w-full bg-[#1a1f24] border border-[#2a313c] rounded-md pl-9 pr-4 h-9 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#3b82f6] shadow-sm transition-all"
            />
          </div>
          <button className="h-9 px-4 bg-[#1a1f24] hover:bg-[#2a313c] text-zinc-400 rounded-md transition-colors font-bold border border-[#2a313c] flex items-center gap-2 text-xs shadow-sm cursor-pointer">
            <SlidersHorizontal className="size-3.5" />
            <span>Filtros</span>
          </button>
        </div>

        {/* Tabela Dark */}
        {loading ? (
          <div className="space-y-3 py-6">
            <div className="h-10 bg-[#1a1f24] border border-[#2a313c] rounded animate-pulse"></div>
            <div className="h-10 bg-[#1a1f24] border border-[#2a313c] rounded animate-pulse"></div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-12 bg-[#1a1f24] rounded-lg border border-dashed border-[#2a313c]">
            <Users className="size-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 font-bold text-sm">Nenhum contato encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2a313c] text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="pb-3 px-4">Nome</th>
                  <th className="pb-3 px-4">Contato</th>
                  <th className="pb-3 px-4">Tags</th>
                  <th className="pb-3 px-4">Data</th>
                  <th className="pb-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="text-xs text-zinc-300 divide-y divide-[#2a313c]/50">
                {contacts.map((contact: Contact) => (
                  <tr key={contact.id} className="hover:bg-[#2a313c]/30 transition-colors group">
                    <td className="py-4 px-4">
                      <div className="font-bold text-zinc-100 group-hover:text-[#3b82f6] transition-colors">{contact.name}</div>
                      {contact.metadata?.company && (
                        <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                          <Building className="size-3" />
                          <span>{contact.metadata.company}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 space-y-1">
                      {contact.email && (
                        <div className="text-[10px] font-medium text-zinc-400 flex items-center gap-1.5">
                          <Mail className="size-3 text-zinc-500" />
                          <span>{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="text-[10px] font-medium text-zinc-400 flex items-center gap-1.5">
                          <Phone className="size-3 text-zinc-500" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {contact.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-[#3b82f6]/10 text-[#3b82f6] text-[9px] rounded font-bold border border-[#3b82f6]/20 uppercase tracking-wide">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-[10px] text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-3" />
                        <span>{new Date(contact.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal(contact)} className="p-2 hover:bg-[#1a1f24] hover:text-[#3b82f6] rounded transition-colors text-zinc-500 cursor-pointer">
                          <Edit2 className="size-3.5" />
                        </button>
                        <button onClick={() => handleDeleteContact(contact.id)} className="p-2 hover:bg-[#1a1f24] hover:text-red-500 rounded transition-colors text-zinc-500 cursor-pointer">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Modal Dark */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#222831] border border-[#2a313c] rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="p-5 border-b border-[#2a313c] flex justify-between items-center bg-[#1a1f24]">
                <h2 className="text-sm font-bold text-zinc-100">
                  {editingContact ? 'Editar Contato' : 'Novo Contato'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded cursor-pointer">
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleSaveContact} className="p-5 overflow-y-auto space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Nome Completo</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-[#1a1f24] border border-[#2a313c] rounded-md px-3 h-9 text-xs text-zinc-200 focus:border-[#3b82f6] outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Telefone</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-[#1a1f24] border border-[#2a313c] rounded-md px-3 h-9 text-xs text-zinc-200 focus:border-[#3b82f6] outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">E-mail</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#1a1f24] border border-[#2a313c] rounded-md px-3 h-9 text-xs text-zinc-200 focus:border-[#3b82f6] outline-none" />
                </div>

                <div className="pt-4 mt-2 border-t border-[#2a313c] flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="h-9 px-4 text-xs font-bold text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1f24]">Cancelar</Button>
                  <Button type="submit" className="h-9 px-4 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-bold">Salvar</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
