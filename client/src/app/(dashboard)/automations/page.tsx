'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bot, Plus, ArrowRight, Play, Pause, Trash2, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

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
      toast.error('Erro ao carregar cadências');
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
    <div className="flex-1 p-8 overflow-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
              <Bot className="h-10 w-10 text-blue-500" />
              Automações & Cadências
            </h1>
            <p className="text-gray-400 mt-2 text-lg">
              Crie réguas de relacionamento automáticas no WhatsApp para seus clientes.
            </p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Nova Cadência
          </button>
        </div>

        {/* Workflows List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="h-48 bg-white/5 border border-white/10 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-[#111111]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 text-center">
            <Bot className="h-16 w-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Nenhuma cadência criada</h3>
            <p className="text-gray-400 mb-6 max-w-md">Configure o envio automático de mensagens e alertas para a sua equipe não esquecer de nenhum follow-up.</p>
            <button onClick={() => handleOpenModal()} className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all font-medium">
              Criar Primeira Cadência
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {workflows.map(workflow => (
              <div key={workflow.id} className="group relative bg-[#111111]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 transition-all shadow-xl">
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">{workflow.name}</h3>
                    <p className="text-sm text-blue-400 mt-1 font-mono bg-blue-500/10 inline-block px-2 py-0.5 rounded">Gatilho: {workflow.trigger}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => toggleStatus(workflow)}
                      className={`p-2 rounded-lg transition-all ${workflow.isActive ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-400'}`}
                    >
                      {workflow.isActive ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    </button>
                    <button onClick={() => handleOpenModal(workflow)} className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(workflow.id)} className="p-2 bg-white/5 hover:bg-red-500/20 text-red-400 rounded-lg transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                  {workflow.actions?.map((action, idx) => (
                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full border border-white/20 bg-[#1a1a1a] text-gray-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        {action.type === 'delay' ? <Clock className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white/5 border border-white/10 p-3 rounded-xl">
                        <div className="text-sm font-semibold text-white mb-1">
                          {action.type === 'delay' ? 'Aguardar' : 'Enviar WhatsApp'}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {action.type === 'delay' ? `${action.config.duration} ${action.config.unit}` : action.config.message}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h2 className="text-2xl font-bold text-white">
                {editingWorkflow ? 'Editar Cadência' : 'Nova Cadência'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Nome da Cadência</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Ex: Boas-vindas Novo Deal"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Gatilho (Quando iniciar?)</label>
                  <select 
                    value={trigger}
                    onChange={(e) => setTrigger(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                  >
                    <option value="deal.created">Pipeline: Novo Deal Criado</option>
                    <option value="deal.won">Pipeline: Deal Ganho</option>
                    <option value="contact.created">Contatos: Novo Contato</option>
                    <option value="order.paid">Financeiro: Pedido Pago</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-white/10 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white">Sequência de Ações</h3>
                  <div className="flex gap-2">
                    <button onClick={() => addAction('delay')} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-gray-300 flex items-center gap-1 transition-all">
                      <Clock className="h-3 w-3" /> Atraso
                    </button>
                    <button onClick={() => addAction('send_message')} className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-medium flex items-center gap-1 transition-all">
                      <MessageSquare className="h-3 w-3" /> Mensagem
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {actions.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-white/20 rounded-xl">
                      <p className="text-gray-500">Nenhuma ação adicionada.</p>
                      <p className="text-sm text-gray-600 mt-1">Adicione um atraso ou mensagem acima.</p>
                    </div>
                  ) : actions.map((action, index) => (
                    <div key={index} className="flex gap-4 items-start bg-[#1a1a1a] p-4 rounded-xl border border-white/5 relative group">
                      <div className="absolute left-[-24px] top-1/2 -translate-y-1/2 text-gray-600 font-bold hidden md:block">
                        {index + 1}.
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            {action.type === 'delay' ? <Clock className="h-4 w-4 text-orange-400" /> : <MessageSquare className="h-4 w-4 text-green-400" />}
                            {action.type === 'delay' ? 'Aguardar (Delay)' : 'Enviar WhatsApp'}
                          </span>
                          <button onClick={() => removeAction(index)} className="text-gray-500 hover:text-red-400 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        
                        {action.type === 'delay' ? (
                          <div className="flex gap-3">
                            <input 
                              type="number" 
                              value={action.config.duration}
                              onChange={(e) => updateActionConfig(index, 'duration', parseInt(e.target.value))}
                              className="w-24 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none"
                            />
                            <select 
                              value={action.config.unit}
                              onChange={(e) => updateActionConfig(index, 'unit', e.target.value)}
                              className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none appearance-none"
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
                              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none resize-none placeholder-gray-600"
                              placeholder="Olá {nome}, tudo bem? Vi que você demonstrou interesse em..."
                            />
                            <p className="text-xs text-gray-500 mt-1">Variáveis: {'{nome}'}, {'{empresa}'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
            
            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 bg-transparent hover:bg-white/5 text-white font-medium rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]"
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
