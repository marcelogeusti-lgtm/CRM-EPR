'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Bot, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Clock, 
  MessageSquare, 
  AlertCircle, 
  ArrowRight, 
  Settings2, 
  SlidersHorizontal,
  PlusCircle,
  Zap,
  Save,
  ChevronLeft,
  Settings,
  Sparkles,
  Info,
  Layers,
  Activity,
  CheckCircle2,
  Workflow
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/system/PageHeader';
import { EmptyState } from '@/components/system/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface WorkflowAction {
  id?: string;
  type: string;
  config: any;
  order: number;
}

interface WorkflowData {
  id?: string;
  name: string;
  trigger: string;
  isActive: boolean;
  actions: WorkflowAction[];
  createdAt?: string;
}

export default function AutomationsPage() {
  const [workflows, setWorkflows] = useState<WorkflowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowData | null>(null);

  // Estados do Editor Visual de Nós
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('deal.moved');
  const [nodes, setNodes] = useState<any[]>([]);
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const res = await axios.get(`${apiUrl}/workflows`);
      setWorkflows(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar automações do banco. Utilizando dados simulados.');
      setWorkflows([
        {
          id: 'w-1',
          name: 'Boas-vindas Lead Novo',
          trigger: 'deal.moved',
          isActive: true,
          createdAt: new Date().toISOString(),
          actions: [
            { type: 'SEND_MESSAGE', config: { message: 'Olá {name}, vi que seu atendimento iniciou no estágio {stage}! 🚀 Como posso te ajudar hoje?' }, order: 0 },
            { type: 'UPDATE_DEAL', config: { status: 'WON' }, order: 1 }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 1. Iniciar Edição/Criação com Canvas Visual de Nós
  const handleOpenCanvas = (workflow?: WorkflowData) => {
    if (workflow) {
      setEditingWorkflow(workflow);
      setName(workflow.name);
      setTrigger(workflow.trigger);
      
      // Converte lista de ações lineares em Nós Visuais
      const visualNodes = (workflow.actions || []).map((act, index) => ({
        id: `node-${index}`,
        type: act.type,
        config: act.config,
        order: act.order,
        x: 280 + index * 260, // Posição horizontal no Canvas
        y: 180 + (index % 2 === 0 ? 30 : -30) // Oscilação sutil
      }));
      setNodes(visualNodes);
    } else {
      setEditingWorkflow(null);
      setName('Fluxo de Vendas Automático');
      setTrigger('deal.moved');
      
      // Cria nó padrão inicial
      setNodes([
        { 
          id: 'node-0', 
          type: 'SEND_MESSAGE', 
          config: { message: 'Olá {name}! Obrigado pelo contato.' }, 
          order: 0, 
          x: 320, 
          y: 200 
        }
      ]);
    }
    setSelectedNodeIndex(null);
    setIsEditorOpen(true);
  };

  // 2. Adicionar Nó no Canvas
  const handleAddVisualNode = (type: string) => {
    let config = {};
    if (type === 'SEND_MESSAGE') config = { message: 'Olá {name}! Tudo bem?' };
    if (type === 'UPDATE_DEAL') config = { status: 'WON' };

    const newIndex = nodes.length;
    const lastNode = nodes[nodes.length - 1];
    const newX = lastNode ? lastNode.x + 260 : 320;
    const newY = lastNode ? lastNode.y + (newIndex % 2 === 0 ? 40 : -40) : 200;

    const newNode = {
      id: `node-${newIndex}`,
      type,
      config,
      order: newIndex,
      x: newX,
      y: newY
    };

    setNodes([...nodes, newNode]);
    setSelectedNodeIndex(newIndex);
    toast.success(`Nó de ${type === 'SEND_MESSAGE' ? 'WhatsApp' : 'Kanban'} adicionado ao fluxo.`);
  };

  // 3. Atualizar Parâmetro do Nó
  const handleUpdateNodeConfig = (key: string, value: any) => {
    if (selectedNodeIndex === null) return;
    const updatedNodes = [...nodes];
    updatedNodes[selectedNodeIndex].config = {
      ...updatedNodes[selectedNodeIndex].config,
      [key]: value
    };
    setNodes(updatedNodes);
  };

  // 4. Deletar Nó
  const handleDeleteNode = (idx: number) => {
    const updatedNodes = nodes.filter((_, i) => i !== idx).map((node, i) => ({
      ...node,
      order: i
    }));
    setNodes(updatedNodes);
    setSelectedNodeIndex(null);
    toast.info('Nó removido do fluxo.');
  };

  // 5. Salvar Configuração Visual para a API
  const handleSaveWorkflow = async () => {
    if (!name.trim()) {
      return toast.error('Dê um nome para o fluxo de automação.');
    }
    if (nodes.length === 0) {
      return toast.error('Adicione pelo menos um nó de ação ao canvas.');
    }

    const actionsPayload: WorkflowAction[] = nodes.map((node, i) => ({
      type: node.type,
      config: node.config,
      order: i
    }));

    try {
      const data = {
        name,
        trigger,
        actions: actionsPayload,
        isActive: editingWorkflow ? editingWorkflow.isActive : true
      };

      if (editingWorkflow?.id) {
        await axios.put(`${apiUrl}/workflows/${editingWorkflow.id}`, data);
        toast.success('Nós de automação sincronizados com o banco de dados!');
      } else {
        await axios.post(`${apiUrl}/workflows`, data);
        toast.success('Automação visual criada e ativada com sucesso!');
      }

      setIsEditorOpen(false);
      fetchWorkflows();
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao salvar fluxo no servidor.');
    }
  };

  // Alterar Status Ativo/Inativo
  const handleToggleActive = async (workflow: WorkflowData) => {
    try {
      await axios.put(`${apiUrl}/workflows/${workflow.id}`, {
        ...workflow,
        isActive: !workflow.isActive
      });
      toast.success(workflow.isActive ? 'Automação pausada.' : 'Automação ativada!');
      fetchWorkflows();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao alterar status.');
    }
  };

  // Excluir Workflow Completo
  const handleDeleteWorkflow = async (id: string) => {
    if (!confirm('Deseja deletar permanentemente este fluxo visual e todos os seus nós?')) return;

    try {
      await axios.delete(`${apiUrl}/workflows/${id}`);
      toast.success('Fluxo de automação deletado.');
      fetchWorkflows();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao deletar fluxo.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 text-left">
      
      <AnimatePresence mode="wait">
        {!isEditorOpen ? (
          // ================= VIEW: LISTAGEM DE FLUXOS =================
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <PageHeader 
                title="Automações Visuais (Node Builder)"
                description="Desenhe fluxos inteligentes ligando gatilhos comerciais do CRM a nós de decisões e disparos de WhatsApp."
              />
              <Button 
                onClick={() => handleOpenCanvas()}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md font-bold px-4 py-2.5 flex items-center gap-2 cursor-pointer border-none"
              >
                <Plus className="size-4" />
                <span>Novo Fluxo</span>
              </Button>
            </div>

            {/* Listagem em Cards */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <div key={i} className="h-44 bg-white border border-slate-200 rounded-2xl animate-pulse"></div>
                ))}
              </div>
            ) : workflows.length === 0 ? (
              <EmptyState 
                icon={Bot}
                title="Nenhuma automação desenhada"
                description="Use nosso Construtor de Nós para automatizar disparos de WhatsApp quando leads forem movidos."
                action={
                  <Button 
                    onClick={() => handleOpenCanvas()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                  >
                    Desenhar Primeiro Fluxo
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {workflows.map((workflow) => (
                  <div 
                    key={workflow.id}
                    className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{workflow.name}</h4>
                          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full mt-2 inline-block uppercase tracking-wider">
                            Gatilho: {workflow.trigger === 'deal.moved' ? 'Lead Movido Stage' : 'Mensagem Recebida'}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleToggleActive(workflow)}
                            className={cn(
                              "size-8 rounded-xl flex items-center justify-center transition-all border cursor-pointer",
                              workflow.isActive 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' 
                                : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                            )}
                          >
                            {workflow.isActive ? <Play className="size-3.5 fill-emerald-600 text-emerald-600" /> : <Pause className="size-3.5" />}
                          </button>

                          <button 
                            onClick={() => handleOpenCanvas(workflow)}
                            className="px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            Editar Nós
                          </button>

                          <button 
                            onClick={() => handleDeleteWorkflow(workflow.id!)}
                            className="size-8 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-50 border border-slate-200 hover:border-red-150 transition-all cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Timeline Preview of Nodes */}
                      <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                        {workflow.actions?.map((act, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-[10px] font-medium text-slate-650">
                            <div className="size-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-[8px]">{idx + 1}</div>
                            <span className="font-bold text-slate-800">
                              {act.type === 'SEND_MESSAGE' ? 'Enviar WhatsApp' : 'Mover Lead'}
                            </span>
                            <span className="text-slate-400 truncate max-w-[240px]">
                              - {act.type === 'SEND_MESSAGE' ? act.config?.message : `Status: ${act.config?.status}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          // ================= VIEW: VISUAL CANVAS NODE BUILDER =================
          <motion.div 
            key="editor"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col h-[calc(100vh-140px)] border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-lg"
          >
            
            {/* Header do Canvas */}
            <div className="h-[64px] border-b border-slate-200 px-6 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsEditorOpen(false)}
                  className="p-1.5 hover:bg-slate-150 rounded-xl text-slate-500 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <div className="h-4 w-px bg-slate-300" />
                <div className="flex items-center gap-2">
                  <Workflow className="size-4.5 text-blue-600 animate-pulse" />
                  <input 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-transparent font-bold text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 px-2 py-0.5 rounded-lg border-none w-[200px]"
                    placeholder="Nome do Fluxo"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setIsEditorOpen(false)}
                  className="rounded-xl border-slate-250 hover:bg-slate-50 font-bold text-xs h-9 cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveWorkflow}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs h-9 flex items-center gap-1.5 cursor-pointer border-none"
                >
                  <Save className="size-3.5" />
                  <span>Sincronizar Nós</span>
                </Button>
              </div>
            </div>

            {/* Area Principal: Canvas + Sidebar */}
            <div className="flex-1 flex overflow-hidden relative">
              
              {/* CANVAS GRID (Make/Zapier Grid) */}
              <div className="flex-1 relative overflow-auto bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] bg-slate-50 select-none">
                
                {/* SVG Connections (Bézier Curves between nodes) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="#3b82f6" />
                    </marker>
                  </defs>

                  {/* Curva do Gatilho para o Primeiro Nó */}
                  {nodes.length > 0 && (
                    <path 
                      d={`M 160 250 C 220 250, 200 ${nodes[0].y + 50}, ${nodes[0].x} ${nodes[0].y + 50}`}
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                  )}

                  {/* Curvas entre os Nós de Ação subsequentes */}
                  {nodes.map((node, i) => {
                    if (i === nodes.length - 1) return null;
                    const nextNode = nodes[i + 1];
                    const startX = node.x + 240;
                    const startY = node.y + 50;
                    const endX = nextNode.x;
                    const endY = nextNode.y + 50;

                    return (
                      <path 
                        key={i}
                        d={`M ${startX} ${startY} C ${(startX + endX) / 2} ${startY}, ${(startX + endX) / 2} ${endY}, ${endX} ${endY}`}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2.5"
                        markerEnd="url(#arrow)"
                      />
                    );
                  })}
                </svg>

                {/* Floating Node: TRIGGER (GATILHO COMERCIAL) */}
                <div 
                  className="absolute z-10 p-5 rounded-2xl bg-white border border-slate-200 shadow-md w-[180px] text-left"
                  style={{ left: 40, top: 200 }}
                >
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Gatilho do Fluxo</span>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="size-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <Zap className="size-4 animate-bounce" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Quando</span>
                      <select 
                        value={trigger}
                        onChange={(e) => setTrigger(e.target.value)}
                        className="text-[10px] font-bold text-slate-500 bg-transparent border-none focus:outline-none p-0 cursor-pointer mt-0.5"
                      >
                        <option value="deal.moved">Lead Mover Estágio</option>
                        <option value="message.received">Mensagem Recebida</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Dynamic List of Action Nodes */}
                {nodes.map((node, idx) => {
                  const isSelected = selectedNodeIndex === idx;

                  return (
                    <motion.div
                      key={node.id}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={cn(
                        "absolute z-10 w-[240px] rounded-2xl bg-white border shadow-md p-4 transition-all duration-200 cursor-pointer",
                        isSelected 
                          ? 'border-blue-500 ring-4 ring-blue-500/10' 
                          : 'border-slate-200 hover:border-slate-350 hover:shadow-lg'
                      )}
                      style={{ left: node.x, top: node.y }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNodeIndex(idx);
                      }}
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-3">
                        <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          {node.type === 'SEND_MESSAGE' ? <MessageSquare className="size-3 text-blue-500" /> : <Layers className="size-3 text-amber-500" />}
                          Ação {idx + 1}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNode(idx);
                            }}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </div>

                      <div className="text-left space-y-1">
                        <span className="text-[11px] font-bold text-slate-800 block">
                          {node.type === 'SEND_MESSAGE' ? 'Enviar WhatsApp' : 'Mover Lead Kanban'}
                        </span>
                        <p className="text-[10px] text-slate-400 truncate max-w-[210px] leading-relaxed">
                          {node.type === 'SEND_MESSAGE' 
                            ? (node.config?.message || '(Mensagem em branco)') 
                            : `Status Final: ${node.config?.status || 'WON'}`}
                        </p>
                      </div>

                      {/* Ponto de Entrada / Saída visual */}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-slate-200 border-2 border-white -ml-1.5" />
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white -mr-1.5 shadow-sm" />
                    </motion.div>
                  );
                })}

                {/* Canvas Empty State Helper if no actions */}
                {nodes.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-xs text-slate-400 font-medium">Use a barra lateral para adicionar nós ao seu fluxo.</p>
                  </div>
                )}
              </div>

              {/* SIDEBAR: NODE TOOLBOX & CONFIGURATION DRAWERS */}
              <div className="w-[300px] border-l border-slate-200 flex flex-col bg-white flex-shrink-0 z-20 text-left">
                
                {/* TOOL 1: ADD NODES */}
                <div className="p-4 border-b border-slate-200">
                  <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-3">Inserir Nós de Ações</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleAddVisualNode('SEND_MESSAGE')}
                      className="p-3 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-all hover:scale-102 hover:shadow-sm text-center"
                    >
                      <MessageSquare className="size-5 text-blue-600" />
                      <span className="text-[9px] font-bold text-blue-700 leading-tight">WhatsApp</span>
                    </button>

                    <button 
                      onClick={() => handleAddVisualNode('UPDATE_DEAL')}
                      className="p-3 bg-amber-50/50 hover:bg-amber-50 border border-amber-100 rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-all hover:scale-102 hover:shadow-sm text-center"
                    >
                      <Layers className="size-5 text-amber-600" />
                      <span className="text-[9px] font-bold text-amber-700 leading-tight">Mover Lead</span>
                    </button>
                  </div>
                </div>

                {/* TOOL 2: CONFIGURATION OF SELECTED NODE */}
                <div className="flex-1 p-4 overflow-y-auto">
                  {selectedNodeIndex !== null ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
                        <h6 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Parâmetros do Nó {selectedNodeIndex + 1}</h6>
                        <span className="text-[9px] font-bold text-slate-400">Ativo</span>
                      </div>

                      {nodes[selectedNodeIndex].type === 'SEND_MESSAGE' ? (
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[10px] uppercase font-bold text-slate-400">Mensagem de Disparo</label>
                              <span className="text-[8px] font-bold text-blue-600 bg-blue-50 px-1 py-0.5 rounded flex items-center gap-0.5">
                                <Sparkles className="size-2 text-blue-500 animate-pulse" /> Placeholders
                              </span>
                            </div>
                            <textarea
                              value={nodes[selectedNodeIndex].config?.message || ''}
                              onChange={(e) => handleUpdateNodeConfig('message', e.target.value)}
                              rows={5}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder:text-slate-450 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white resize-none shadow-sm leading-relaxed"
                              placeholder="Olá {name}, seu lead foi movido no Kanban..."
                            />
                            
                            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex gap-2 mt-2">
                              <Info className="size-3.5 text-blue-500 shrink-0 mt-0.5" />
                              <p className="text-[9px] text-blue-600 leading-normal font-medium">
                                Tags: <strong>{`{name}`}</strong> (Nome do lead), <strong>{`{stage}`}</strong> (Novo estágio do Kanban).
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Status Final no Pipeline</label>
                            <select
                              value={nodes[selectedNodeIndex].config?.status || 'WON'}
                              onChange={(e) => handleUpdateNodeConfig('status', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                              <option value="WON">Ganhado (WON)</option>
                              <option value="LOST">Perdido (LOST)</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
                      <Settings className="size-8 text-slate-300 animate-spin" style={{ animationDuration: '6s' }} />
                      <p className="text-[11px] font-semibold mt-3">Nenhum nó selecionado</p>
                      <p className="text-[9px] text-slate-450 mt-1 max-w-[200px]">Clique em qualquer nó de ação no grid quadriculado para customizar seus parâmetros.</p>
                    </div>
                  )}
                </div>

              </div>

            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
