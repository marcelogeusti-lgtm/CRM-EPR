'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bot, Plus, Play, Pause, Trash2, Clock, MessageSquare, AlertTriangle, ArrowRight, Settings2, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/system/PageHeader';
import { EmptyState } from '@/components/system/EmptyState';
import { motion } from 'framer-motion';

interface WorkflowAction {
  id?: string;
  type: string;
  config: any;
  order: number;
}

interface Workflow {
  id: string;
  name: string;
  trigger: string;
  isActive: boolean;
  actions: WorkflowAction[];
  createdAt: string;
}

export default function AutomationsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('deal.created');
  const [actions, setActions] = useState<WorkflowAction[]>([]);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await axios.get(`${apiUrl}/workflows`);
      setWorkflows(res.data);
    } catch (err) {
      console.error(err);
      setWorkflows([
        {
          id: 'w-1',
          name: 'Boas-vindas Lead Quente',
          trigger: 'deal.created',
          isActive: true,
          createdAt: new Date().toISOString(),
          actions: [
            { type: 'delay', config: { duration: 5, unit: 'minutes' }, order: 0 },
            { type: 'send_message', config: { message: 'Olá {nome}, tudo bem? Sou o assistente inteligente da Pulse!' }, order: 1 }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (workflow?: Workflow) => {
    if (workflow) {
      setEditingWorkflow(workflow);
      setName(workflow.name);
      setTrigger(workflow.trigger);
      setActions(workflow.actions || []);
    } else {
      setEditingWorkflow(null);
      setName('');
      setTrigger('deal.created');
      setActions([]);
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || actions.length === 0) {
      toast.error('Preencha o nome e adicione ao menos uma ação');
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const data = { name, trigger, actions, isActive: true };

      if (editingWorkflow) {
        await axios.put(`${apiUrl}/workflows/${editingWorkflow.id}`, data);
        toast.success('Cadência atualizada com sucesso!');
      } else {
        await axios.post(`${apiUrl}/workflows`, data);
        toast.success('Cadência criada com sucesso!');
      }
      setIsModalOpen(false);
      fetchWorkflows();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar cadência');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta cadência?')) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      await axios.delete(`${apiUrl}/workflows/${id}`);
      toast.success('Cadência excluída');
      fetchWorkflows();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir cadência');
    }
  };

  const toggleStatus = async (workflow: Workflow) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      await axios.put(`${apiUrl}/workflows/${workflow.id}`, {
        ...workflow,
        isActive: !workflow.isActive
      });
      fetchWorkflows();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao alterar status');
    }
  };

  const addAction = (type: string) => {
    let config = {};
    if (type === 'delay') config = { duration: 60, unit: 'minutes' };
    if (type === 'send_message') config = { message: '' };

    setActions([...actions, { type, config, order: actions.length }]);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const updateActionConfig = (index: number, key: string, value: any) => {
    const newActions = [...actions];
    newActions[index].config = { ...newActions[index].config, [key]: value };
    setActions(newActions);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* PageHeader unificado */}
      <PageHeader 
        title="Automações & Cadências"
        description="Crie réguas de comunicação e drips inteligentes automatizados via WhatsApp."
        actions={
          <button 
            onClick={() => handleOpenModal()}
            className="h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-sm flex items-center gap-2 text-sm"
          >
            <Plus className="size-[18px]" />
            Nova Cadência
          </button>
        }
      />

      {/* Grid Listagem */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2].map(i => (
            <div key={i} className="h-48 bg-white border border-zinc-200 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <EmptyState 
          icon={Bot}
          title="Nenhuma cadência criada"
          description="Configure réguas de conversação automáticas para engajar leads novos e antigos."
          action={
            <button 
              onClick={() => handleOpenModal()} 
              className="h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Criar Primeira Cadência
            </button>
          }
        />
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {workflows.map(workflow => (
            <CardLayout 
              key={workflow.id}
              workflow={workflow}
              toggleStatus={toggleStatus}
              handleOpenModal={handleOpenModal}
              handleDelete={handleDelete}
            />
          ))}
        </motion.div>
      )}

      {/* Modal de Criação / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h2 className="text-xl font-bold text-zinc-900">
                {editingWorkflow ? 'Editar Cadência' : 'Nova Cadência'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-zinc-400 hover:text-zinc-600 transition-colors text-lg"
              >
                ✕
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Nome da Cadência</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 h-11 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                    placeholder="Ex: Boas-vindas Novo Lead"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Gatilho Comercial</label>
                  <select 
                    value={trigger}
                    onChange={(e) => setTrigger(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 h-11 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  >
                    <option value="deal.created">Pipeline: Novo Negócio Criado</option>
                    <option value="deal.won">Pipeline: Negócio Ganho (Fechado)</option>
                    <option value="contact.created">Contatos: Novo Contato Registrado</option>
                    <option value="order.paid">Financeiro: Faturamento Pago</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-zinc-100 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider">Ações Lineares</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => addAction('delay')} 
                      className="px-3 h-8 bg-zinc-50 hover:bg-zinc-100 rounded-lg text-xs font-semibold text-zinc-600 flex items-center gap-1.5 transition-colors border border-zinc-200"
                    >
                      <Clock className="size-3.5 text-orange-500" /> Atraso
                    </button>
                    <button 
                      onClick={() => addAction('send_message')} 
                      className="px-3 h-8 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-semibold text-blue-600 flex items-center gap-1.5 transition-colors border border-blue-150"
                    >
                      <MessageSquare className="size-3.5 text-blue-500" /> Mensagem
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {actions.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                      <p className="text-zinc-500 text-xs font-medium">Nenhuma ação cadastrada.</p>
                      <p className="text-[10px] text-zinc-400 mt-1">Adicione atrasos e mensagens no painel acima.</p>
                    </div>
                  ) : actions.map((action, index) => (
                    <div key={index} className="flex gap-4 items-start bg-zinc-50 p-4 rounded-xl border border-zinc-200/60 relative group">
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-2">
                            {action.type === 'delay' ? <Clock className="size-4 text-orange-500" /> : <MessageSquare className="size-4 text-blue-500" />}
                            Ação {index + 1}: {action.type === 'delay' ? 'Aguardar (Delay)' : 'Enviar WhatsApp'}
                          </span>
                          <button 
                            onClick={() => removeAction(index)} 
                            className="text-zinc-400 hover:text-red-500 transition-colors p-1 hover:bg-zinc-200/50 rounded-lg"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        
                        {action.type === 'delay' ? (
                          <div className="flex gap-3">
                            <input 
                              type="number" 
                              value={action.config.duration}
                              onChange={(e) => updateActionConfig(index, 'duration', parseInt(e.target.value))}
                              className="w-24 bg-white border border-zinc-200 rounded-xl px-3 h-10 text-sm text-zinc-800 focus:outline-none"
                            />
                            <select 
                              value={action.config.unit}
                              onChange={(e) => updateActionConfig(index, 'unit', e.target.value)}
                              className="flex-1 bg-white border border-zinc-200 rounded-xl px-3 h-10 text-sm text-zinc-800 focus:outline-none"
                            >
                              <option value="minutes">Minutos</option>
                              <option value="hours">Horas</option>
                              <option value="days">Dias</option>
                            </select>
                          </div>
                        ) : (
                          <div>
                            <textarea 
                              value={action.config.message}
                              onChange={(e) => updateActionConfig(index, 'message', e.target.value)}
                              rows={3}
                              className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800 focus:outline-none resize-none placeholder-zinc-400 leading-relaxed shadow-sm"
                              placeholder="Olá {nome}, tudo bem? Notei que..."
                            />
                            <p className="text-[10px] text-zinc-400 mt-1.5">Variáveis permitidas: {'{nome}'}, {'{empresa}'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
            
            {/* Modal Actions */}
            <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 h-11 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-medium rounded-xl text-xs transition-colors shadow-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="px-5 h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-xs transition-colors shadow-sm"
              >
                Salvar Cadência
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* Card customizado local de Workflow */
function CardLayout({ workflow, toggleStatus, handleOpenModal, handleDelete }: any) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-base font-bold text-zinc-800 group-hover:text-zinc-950 transition-colors">{workflow.name}</h3>
          <p className="text-[10px] text-blue-600 font-bold font-mono bg-blue-50 border border-blue-100 inline-block px-2.5 py-0.5 rounded-full mt-2 uppercase tracking-wide">
            Gatilho: {workflow.trigger}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => toggleStatus(workflow)}
            className={`p-2 rounded-xl transition-all border ${
              workflow.isActive 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                : 'bg-zinc-50 text-zinc-400 border-zinc-200'
            }`}
          >
            {workflow.isActive ? <Play className="size-3.5 fill-emerald-600" /> : <Pause className="size-3.5" />}
          </button>
          <button 
            onClick={() => handleOpenModal(workflow)} 
            className="px-3 py-2 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            Editar
          </button>
          <button 
            onClick={() => handleDelete(workflow.id)} 
            className="p-2 bg-white hover:bg-red-50 text-red-600 rounded-xl transition-colors border border-zinc-200 hover:border-red-100 shadow-sm"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Visual Workflow Steps (Timeline) */}
      <div className="space-y-3 pt-4 border-t border-zinc-50 relative before:absolute before:inset-y-0 before:left-[15px] before:w-0.5 before:bg-zinc-100">
        {workflow.actions?.map((action: any, idx: number) => (
          <div key={idx} className="relative flex items-center justify-between gap-3">
            <div className="flex items-center justify-center size-8 rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm shrink-0 z-10">
              {action.type === 'delay' ? <Clock className="size-3.5 text-orange-500" /> : <MessageSquare className="size-3.5 text-blue-500" />}
            </div>
            <div className="w-[calc(100%-2.5rem)] bg-zinc-50 border border-zinc-200/60 p-3 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-zinc-800">
                  {action.type === 'delay' ? 'Aguardar' : 'Enviar WhatsApp'}
                </div>
                <div className="text-[10px] text-zinc-400 truncate max-w-[200px] mt-0.5 leading-relaxed">
                  {action.type === 'delay' ? `${action.config.duration} ${action.config.unit}` : action.config.message}
                </div>
              </div>
              <ArrowRight className="size-3.5 text-zinc-300 mr-1" />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
