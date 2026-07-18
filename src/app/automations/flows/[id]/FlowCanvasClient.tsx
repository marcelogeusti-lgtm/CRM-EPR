'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, Loader2, Check, Trash2, X, Play,
  MessageSquare, Image as ImageIcon, GitBranch, Tag, Bot,
} from 'lucide-react';
import { saveFlow, setFlowActive, deleteFlow, type FlowNodeInput, type FlowEdgeInput } from '@/actions/automationFlows';
import { uploadScriptStepMedia, type UploadableMediaType } from '@/actions/mediaUpload';

type DbFlow = {
  id: string;
  name: string;
  triggerType: string;
  triggerConfig: string | null;
  isActive: boolean;
  nodes: { id: string; type: string; positionX: number; positionY: number; data: string }[];
  edges: { id: string; sourceNodeId: string; targetNodeId: string; sourceHandle: string | null }[];
};

const DB_TO_RF_TYPE: Record<string, string> = {
  TRIGGER: 'trigger',
  SEND_MESSAGE: 'sendMessage',
  SEND_MEDIA: 'sendMedia',
  CONDITION: 'condition',
  ADD_TAG: 'addTag',
  AI_HANDOFF: 'aiHandoff',
};
const RF_TO_DB_TYPE: Record<string, string> = Object.fromEntries(
  Object.entries(DB_TO_RF_TYPE).map(([k, v]) => [v, k])
);

function parseJson(value: string | null): Record<string, unknown> {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

// ---- Nós customizados ----

function NodeShell({
  id, title, icon, color, onDelete, children, hasTarget = true,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  onDelete?: (id: string) => void;
  children?: React.ReactNode;
  hasTarget?: boolean;
}) {
  return (
    <div className="bg-[#161616] border border-[#2a2a2a] rounded-lg shadow-lg min-w-[240px]">
      {hasTarget && <Handle type="target" position={Position.Top} className="!bg-zinc-500" />}
      <div className={`flex items-center gap-2 px-3 py-2 border-b border-[#2a2a2a] rounded-t-lg ${color}`}>
        {icon}
        <span className="text-xs font-bold text-white flex-1">{title}</span>
        {onDelete && (
          <button onClick={() => onDelete(id)} className="text-white/70 hover:text-white">
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function TriggerNode() {
  return (
    <NodeShell id="trigger" title="Início" icon={<Play className="size-3.5 text-white" />} color="bg-emerald-600/80" hasTarget={false}>
      <p className="text-xs text-zinc-500">Dispara quando o gatilho configurado no topo da página bater.</p>
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-500" />
    </NodeShell>
  );
}

function SendMessageNode({ id, data }: NodeProps) {
  const d = data as { text?: string; onChange: (id: string, patch: Record<string, unknown>) => void; onDelete: (id: string) => void };
  return (
    <NodeShell id={id} title="Enviar Texto" icon={<MessageSquare className="size-3.5 text-white" />} color="bg-indigo-600/80" onDelete={d.onDelete}>
      <textarea
        value={d.text || ''}
        onChange={(e) => d.onChange(id, { text: e.target.value })}
        placeholder="Mensagem que a IA/fluxo vai enviar..."
        className="nodrag w-full h-16 bg-[#111] border border-[#2a2a2a] rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50 resize-none"
      />
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-500" />
    </NodeShell>
  );
}

function SendMediaNode({ id, data }: NodeProps) {
  const d = data as {
    mediaType?: UploadableMediaType;
    mediaUrl?: string;
    onChange: (id: string, patch: Record<string, unknown>) => void;
    onDelete: (id: string) => void;
  };
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(mediaType: UploadableMediaType, file: File) {
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { url } = await uploadScriptStepMedia(mediaType, formData);
      d.onChange(id, { mediaType, mediaUrl: url });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha no upload.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <NodeShell id={id} title="Enviar Mídia" icon={<ImageIcon className="size-3.5 text-white" />} color="bg-purple-600/80" onDelete={d.onDelete}>
      {error && <p className="text-[10px] text-red-400 mb-2">{error}</p>}
      {d.mediaUrl ? (
        <div className="flex items-center gap-2 bg-[#111] border border-[#2a2a2a] rounded p-2 text-[10px]">
          <span className="text-emerald-400 font-bold shrink-0">{d.mediaType}</span>
          <span className="text-zinc-500 truncate flex-1">{d.mediaUrl}</span>
          <button onClick={() => d.onChange(id, { mediaType: undefined, mediaUrl: undefined })} className="text-zinc-500 hover:text-red-400 shrink-0">
            <X className="size-3" />
          </button>
        </div>
      ) : (
        <div className="nodrag flex gap-2">
          {(['IMAGE', 'AUDIO', 'VIDEO'] as const).map((mt) => (
            <label key={mt} className="text-[10px] text-zinc-400 hover:text-purple-400 cursor-pointer font-medium">
              {uploading ? '...' : `+ ${mt}`}
              <input
                type="file"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(mt, file);
                  e.target.value = '';
                }}
              />
            </label>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-purple-500" />
    </NodeShell>
  );
}

function ConditionNode({ id, data }: NodeProps) {
  const d = data as { rule?: string; value?: string; onChange: (id: string, patch: Record<string, unknown>) => void; onDelete: (id: string) => void };
  return (
    <NodeShell id={id} title="Condição" icon={<GitBranch className="size-3.5 text-white" />} color="bg-amber-600/80" onDelete={d.onDelete}>
      <div className="nodrag space-y-2">
        <select
          value={d.rule || 'MESSAGE_CONTAINS'}
          onChange={(e) => d.onChange(id, { rule: e.target.value })}
          className="w-full bg-[#111] border border-[#2a2a2a] rounded p-1.5 text-xs text-zinc-300 focus:outline-none"
        >
          <option value="MESSAGE_CONTAINS">Mensagem contém</option>
          <option value="HAS_TAG">Contato tem a tag</option>
        </select>
        <input
          value={d.value || ''}
          onChange={(e) => d.onChange(id, { value: e.target.value })}
          placeholder={d.rule === 'HAS_TAG' ? 'nome da tag' : 'palavra ou frase'}
          className="w-full bg-[#111] border border-[#2a2a2a] rounded p-1.5 text-xs text-zinc-300 focus:outline-none"
        />
      </div>
      <div className="flex justify-between text-[10px] font-bold text-zinc-500 mt-2 px-1">
        <span>Sim</span>
        <span>Não</span>
      </div>
      <Handle type="source" position={Position.Bottom} id="true" style={{ left: '30%' }} className="!bg-emerald-500" />
      <Handle type="source" position={Position.Bottom} id="false" style={{ left: '70%' }} className="!bg-red-500" />
    </NodeShell>
  );
}

function AddTagNode({ id, data }: NodeProps) {
  const d = data as { tagName?: string; onChange: (id: string, patch: Record<string, unknown>) => void; onDelete: (id: string) => void };
  return (
    <NodeShell id={id} title="Adicionar Tag" icon={<Tag className="size-3.5 text-white" />} color="bg-sky-600/80" onDelete={d.onDelete}>
      <input
        value={d.tagName || ''}
        onChange={(e) => d.onChange(id, { tagName: e.target.value })}
        placeholder="nome da tag"
        className="nodrag w-full bg-[#111] border border-[#2a2a2a] rounded p-1.5 text-xs text-zinc-300 focus:outline-none"
      />
      <Handle type="source" position={Position.Bottom} className="!bg-sky-500" />
    </NodeShell>
  );
}

function AiHandoffNode({ id, data }: NodeProps) {
  const d = data as { onDelete: (id: string) => void };
  return (
    <NodeShell id={id} title="IA Assume" icon={<Bot className="size-3.5 text-white" />} color="bg-rose-600/80" onDelete={d.onDelete}>
      <p className="text-xs text-zinc-500">A partir daqui, o Agente de IA (persona/script de /salesbot) responde livremente.</p>
      <Handle type="source" position={Position.Bottom} className="!bg-rose-500" />
    </NodeShell>
  );
}

const nodeTypes = {
  trigger: TriggerNode,
  sendMessage: SendMessageNode,
  sendMedia: SendMediaNode,
  condition: ConditionNode,
  addTag: AddTagNode,
  aiHandoff: AiHandoffNode,
};

const PALETTE: { type: string; label: string; icon: React.ReactNode; defaultData: Record<string, unknown> }[] = [
  { type: 'sendMessage', label: 'Enviar Texto', icon: <MessageSquare className="size-4" />, defaultData: { text: '' } },
  { type: 'sendMedia', label: 'Enviar Mídia', icon: <ImageIcon className="size-4" />, defaultData: {} },
  { type: 'condition', label: 'Condição', icon: <GitBranch className="size-4" />, defaultData: { rule: 'MESSAGE_CONTAINS', value: '' } },
  { type: 'addTag', label: 'Adicionar Tag', icon: <Tag className="size-4" />, defaultData: { tagName: '' } },
  { type: 'aiHandoff', label: 'IA Assume', icon: <Bot className="size-4" />, defaultData: {} },
];

export default function FlowCanvasClient({ flow }: { flow: DbFlow }) {
  const router = useRouter();
  const [name, setName] = useState(flow.name);
  const [triggerType, setTriggerType] = useState(flow.triggerType);
  const triggerConfigParsed = useMemo(() => parseJson(flow.triggerConfig), [flow.triggerConfig]);
  const [keywordsInput, setKeywordsInput] = useState(
    Array.isArray(triggerConfigParsed.keywords) ? (triggerConfigParsed.keywords as string[]).join(', ') : ''
  );

  const [isActive, setIsActive] = useState(flow.isActive);
  const [isTogglingActive, setIsTogglingActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const updateNodeData = useCallback((id: string, patch: Record<string, unknown>) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialNodes: Node[] = useMemo(
    () =>
      flow.nodes.map((n) => ({
        id: n.id,
        type: DB_TO_RF_TYPE[n.type] || 'sendMessage',
        position: { x: n.positionX, y: n.positionY },
        deletable: n.type !== 'TRIGGER',
        data: { ...parseJson(n.data), onChange: updateNodeData, onDelete: deleteNode },
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const initialEdges: Edge[] = useMemo(
    () =>
      flow.edges.map((e) => ({
        id: e.id,
        source: e.sourceNodeId,
        target: e.targetNodeId,
        sourceHandle: e.sourceHandle || undefined,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  function addNodeFromPalette(paletteType: string, defaultData: Record<string, unknown>) {
    const id = crypto.randomUUID();
    const offsetIndex = nodes.length;
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: paletteType,
        position: { x: 420 + (offsetIndex % 3) * 40, y: 80 + offsetIndex * 90 },
        data: { ...defaultData, onChange: updateNodeData, onDelete: deleteNode },
      },
    ]);
  }

  async function handleSave() {
    setIsSaving(true);
    setSaveError('');
    setJustSaved(false);
    try {
      const nodesInput: FlowNodeInput[] = nodes.map((n) => {
        const { onChange, onDelete, ...rest } = n.data as Record<string, unknown> & { onChange: unknown; onDelete: unknown };
        return {
          id: n.id,
          type: RF_TO_DB_TYPE[n.type || 'sendMessage'] || 'SEND_MESSAGE',
          positionX: n.position.x,
          positionY: n.position.y,
          data: JSON.stringify(rest),
        };
      });
      const edgesInput: FlowEdgeInput[] = edges.map((e) => ({
        id: e.id,
        sourceNodeId: e.source,
        targetNodeId: e.target,
        sourceHandle: e.sourceHandle || null,
      }));

      const triggerConfig =
        triggerType === 'KEYWORD'
          ? JSON.stringify({ keywords: keywordsInput.split(',').map((k) => k.trim()).filter(Boolean) })
          : JSON.stringify({});

      await saveFlow(flow.id, { name, triggerType, triggerConfig, nodes: nodesInput, edges: edgesInput });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Falha ao salvar o fluxo.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleActive() {
    setIsTogglingActive(true);
    const next = !isActive;
    try {
      await setFlowActive(flow.id, next);
      setIsActive(next);
    } catch {
      alert('Falha ao ativar/desativar o fluxo.');
    } finally {
      setIsTogglingActive(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Apagar o fluxo "${name}"? Essa ação não pode ser desfeita.`)) return;
    await deleteFlow(flow.id);
    router.push('/automations');
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      <div className="p-4 border-b border-[#222] flex flex-wrap items-center gap-3">
        <Link href="/automations" prefetch={false} className="text-zinc-500 hover:text-zinc-300">
          <ChevronLeft className="size-5" />
        </Link>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-transparent text-lg font-bold text-zinc-100 focus:outline-none border-b border-transparent focus:border-indigo-500/50 min-w-[160px]"
        />

        <div className="flex items-center gap-2 ml-2">
          <span className="text-xs text-zinc-500 font-medium">Gatilho:</span>
          <select
            value={triggerType}
            onChange={(e) => setTriggerType(e.target.value)}
            className="bg-[#141414] border border-[#262626] rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none"
          >
            <option value="KEYWORD">Palavra-chave</option>
            <option value="WELCOME">Primeira mensagem do contato</option>
          </select>
          {triggerType === 'KEYWORD' && (
            <input
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              placeholder="oi, ola, comprar"
              className="bg-[#141414] border border-[#262626] rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none w-48"
            />
          )}
        </div>

        <div className="flex-1" />

        {saveError && <span className="text-xs text-red-400">{saveError}</span>}
        {justSaved && (
          <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
            <Check className="size-3.5" /> Salvo
          </span>
        )}

        <button
          onClick={handleDelete}
          className="text-zinc-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
          title="Apagar fluxo"
        >
          <Trash2 className="size-4" />
        </button>

        <button
          onClick={handleToggleActive}
          disabled={isTogglingActive}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-50 ${
            isActive ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-[#222] hover:bg-[#2a2a2a] text-zinc-300'
          }`}
        >
          {isTogglingActive && <Loader2 className="size-3.5 animate-spin" />}
          {isActive ? 'Ativo' : 'Inativo'}
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
        >
          {isSaving && <Loader2 className="size-3.5 animate-spin" />}
          Salvar
        </button>
      </div>

      <div className="px-4 py-2 border-b border-[#222] flex items-center gap-2 overflow-x-auto custom-scrollbar">
        <span className="text-[11px] text-zinc-600 uppercase font-bold tracking-wider shrink-0">Adicionar bloco:</span>
        {PALETTE.map((p) => (
          <button
            key={p.type}
            onClick={() => addNodeFromPalette(p.type, p.defaultData)}
            className="flex items-center gap-1.5 bg-[#141414] border border-[#262626] hover:border-indigo-500/40 hover:text-indigo-400 text-zinc-400 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors shrink-0"
          >
            {p.icon}
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          colorMode="dark"
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}
