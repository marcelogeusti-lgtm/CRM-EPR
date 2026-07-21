'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Phone, User, Database, Zap, Settings, RefreshCw, Send, ChevronLeft, Volume2, Maximize, Activity, X, Loader2, Check, ChevronUp, ChevronDown, ShieldAlert, Wrench, KeyRound, MessageSquare, TrendingUp, Info } from 'lucide-react';
import {
  getAiAgent,
  saveAiAgent,
  setAiAgentActive,
  getCompanySettings,
  saveCompanySettings,
  getAiAgentStats,
  type ScriptStepInput,
  type ScriptStepBlockInput,
  type ObjectionInput,
  type KnowledgeSourceInput,
} from '@/actions/salesbot';
import { uploadScriptStepMedia } from '@/actions/mediaUpload';
import { withRetry } from '@/lib/withRetry';
import { PERSONALITY_TRAIT_GUIDE } from '@/lib/agentPrompt';

type Tab = 'painel' | 'persona' | 'fontes' | 'acoes' | 'integracoes' | 'configs';

const DEFAULT_PERSONA = "Você é um assistente de vendas e consulta inteligente que ajuda os clientes a escolher o sistema de gestão NEXT para suas barbearias...";
const DEFAULT_DIRECTIVES = [
  "Comunique-se em primeira pessoa, como um representante real.",
  "Saudações devem ser feitas apenas na primeira interação.",
  "Pergunte de forma educada se as informações estiverem incompletas."
];
const PERSONALITY_OPTIONS = [
  'Confiante', 'Inspirador', 'Amigável', 'Direto', 'Meigo', 'Firme',
  'Pé no chão', 'Orientado a ação', 'Emocional', 'Agressivo', 'SPIN Selling',
];

function moveItem<T>(arr: T[], index: number, direction: -1 | 1): T[] {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= arr.length) return arr;
  const copy = [...arr];
  [copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
  return copy;
}

function StringListEditor({
  items, onChange, addLabel, placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  addLabel: string;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2 bg-[#161616] border border-[#2a2a2a] p-1.5 pl-3 rounded-lg text-sm text-zinc-400">
          <input
            value={item}
            onChange={(e) => onChange(items.map((v, i) => i === idx ? e.target.value : v))}
            placeholder={placeholder}
            className="flex-1 bg-transparent focus:outline-none text-zinc-300"
          />
          <button onClick={() => onChange(items.filter((_, i) => i !== idx))} className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors shrink-0">
            <X className="size-4" />
          </button>
        </div>
      ))}
      {items.length === 0 && <p className="text-xs text-zinc-600">Nada configurado ainda.</p>}
      <button onClick={() => onChange([...items, ''])} className="text-indigo-400 text-sm hover:text-indigo-300 font-medium">{addLabel}</button>
    </div>
  );
}

const MEDIA_ACCEPT: Record<'AUDIO' | 'IMAGE' | 'VIDEO', string> = {
  AUDIO: 'audio/mpeg,audio/ogg,audio/mp4,audio/wav,audio/webm,audio/aac',
  IMAGE: 'image/jpeg,image/png,image/webp,image/gif',
  VIDEO: 'video/mp4,video/quicktime,video/webm',
};

const MEDIA_LABEL: Record<'AUDIO' | 'IMAGE' | 'VIDEO', string> = {
  AUDIO: 'Áudio',
  IMAGE: 'Imagem',
  VIDEO: 'Vídeo',
};

function ScriptStepsEditor({
  steps, onChange, addLabel,
}: {
  steps: ScriptStepInput[];
  onChange: (steps: ScriptStepInput[]) => void;
  addLabel: string;
}) {
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});

  const [recordingIdx, setRecordingIdx] = useState<number | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const recordedChunksRef = React.useRef<Blob[]>([]);
  const recordedBlobRef = React.useRef<Blob | null>(null);
  const recordTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  function updateStepBlocks(idx: number, updater: (blocks: ScriptStepBlockInput[]) => ScriptStepBlockInput[]) {
    onChange(steps.map((s, i) => i === idx ? { ...s, blocks: updater(s.blocks) } : s));
  }

  function addTextBlock(idx: number) {
    updateStepBlocks(idx, blocks => [...blocks, { type: 'TEXT', content: '', mediaUrl: null }]);
  }

  async function handleFileSelected(idx: number, mediaType: 'AUDIO' | 'IMAGE' | 'VIDEO', file: File) {
    const key = `${idx}-${mediaType}`;
    setUploadError(null);
    setUploadingKey(key);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { url } = await uploadScriptStepMedia(mediaType, formData);
      updateStepBlocks(idx, blocks => [...blocks, { type: mediaType, content: null, mediaUrl: url }]);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Falha ao enviar o arquivo.');
    } finally {
      setUploadingKey(null);
    }
  }

  function clearRecordingState() {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    recordedChunksRef.current = [];
    recordedBlobRef.current = null;
    setRecordedUrl(null);
    setPreviewIdx(null);
    setRecordSeconds(0);
  }

  async function startRecording(idx: number) {
    setUploadError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ['audio/webm', 'audio/mp4', 'audio/ogg'].find(t => MediaRecorder.isTypeSupported(t));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        recordedBlobRef.current = blob;
        setRecordedUrl(URL.createObjectURL(blob));
        setPreviewIdx(idx);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecordSeconds(0);
      setRecordingIdx(idx);
      recordTimerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
    } catch {
      setUploadError('Não foi possível acessar o microfone. Verifique a permissão do navegador.');
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setRecordingIdx(null);
  }

  async function confirmRecording(idx: number) {
    const blob = recordedBlobRef.current;
    if (!blob) return;
    setIsUploadingRecording(true);
    setUploadError(null);
    try {
      const ext = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm';
      const file = new File([blob], `gravacao-${Date.now()}.${ext}`, { type: blob.type });
      const formData = new FormData();
      formData.append('file', file);
      const { url } = await uploadScriptStepMedia('AUDIO', formData);
      updateStepBlocks(idx, blocks => [...blocks, { type: 'AUDIO', content: null, mediaUrl: url }]);
      clearRecordingState();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Falha ao enviar a gravação.');
    } finally {
      setIsUploadingRecording(false);
    }
  }

  return (
    <div className="space-y-3">
      {uploadError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 text-xs text-red-400">{uploadError}</div>
      )}
      {steps.map((step, idx) => (
        <div key={idx} className="bg-[#161616] border border-[#2a2a2a] rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-500 w-5 shrink-0">{idx + 1}.</span>
            <input
              value={step.title}
              onChange={(e) => onChange(steps.map((s, i) => i === idx ? { ...s, title: e.target.value } : s))}
              placeholder="Nome da etapa (ex: Apresentação)"
              className="flex-1 bg-transparent font-semibold text-sm text-zinc-200 focus:outline-none"
            />
            <button onClick={() => onChange(moveItem(steps, idx, -1))} disabled={idx === 0} className="p-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-20 disabled:hover:text-zinc-500">
              <ChevronUp className="size-4" />
            </button>
            <button onClick={() => onChange(moveItem(steps, idx, 1))} disabled={idx === steps.length - 1} className="p-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-20 disabled:hover:text-zinc-500">
              <ChevronDown className="size-4" />
            </button>
            <button onClick={() => onChange(steps.filter((_, i) => i !== idx))} className="p-1 text-zinc-500 hover:text-red-400">
              <X className="size-4" />
            </button>
          </div>
          <textarea
            value={step.content}
            onChange={(e) => onChange(steps.map((s, i) => i === idx ? { ...s, content: e.target.value } : s))}
            placeholder="O que a IA deve fazer/perguntar nesta etapa..."
            className="w-full h-16 bg-[#111] border border-[#2a2a2a] rounded-lg p-2 text-xs text-zinc-400 focus:outline-none focus:border-indigo-500/50 resize-none"
          />

          {step.blocks.length > 0 && (
            <div className="space-y-1.5">
              {step.blocks.map((block, bIdx) => (
                <div key={bIdx} className="flex items-center gap-2 bg-[#111] border border-[#2a2a2a] rounded-lg p-2 text-xs">
                  <span className="text-zinc-600 font-mono shrink-0">{bIdx + 1}.</span>
                  {block.type === 'TEXT' ? (
                    <input
                      value={block.content || ''}
                      onChange={(e) => updateStepBlocks(idx, blocks => blocks.map((b, bi) => bi === bIdx ? { ...b, content: e.target.value } : b))}
                      placeholder="Texto da mensagem..."
                      className="flex-1 bg-transparent text-zinc-300 focus:outline-none"
                    />
                  ) : (
                    <>
                      <span className="text-emerald-400 font-medium shrink-0">{MEDIA_LABEL[block.type as 'AUDIO' | 'IMAGE' | 'VIDEO']}</span>
                      <a href={block.mediaUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-300 truncate flex-1">{block.mediaUrl}</a>
                    </>
                  )}
                  <button onClick={() => updateStepBlocks(idx, blocks => moveItem(blocks, bIdx, -1))} disabled={bIdx === 0} className="p-0.5 text-zinc-500 hover:text-zinc-300 disabled:opacity-20 shrink-0">
                    <ChevronUp className="size-3.5" />
                  </button>
                  <button onClick={() => updateStepBlocks(idx, blocks => moveItem(blocks, bIdx, 1))} disabled={bIdx === step.blocks.length - 1} className="p-0.5 text-zinc-500 hover:text-zinc-300 disabled:opacity-20 shrink-0">
                    <ChevronDown className="size-3.5" />
                  </button>
                  <button onClick={() => updateStepBlocks(idx, blocks => blocks.filter((_, bi) => bi !== bIdx))} className="p-0.5 text-zinc-500 hover:text-red-400 shrink-0">
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <button type="button" onClick={() => addTextBlock(idx)} className="text-[11px] text-zinc-500 hover:text-indigo-400 font-medium">
              + Texto
            </button>
            {(['AUDIO', 'IMAGE', 'VIDEO'] as const).map(mediaType => {
              const key = `${idx}-${mediaType}`;
              return (
                <React.Fragment key={mediaType}>
                  <input
                    ref={(el) => { fileInputRefs.current[key] = el; }}
                    type="file"
                    accept={MEDIA_ACCEPT[mediaType]}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelected(idx, mediaType, file);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    disabled={uploadingKey === key}
                    onClick={() => fileInputRefs.current[key]?.click()}
                    className="text-[11px] text-zinc-500 hover:text-indigo-400 disabled:opacity-40 font-medium"
                  >
                    {uploadingKey === key ? 'Enviando...' : `+ ${MEDIA_LABEL[mediaType]}`}
                  </button>
                </React.Fragment>
              );
            })}

            {recordingIdx === idx ? (
              <button type="button" onClick={stopRecording} className="text-[11px] text-red-400 font-medium flex items-center gap-1">
                ⏹ Parar ({Math.floor(recordSeconds / 60)}:{String(recordSeconds % 60).padStart(2, '0')})
              </button>
            ) : previewIdx === idx && recordedUrl ? (
              <div className="flex items-center gap-2">
                <audio controls src={recordedUrl} className="h-7" />
                <button type="button" onClick={() => confirmRecording(idx)} disabled={isUploadingRecording} className="text-[11px] text-emerald-400 hover:text-emerald-300 disabled:opacity-40 font-medium">
                  {isUploadingRecording ? 'Enviando...' : '✓ Usar áudio'}
                </button>
                <button type="button" onClick={clearRecordingState} disabled={isUploadingRecording} className="text-[11px] text-zinc-500 hover:text-red-400 disabled:opacity-40 font-medium">
                  Descartar
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={recordingIdx !== null}
                onClick={() => startRecording(idx)}
                className="text-[11px] text-zinc-500 hover:text-indigo-400 disabled:opacity-40 font-medium"
              >
                🎙 Gravar áudio
              </button>
            )}
          </div>
        </div>
      ))}
      <button onClick={() => onChange([...steps, { title: '', content: '', blocks: [] }])} className="text-indigo-400 text-sm hover:text-indigo-300 font-medium">{addLabel}</button>
    </div>
  );
}

function ObjectionsEditor({
  objections, onChange,
}: {
  objections: ObjectionInput[];
  onChange: (objections: ObjectionInput[]) => void;
}) {
  return (
    <div className="space-y-3">
      {objections.map((obj, idx) => (
        <div key={idx} className="bg-[#161616] border border-[#2a2a2a] rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              value={obj.title}
              onChange={(e) => onChange(objections.map((o, i) => i === idx ? { ...o, title: e.target.value } : o))}
              placeholder='Objeção (ex: "Tá caro")'
              className="flex-1 bg-transparent font-semibold text-sm text-zinc-200 focus:outline-none"
            />
            <button onClick={() => onChange(objections.filter((_, i) => i !== idx))} className="p-1 text-zinc-500 hover:text-red-400 shrink-0">
              <X className="size-4" />
            </button>
          </div>
          <textarea
            value={obj.response}
            onChange={(e) => onChange(objections.map((o, i) => i === idx ? { ...o, response: e.target.value } : o))}
            placeholder="Como o agente deve responder a essa objeção..."
            className="w-full h-16 bg-[#111] border border-[#2a2a2a] rounded-lg p-2 text-xs text-zinc-400 focus:outline-none focus:border-indigo-500/50 resize-none"
          />
        </div>
      ))}
      <button onClick={() => onChange([...objections, { title: '', response: '' }])} className="text-indigo-400 text-sm hover:text-indigo-300 font-medium">+ Adicionar objeção</button>
    </div>
  );
}

function KnowledgeSourceEditor({
  sources, onChange,
}: {
  sources: KnowledgeSourceInput[];
  onChange: (sources: KnowledgeSourceInput[]) => void;
}) {
  return (
    <div className="space-y-3">
      {sources.map((source, idx) => (
        <div key={idx} className="bg-[#161616] border border-[#2a2a2a] rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              value={source.title}
              onChange={(e) => onChange(sources.map((s, i) => i === idx ? { ...s, title: e.target.value } : s))}
              placeholder='Título (ex: "Tabela de Preços")'
              className="flex-1 bg-transparent font-semibold text-sm text-zinc-200 focus:outline-none"
            />
            <button onClick={() => onChange(sources.filter((_, i) => i !== idx))} className="p-1 text-zinc-500 hover:text-red-400 shrink-0">
              <X className="size-4" />
            </button>
          </div>
          <textarea
            value={source.content}
            onChange={(e) => onChange(sources.map((s, i) => i === idx ? { ...s, content: e.target.value } : s))}
            placeholder="Cole ou escreva aqui: preços, medidas, especificações — o que a IA deve saber sobre o seu negócio."
            className="w-full h-32 bg-[#111] border border-[#2a2a2a] rounded-lg p-2 text-xs text-zinc-400 focus:outline-none focus:border-indigo-500/50 resize-none"
          />
        </div>
      ))}
      {sources.length === 0 && <p className="text-xs text-zinc-600">Nenhuma fonte cadastrada ainda.</p>}
      <button onClick={() => onChange([...sources, { title: '', content: '' }])} className="text-indigo-400 text-sm hover:text-indigo-300 font-medium">+ Adicionar fonte</button>
    </div>
  );
}

export default function SalesbotPage() {
  const [activeTab, setActiveTab] = useState<Tab>('persona');
  const [isAgentActive, setIsAgentActive] = useState(false);
  const [isTogglingAgent, setIsTogglingAgent] = useState(false);

  // Persona states
  const [isLoadingAgent, setIsLoadingAgent] = useState(true);
  const [agentLoadError, setAgentLoadError] = useState('');
  const [isSavingPersona, setIsSavingPersona] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [persona, setPersona] = useState(DEFAULT_PERSONA);
  const [personalityTags, setPersonalityTags] = useState<string[]>(['Amigável']);
  const [responseSize, setResponseSize] = useState("Médias");
  const [pauseSeconds, setPauseSeconds] = useState("3");
  const [responseLanguage, setResponseLanguage] = useState("Correspondente");
  const [directives, setDirectives] = useState<string[]>(DEFAULT_DIRECTIVES);
  const [typicalExpressions, setTypicalExpressions] = useState<string[]>([]);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [attendanceSteps, setAttendanceSteps] = useState<ScriptStepInput[]>([]);
  const [closingSteps, setClosingSteps] = useState<ScriptStepInput[]>([]);
  const [objections, setObjections] = useState<ObjectionInput[]>([]);
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSourceInput[]>([]);
  const [serviceOrderMode, setServiceOrderMode] = useState('MANUAL');

  // Config da empresa (Tenant, não do AiAgent) — chave Pix pra IA informar
  // quando o cliente pedir pra pagar uma Ordem de Serviço.
  const [pixKey, setPixKey] = useState('');
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [companySaved, setCompanySaved] = useState(false);

  // Painel — métricas reais do agente
  const [stats, setStats] = useState<{ periodDays: number; conversationsTouched: number; aiMessagesSent: number; newLeads: number } | null>(null);
  const [statsError, setStatsError] = useState('');

  useEffect(() => {
    withRetry(() => getAiAgent()).then(agent => {
      if (agent) {
        setIsAgentActive(agent.isActive);
        setPersona(agent.systemPrompt || DEFAULT_PERSONA);
        setResponseSize(agent.responseSize);
        setResponseLanguage(agent.responseLanguage);
        setPauseSeconds(String(agent.pauseSeconds));
        setNegativePrompt(agent.negativePrompt || '');
        setServiceOrderMode(agent.serviceOrderMode);

        const parseArray = (value: string | null, fallback: string[]) => {
          try {
            const parsed = value ? JSON.parse(value) : fallback;
            return Array.isArray(parsed) ? parsed : fallback;
          } catch {
            return fallback;
          }
        };
        setPersonalityTags(parseArray(agent.personalityTags, ['Amigável']));
        setDirectives(parseArray(agent.directives, DEFAULT_DIRECTIVES));
        setTypicalExpressions(parseArray(agent.typicalExpressions, []));

        const toStepInput = (s: typeof agent.scriptSteps[number]): ScriptStepInput => ({
          title: s.title,
          content: s.content || '',
          blocks: s.blocks.map(b => ({ type: b.type, content: b.content, mediaUrl: b.mediaUrl })),
        });
        setAttendanceSteps(agent.scriptSteps.filter(s => s.type === 'ATENDIMENTO').map(toStepInput));
        setClosingSteps(agent.scriptSteps.filter(s => s.type === 'FECHAMENTO').map(toStepInput));
        setObjections(agent.objections.map(o => ({ title: o.title, response: o.response })));
        setKnowledgeSources(agent.knowledgeSources.map(s => ({ title: s.title, content: s.content })));
      }
      setIsLoadingAgent(false);
    }).catch(err => {
      console.error(err);
      setAgentLoadError('Não foi possível carregar o agente. Tente recarregar a página.');
      setIsLoadingAgent(false);
    });

    withRetry(() => getCompanySettings()).then(settings => {
      setPixKey(settings.pixKey);
    }).catch(err => console.error(err));

    withRetry(() => getAiAgentStats()).then(setStats).catch(err => {
      console.error(err);
      setStatsError('Não foi possível carregar as métricas.');
    });
  }, []);

  function togglePersonalityTag(tag: string) {
    setPersonalityTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  async function handleToggleAgent() {
    setIsTogglingAgent(true);
    const next = !isAgentActive;
    try {
      const agent = await setAiAgentActive(next);
      setIsAgentActive(agent.isActive);
    } catch (e) {
      console.error(e);
      alert('Falha ao alterar o status do agente.');
    } finally {
      setIsTogglingAgent(false);
    }
  }

  async function handleSavePersona() {
    setIsSavingPersona(true);
    setJustSaved(false);
    try {
      await saveAiAgent({
        systemPrompt: persona,
        personalityTags,
        responseSize,
        responseLanguage,
        pauseSeconds: parseInt(pauseSeconds, 10) || 0,
        directives,
        typicalExpressions,
        negativePrompt,
        attendanceSteps,
        closingSteps,
        objections,
        knowledgeSources,
        serviceOrderMode,
      });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (e) {
      console.error(e);
      alert('Falha ao salvar as configurações do agente.');
    } finally {
      setIsSavingPersona(false);
    }
  }

  async function handleSaveCompany() {
    setIsSavingCompany(true);
    setCompanySaved(false);
    try {
      await saveCompanySettings({ pixKey });
      setCompanySaved(true);
      setTimeout(() => setCompanySaved(false), 2000);
    } catch (e) {
      console.error(e);
      alert('Falha ao salvar a chave Pix.');
    } finally {
      setIsSavingCompany(false);
    }
  }

  // Simulator states
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', role: 'assistant', content: 'Sou seu agente de IA conectado ao Cérebro da OpenAI! Você pode me testar fazendo perguntas para ver o que eu sei.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { id: Date.now().toString(), role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      const aiMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: '' };
      setMessages([...newMessages, aiMsg]);

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          aiMsg.content += chunk;
          setMessages([...newMessages, { ...aiMsg }]);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'painel', name: 'Painel', icon: Activity },
    { id: 'persona', name: 'Persona', icon: User },
    { id: 'fontes', name: 'Fontes', icon: Database },
    { id: 'acoes', name: 'Ações', icon: Zap },
    { id: 'integracoes', name: 'Integrações', icon: Maximize },
    { id: 'configs', name: 'Configurações', icon: Settings },
  ] as const;

  return (
    <div className="flex flex-col md:flex-row h-full bg-[#0a0a0a] text-white overflow-y-auto md:overflow-hidden">

      {/* Left Area (Settings) */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="px-4 md:px-8 pt-6 pb-2 border-b border-[#222]">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
                <Bot className="size-5 text-indigo-400" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-100">NEXT Assistente de Vendas</h1>
            </div>
            <button
              onClick={handleToggleAgent}
              disabled={isTogglingAgent || isLoadingAgent}
              className={`self-start sm:self-auto px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50 ${
                isAgentActive ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {isTogglingAgent && <Loader2 className="size-4 animate-spin" />}
              {isAgentActive ? 'Agente de IA Ativo' : 'Ativar agente de IA'}
            </button>
          </div>

          <p className="text-[11px] text-zinc-600 mb-4">
            Este é o interruptor global — também pode ser ligado automaticamente por uma regra de
            etapa (Automações → Fluxos → Regras rápidas) ou por um Fluxo que termine em &quot;IA Assume&quot;.
          </p>

          {/* Sub Navigation */}
          <div className="flex gap-6 overflow-x-auto custom-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === tab.id ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.name}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-500 rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 md:overflow-y-auto p-4 md:p-8 custom-scrollbar">

          {agentLoadError && (
            <div className="mb-6 max-w-3xl bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
              {agentLoadError}
            </div>
          )}

          {activeTab === 'persona' && (
            <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-sm font-medium text-zinc-400 mb-1">Configure o agente de IA para conversar com clientes do jeito que você preferir.</h2>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-200">Função e personalidade (Prompt de Sistema)</label>
                <p className="text-xs text-zinc-500">
                  Responda estas 5 perguntas pra escrever uma persona forte: <strong>quem</strong> ela é, <strong>o que</strong> ela faz,
                  <strong> como</strong> ela faz, <strong>por que</strong> ela faz, e <strong>qual o público-alvo</strong> dela.
                </p>
                <textarea
                  value={persona}
                  onChange={(e) => setPersona(e.target.value)}
                  className="w-full h-40 bg-[#111] border border-[#333] rounded-xl p-4 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50 resize-none"
                  placeholder="Escreva como o agente deve se comportar..."
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-200">Personalidade do agente</label>
                <p className="text-xs text-zinc-500">Selecione as características que melhor definem como o agente deve atender.</p>
                <div className="flex flex-wrap gap-2">
                  {PERSONALITY_OPTIONS.map(tag => {
                    const guide = PERSONALITY_TRAIT_GUIDE[tag];
                    const tooltip = guide
                      ? `${guide.comoFunciona.join(' • ')}\nEx.: "${guide.exemploTom}"\nImpacto: ${guide.impacto}`
                      : undefined;
                    return (
                      <button
                        key={tag}
                        title={tooltip}
                        onClick={() => togglePersonalityTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                          personalityTags.includes(tag)
                            ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                            : 'bg-[#141414] border-[#333] text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-[#222]">
                <label className="text-sm font-bold text-zinc-200">Script de Atendimento</label>
                <p className="text-xs text-zinc-500">Etapas, em ordem, que a IA deve seguir para qualificar o lead.</p>
                <ScriptStepsEditor steps={attendanceSteps} onChange={setAttendanceSteps} addLabel="+ Adicionar etapa" />
              </div>

              <div className="space-y-3 pt-4 border-t border-[#222]">
                <label className="text-sm font-bold text-zinc-200">Script de Fechamento</label>
                <p className="text-xs text-zinc-500">Etapas para quando o lead estiver pronto para comprar.</p>
                <ScriptStepsEditor steps={closingSteps} onChange={setClosingSteps} addLabel="+ Adicionar etapa de fechamento" />
              </div>

              <div className="space-y-3 pt-4 border-t border-[#222]">
                <label className="text-sm font-bold text-zinc-200">Script de Objeções</label>
                <p className="text-xs text-zinc-500">Objeções comuns dos leads e como o agente deve responder.</p>
                <ObjectionsEditor objections={objections} onChange={setObjections} />
              </div>

              <div className="space-y-3 pt-4 border-t border-[#222]">
                <label className="text-sm font-bold text-zinc-200">Expressões Típicas</label>
                <p className="text-xs text-zinc-500">Frases/bordões que o agente pode usar para soar mais natural e no seu tom.</p>
                <StringListEditor
                  items={typicalExpressions}
                  onChange={setTypicalExpressions}
                  addLabel="+ Adicionar expressão"
                  placeholder='Ex: "faz sentido pra você?"'
                />
              </div>

              <div className="space-y-3 pt-4 border-t border-[#222]">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-zinc-200">Diretrizes (Regras Opcionais)</label>
                </div>
                <StringListEditor
                  items={directives}
                  onChange={setDirectives}
                  addLabel="+ Adicionar diretriz"
                  placeholder="Escreva uma regra para o agente seguir..."
                />
              </div>

              <div className="space-y-3 pt-4 border-t border-[#222]">
                <label className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                  <ShieldAlert className="size-4 text-red-400" />
                  Prompt Negativo
                </label>
                <p className="text-xs text-zinc-500">Defina o que o agente NUNCA deve fazer ou dizer.</p>
                <textarea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  className="w-full h-24 bg-[#111] border border-[#333] rounded-xl p-4 text-sm text-zinc-300 focus:outline-none focus:border-red-500/50 resize-none"
                  placeholder="Ex: nunca prometa prazos de entrega, nunca fale mal da concorrência..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222]">
                {justSaved && (
                  <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium animate-in fade-in">
                    <Check className="size-4" /> Salvo
                  </span>
                )}
                <button
                  onClick={handleSavePersona}
                  disabled={isSavingPersona || isLoadingAgent}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                >
                  {isSavingPersona && <Loader2 className="size-4 animate-spin" />}
                  Salvar alterações
                </button>
              </div>

            </div>
          )}

          {activeTab === 'configs' && (
            <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-sm font-medium text-zinc-400 mb-1">Parâmetros técnicos de como o agente formata e ritma as respostas.</h2>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-zinc-200">Tamanho das respostas</label>
                  <select
                    value={responseSize}
                    onChange={(e) => setResponseSize(e.target.value)}
                    className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50"
                  >
                    <option>Curtas</option>
                    <option>Médias</option>
                    <option>Longas (Explicativas)</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-zinc-200">Idioma</label>
                  <select
                    value={responseLanguage}
                    onChange={(e) => setResponseLanguage(e.target.value)}
                    className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50"
                  >
                    <option>Correspondente</option>
                    <option>Português</option>
                    <option>Inglês</option>
                    <option>Espanhol</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-200">Pausa antes da resposta (segundos)</label>
                <p className="text-xs text-zinc-500">Isso evita que o robô responda rápido demais e pareça artificial. Ele simulará a digitação.</p>
                <input
                  type="number"
                  value={pauseSeconds}
                  onChange={(e) => setPauseSeconds(e.target.value)}
                  className="w-full max-w-[150px] bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="space-y-3 pt-4 border-t border-[#222]">
                <label className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                  <Wrench className="size-4 text-blue-400" />
                  Ordem de Serviço
                </label>
                <p className="text-xs text-zinc-500">Como o agente lida com pedidos de Ordem de Serviço numa conversa.</p>
                <select
                  value={serviceOrderMode}
                  onChange={(e) => setServiceOrderMode(e.target.value)}
                  className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="MANUAL">Manual — o agente nunca cria Ordem de Serviço sozinho</option>
                  <option value="SEMI_AUTO">Semiautomático — o agente monta um rascunho, um humano confirma</option>
                  <option value="AUTO">Automático — reservado para depois (ainda não implementado)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222]">
                {justSaved && (
                  <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium animate-in fade-in">
                    <Check className="size-4" /> Salvo
                  </span>
                )}
                <button
                  onClick={handleSavePersona}
                  disabled={isSavingPersona || isLoadingAgent}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                >
                  {isSavingPersona && <Loader2 className="size-4 animate-spin" />}
                  Salvar alterações
                </button>
              </div>

              <div className="space-y-3 pt-8 border-t border-[#222]">
                <label className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                  <KeyRound className="size-4 text-emerald-400" />
                  Chave Pix da empresa
                </label>
                <p className="text-xs text-zinc-500">O agente informa esta chave quando o cliente pedir pra pagar uma Ordem de Serviço. Cobrança e conferência de pagamento continuam manuais.</p>
                <input
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50"
                  placeholder="Ex: chave@suaempresa.com.br, CNPJ, telefone ou chave aleatória"
                />
                <div className="flex items-center justify-end gap-3">
                  {companySaved && (
                    <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium animate-in fade-in">
                      <Check className="size-4" /> Salvo
                    </span>
                  )}
                  <button
                    onClick={handleSaveCompany}
                    disabled={isSavingCompany}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                  >
                    {isSavingCompany && <Loader2 className="size-4 animate-spin" />}
                    Salvar chave Pix
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fontes' && (
            <div className="max-w-3xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-sm font-medium text-zinc-400 mb-1">Cole ou escreva tabelas de preços, medidas padrão e especificações — a IA usa isso como referência ao responder e montar orçamentos.</h2>
              </div>
              <KnowledgeSourceEditor sources={knowledgeSources} onChange={setKnowledgeSources} />
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222]">
                {justSaved && (
                  <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium animate-in fade-in">
                    <Check className="size-4" /> Salvo
                  </span>
                )}
                <button
                  onClick={handleSavePersona}
                  disabled={isSavingPersona || isLoadingAgent}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                >
                  {isSavingPersona && <Loader2 className="size-4 animate-spin" />}
                  Salvar alterações
                </button>
              </div>
            </div>
          )}

          {activeTab === 'painel' && (
            <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-sm font-medium text-zinc-400 mb-1">
                  {stats ? `Últimos ${stats.periodDays} dias.` : 'Carregando métricas...'}
                </h2>
              </div>

              {statsError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
                  {statsError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#111] border border-[#222] p-5 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="size-6 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 font-medium">Conversas com a IA</p>
                    <p className="text-xl font-bold text-white">{stats ? stats.conversationsTouched : '—'}</p>
                  </div>
                </div>

                <div className="bg-[#111] border border-[#222] p-5 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Bot className="size-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 font-medium">Mensagens enviadas pela IA</p>
                    <p className="text-xl font-bold text-white">{stats ? stats.aiMessagesSent : '—'}</p>
                  </div>
                </div>

                <div className="bg-[#111] border border-[#222] p-5 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="size-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 font-medium">Novos leads no período</p>
                    <p className="text-xl font-bold text-white">{stats ? stats.newLeads : '—'}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-[#111] border border-[#222] rounded-xl p-4 text-sm text-zinc-400">
                <Info className="size-4 text-zinc-500 shrink-0 mt-0.5" />
                <p>
                  Taxa de conversão ainda não aparece aqui porque o seu funil não tem uma etapa marcada
                  como &quot;ganho/fechado&quot; — sem isso o cálculo seria um chute. Se você criar essa etapa
                  no Pipeline, a gente liga a métrica.
                </p>
              </div>
            </div>
          )}

          {(activeTab === 'acoes' || activeTab === 'integracoes') && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 animate-in fade-in">
              <Database className="size-12 mb-4 opacity-20" />
              <h3 className="text-lg font-bold text-zinc-400">Em Desenvolvimento</h3>
              <p className="text-sm mt-2 max-w-sm text-center">
                {activeTab === 'acoes' && 'Ferramentas que a IA poderá executar (function calling) — como abrir automaticamente uma Ordem de Serviço rascunho no modo Semiautomático. Próximo passo depois da gestão manual de Ordens de Serviço.'}
                {activeTab === 'integracoes' && 'Vínculo deste agente com canais específicos (WhatsApp/Instagram) — hoje o agente vale para o workspace inteiro.'}
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Right Area (Simulator) */}
      <div className="w-full md:w-[400px] bg-[#111] border-l border-[#222] p-6 flex flex-col shrink-0 relative overflow-hidden md:overflow-y-auto custom-scrollbar">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] pointer-events-none rounded-full" />

        <div className="flex items-center justify-between mb-6 relative z-10 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-indigo-400" />
            <h2 className="font-bold text-zinc-100">Simulador</h2>
          </div>
          <button
            onClick={() => setMessages([{ id: '1', role: 'assistant', content: 'Sou seu agente de IA conectado ao Cérebro da OpenAI! Você pode me testar fazendo perguntas para ver o que eu sei.' }])}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#222] rounded-lg text-xs text-zinc-400 transition-colors border border-[#333]"
          >
            <RefreshCw className="size-3" />
            Reiniciar
          </button>
        </div>

        {/* iPhone Frame — tamanho fixo de celular real, não esticado pra altura da tela */}
        <div className="relative w-[300px] h-[640px] max-h-full mx-auto my-auto shrink-0 bg-white rounded-[40px] shadow-2xl overflow-hidden border-[8px] border-[#222] flex flex-col z-10">

          {/* Notch */}
          <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50">
            <div className="w-32 h-6 bg-[#222] rounded-b-3xl"></div>
          </div>

          {/* Phone Header */}
          <div className="bg-[#f0f2f5] pt-10 pb-3 px-4 flex items-center gap-3 shrink-0 shadow-sm z-40">
            <ChevronLeft className="size-6 text-blue-500" />
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              <Sparkles className="size-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-[#111b21] leading-tight">Agente de IA</h3>
              <p className="text-[11px] text-emerald-600 font-medium">online</p>
            </div>
          </div>

          {/* Phone Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-[#e5ddd5] opacity-90 custom-scrollbar relative">
            {/* WhatsApp Doodle background simulation */}
            <div className="absolute inset-0 opacity-[0.06] bg-[url('https://static.whatsapp.net/rsrc.php/v3/yl/r/r2qK74-L7_D.png')] bg-repeat pointer-events-none" style={{ backgroundSize: '400px' }}></div>

            {messages.map((msg) => (
              <div key={msg.id} className={`flex relative z-10 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role !== 'user' && (
                  <div className="w-6 h-6 rounded-full bg-indigo-500 shrink-0 mr-2 flex items-center justify-center mt-auto shadow-sm">
                    <Sparkles className="size-3 text-white" />
                  </div>
                )}
                <div className={`p-3 rounded-2xl max-w-[85%] shadow-sm relative ${
                  msg.role === 'user'
                    ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-none'
                    : 'bg-white text-[#111b21] rounded-tl-none'
                }`}>
                  <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Phone Input Area */}
          <form onSubmit={onSubmit} className="bg-[#f0f2f5] p-3 flex items-center gap-2 shrink-0">
            <div className="flex-1 bg-white rounded-full flex items-center px-4 py-2 shadow-sm border border-gray-200">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Mensagem..."
                className="w-full text-[14px] focus:outline-none text-gray-800 bg-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                input.trim() && !isLoading ? 'bg-emerald-500 text-white shadow-md' : 'bg-transparent text-gray-400'
              }`}
            >
              {input.trim() ? <Send className="size-4 ml-1" /> : <Volume2 className="size-5" />}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
