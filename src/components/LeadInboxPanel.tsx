'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Check, MoreVertical, Phone, Paperclip, Mic, Tag as TagIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getDealActivities, sendMessage, sendMediaMessage, addInternalNote, getContactTags, addContactTag, removeContactTag } from '@/actions/inbox';
import { uploadScriptStepMedia, type UploadableMediaType } from '@/actions/mediaUpload';
import { convertRecordingToMp3 } from '@/lib/audioEncode';

interface LeadInboxPanelProps {
  deal: any;
  onClose: () => void;
}

type InputMode = 'MESSAGE' | 'NOTE' | 'TASK';

export function LeadInboxPanel({ deal, onClose }: LeadInboxPanelProps) {
  const [message, setMessage] = useState('');
  const [activities, setActivities] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>('MESSAGE');
  const [aiEnabled, setAiEnabled] = useState(false); // IA Toggle State
  const scrollRef = useRef<HTMLDivElement>(null);

  const [tags, setTags] = useState<{ id: string; name: string; color: string | null }[]>([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [tagError, setTagError] = useState('');

  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordedBlobRef = useRef<Blob | null>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function fetchActivities() {
      if (deal?.id) {
        const data = await getDealActivities(deal.id);
        // Só atualiza se o tamanho mudar para não quebrar scroll
        setActivities(prev => prev.length !== data.length ? data : prev);
      }
    }
    
    fetchActivities();
    
    // Polling a cada 3 segundos para buscar novas mensagens
    const interval = setInterval(fetchActivities, 3000);
    return () => clearInterval(interval);
  }, [deal?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activities]);

  useEffect(() => {
    if (!deal?.contact?.id) {
      setTags([]);
      return;
    }
    getContactTags(deal.contact.id).then(setTags).catch(err => console.error(err));
  }, [deal?.contact?.id]);

  async function handleAddTag() {
    const name = newTagInput.trim();
    if (!name || !deal?.contact?.id) return;
    setIsAddingTag(true);
    setTagError('');
    try {
      const updated = await addContactTag(deal.contact.id, name);
      setTags(updated);
      setNewTagInput('');
    } catch (e) {
      setTagError(e instanceof Error ? e.message : 'Falha ao adicionar tag.');
    } finally {
      setIsAddingTag(false);
    }
  }

  async function handleRemoveTag(tagId: string) {
    if (!deal?.contact?.id) return;
    setTags(prev => prev.filter(t => t.id !== tagId));
    try {
      await removeContactTag(deal.contact.id, tagId);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSend() {
    if (!message.trim()) return;
    setIsSending(true);
    
    const optimisticMessage = {
      id: Date.now().toString(),
      type: inputMode,
      content: message,
      author: inputMode === 'MESSAGE' ? 'Agent' : 'System',
      createdAt: new Date().toISOString()
    };
    setActivities(prev => [...prev, optimisticMessage]);
    
    const currentMessage = message;
    setMessage('');

    try {
      if (inputMode === 'MESSAGE') {
        const result = await sendMessage(deal.id, currentMessage);
        if (!result.success) {
          // Mensagem não saiu (ex.: janela de 24h expirada) — remove o item
          // otimista pra não fingir que foi entregue, e avisa o agente.
          setActivities(prev => prev.filter(a => a.id !== optimisticMessage.id));
          alert(result.error || 'Falha ao enviar mensagem');
          setMessage(currentMessage);
          return;
        }
      } else {
        await addInternalNote(deal.id, currentMessage, inputMode);
      }
      const data = await getDealActivities(deal.id);
      setActivities(data);
      setInputMode('MESSAGE'); // reset after sending
    } catch (e) {
      console.error(e);
      alert('Falha ao enviar ação');
    } finally {
      setIsSending(false);
    }
  }

  async function sendMediaAndRefresh(mediaType: UploadableMediaType, url: string) {
    const result = await sendMediaMessage(deal.id, mediaType, url);
    if (!result.success) {
      setMediaError(result.error || 'Falha ao enviar arquivo.');
      return;
    }
    const data = await getDealActivities(deal.id);
    setActivities(data);
  }

  async function handleFileSelected(file: File) {
    setMediaError(null);
    const mediaType: UploadableMediaType | null = file.type.startsWith('image/')
      ? 'IMAGE'
      : file.type.startsWith('video/')
        ? 'VIDEO'
        : file.type.startsWith('audio/')
          ? 'AUDIO'
          : null;
    if (!mediaType) {
      setMediaError('Tipo de arquivo não suportado — envie foto, áudio ou vídeo.');
      return;
    }
    setIsUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { url } = await uploadScriptStepMedia(mediaType, formData);
      await sendMediaAndRefresh(mediaType, url);
    } catch (e) {
      setMediaError(e instanceof Error ? e.message : 'Falha ao enviar arquivo.');
    } finally {
      setIsUploadingMedia(false);
    }
  }

  function clearRecording() {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    recordedChunksRef.current = [];
    recordedBlobRef.current = null;
    setRecordedUrl(null);
    setRecordSeconds(0);
  }

  async function startRecording() {
    setMediaError(null);
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
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecordSeconds(0);
      setIsRecording(true);
      recordTimerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
    } catch {
      setMediaError('Não foi possível acessar o microfone. Verifique a permissão do navegador.');
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setIsRecording(false);
  }

  async function confirmRecording() {
    const blob = recordedBlobRef.current;
    if (!blob) return;
    setIsUploadingMedia(true);
    setMediaError(null);
    try {
      const mp3Blob = await convertRecordingToMp3(blob);
      const file = new File([mp3Blob], `gravacao-${Date.now()}.mp3`, { type: 'audio/mpeg' });
      const formData = new FormData();
      formData.append('file', file);
      const { url } = await uploadScriptStepMedia('AUDIO', formData);
      await sendMediaAndRefresh('AUDIO', url);
      clearRecording();
    } catch (e) {
      setMediaError(e instanceof Error ? e.message : 'Falha ao enviar gravação.');
    } finally {
      setIsUploadingMedia(false);
    }
  }

  return (
    <div className="w-full md:w-1/3 md:min-w-[400px] h-full bg-[#111111] border-l border-[#262626] flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
      <div className="p-4 border-b border-[#262626] flex justify-between items-center bg-[#141414]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg border border-blue-500/30">
            {deal.contact?.name?.charAt(0) || 'L'}
          </div>
          <div>
            <h2 className="font-bold text-zinc-100">{deal.contact?.name || 'Lead sem nome'}</h2>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Phone className="size-3" />
              {deal.contact?.phone || 'Sem telefone'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* AI Toggle Button */}
          <button 
            onClick={() => setAiEnabled(!aiEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all border ${
              aiEnabled 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            <Bot className={`size-3.5 ${aiEnabled ? 'animate-pulse' : ''}`} />
            {aiEnabled ? 'IA Ativa' : 'IA Desligada'}
          </button>
          
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-100 transition-colors bg-[#222222] rounded-lg">
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-[#262626] bg-[#0a0a0a] flex justify-between items-center">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block mb-1">Negócio</span>
          <span className="text-sm font-semibold text-zinc-200">{deal.title}</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block mb-1">Valor</span>
          <span className="text-sm font-bold text-emerald-400">R$ {deal.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-[#262626] bg-[#0a0a0a]">
        <div className="flex items-center gap-2 flex-wrap">
          <TagIcon className="size-3.5 text-zinc-500 shrink-0" />
          {tags.map(tag => (
            <span key={tag.id} className="flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium px-2 py-1 rounded-full">
              {tag.name}
              <button onClick={() => handleRemoveTag(tag.id)} className="text-indigo-400/70 hover:text-red-400">
                <X className="size-3" />
              </button>
            </span>
          ))}
          <input
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
            placeholder="+ tag"
            disabled={isAddingTag}
            className="bg-transparent text-[11px] text-zinc-300 placeholder:text-zinc-600 focus:outline-none w-16 focus:w-24 transition-all"
          />
          {newTagInput.trim() && (
            <button onClick={handleAddTag} disabled={isAddingTag} className="text-indigo-400 hover:text-indigo-300 disabled:opacity-50">
              <Plus className="size-3.5" />
            </button>
          )}
        </div>
        {tagError && <p className="text-[10px] text-red-400 mt-1">{tagError}</p>}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 relative" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat opacity-[0.03] pointer-events-none" />
        <div className="relative flex flex-col gap-4">
        {activities.map((act) => {
          if (act.type === 'STATUS_CHANGE') {
            return (
              <div key={act.id} className="flex justify-center">
                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 max-w-[80%] text-center">
                  {act.content}
                </div>
              </div>
            );
          }

          if (act.type === 'NOTE') {
            return (
              <div key={act.id} className="flex justify-center my-2">
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm px-4 py-3 rounded-xl max-w-[90%] shadow-sm w-full">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-amber-500/70">Anotação Interna</span>
                    <span className="text-[10px] text-amber-500/50">{format(new Date(act.createdAt), 'HH:mm')}</span>
                  </div>
                  <p>{act.content}</p>
                </div>
              </div>
            );
          }

          if (act.type === 'TASK') {
            return (
              <div key={act.id} className="flex justify-center my-2">
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm px-4 py-3 rounded-xl max-w-[90%] shadow-sm w-full flex items-start gap-3">
                  <div className="w-5 h-5 rounded border border-rose-500/50 flex-shrink-0 mt-0.5"></div>
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-rose-500/70">Tarefa</span>
                      <span className="text-[10px] text-rose-500/50">{format(new Date(act.createdAt), 'HH:mm')}</span>
                    </div>
                    <p className="font-semibold">{act.content}</p>
                  </div>
                </div>
              </div>
            );
          }

          const isMe = act.author === 'Agent' || act.author === 'System';
          const mediaMatch = typeof act.content === 'string' ? act.content.match(/^\[MEDIA:(AUDIO|IMAGE|VIDEO)\]([\s\S]+)$/) : null;

          return (
            <div key={act.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`${isMe ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-100 rounded-tr-none' : 'bg-[#222222] border-[#333333] text-zinc-200 rounded-tl-none'} border p-3 rounded-2xl max-w-[85%] shadow-sm relative`}>
                {mediaMatch ? (
                  mediaMatch[1] === 'IMAGE' ? (
                    <img src={mediaMatch[2]} alt="" className="max-w-full max-h-64 rounded-lg" />
                  ) : mediaMatch[1] === 'VIDEO' ? (
                    <video src={mediaMatch[2]} controls className="max-w-full max-h-64 rounded-lg" />
                  ) : (
                    <audio src={mediaMatch[2]} controls className="max-w-full h-10" />
                  )
                ) : (
                  <p className="text-sm leading-relaxed">{act.content}</p>
                )}
                <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-end'}`}>
                  <span className={`text-[9px] ${isMe ? 'text-indigo-300/70' : 'text-zinc-500'}`}>
                    {format(new Date(act.createdAt), 'HH:mm')}
                  </span>
                  {isMe && <Check className="size-3 text-indigo-400" />}
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>

      <div className={`p-4 border-t ${inputMode === 'NOTE' ? 'bg-amber-950/20 border-amber-900/30' : inputMode === 'TASK' ? 'bg-rose-950/20 border-rose-900/30' : 'bg-[#141414] border-[#262626]'}`}>
        {mediaError && (
          <div className="mb-2 bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-[11px] text-red-400">{mediaError}</div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelected(file);
            e.target.value = '';
          }}
        />

        {inputMode === 'MESSAGE' && isRecording ? (
          <div className="flex items-center gap-3 bg-[#222222] border border-[#333333] rounded-xl px-4 py-3">
            <span className="flex items-center gap-2 text-red-400 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Gravando {Math.floor(recordSeconds / 60)}:{String(recordSeconds % 60).padStart(2, '0')}
            </span>
            <button onClick={stopRecording} className="ml-auto text-xs text-zinc-300 hover:text-white font-medium">
              Parar
            </button>
          </div>
        ) : inputMode === 'MESSAGE' && recordedUrl ? (
          <div className="flex items-center gap-2 bg-[#222222] border border-[#333333] rounded-xl px-3 py-2">
            <audio controls src={recordedUrl} className="h-9 flex-1" />
            <button onClick={confirmRecording} disabled={isUploadingMedia} className="text-emerald-400 hover:text-emerald-300 disabled:opacity-40 text-xs font-medium shrink-0">
              {isUploadingMedia ? 'Enviando...' : 'Enviar'}
            </button>
            <button onClick={clearRecording} disabled={isUploadingMedia} className="text-zinc-500 hover:text-red-400 disabled:opacity-40 text-xs font-medium shrink-0">
              Descartar
            </button>
          </div>
        ) : (
        <div className="relative flex items-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingMedia}
            className={`absolute left-2 p-2 transition-colors disabled:opacity-40 ${
              inputMode === 'MESSAGE' ? 'text-zinc-500 hover:text-zinc-300' : 'hidden'
            }`}
          >
            <Paperclip className="size-4" />
          </button>

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={inputMode === 'NOTE' ? 'Digite uma anotação interna...' : inputMode === 'TASK' ? 'O que precisa ser feito?' : 'Digite uma mensagem (WhatsApp)...'}
            className={`w-full border rounded-xl ${inputMode === 'MESSAGE' ? 'pl-10 pr-24' : 'pl-4 pr-12'} py-3 text-sm focus:outline-none transition-colors ${
              inputMode === 'NOTE' ? 'bg-amber-500/5 border-amber-500/20 text-amber-100 placeholder:text-amber-700/50 focus:border-amber-500/50' :
              inputMode === 'TASK' ? 'bg-rose-500/5 border-rose-500/20 text-rose-100 placeholder:text-rose-700/50 focus:border-rose-500/50' :
              'bg-[#222222] border-[#333333] text-zinc-200 placeholder:text-zinc-500 focus:border-blue-500/50'
            }`}
          />

          <div className="absolute right-2 flex items-center gap-1">
            <button
              onClick={startRecording}
              disabled={isUploadingMedia}
              className={`p-2 transition-colors disabled:opacity-40 ${
                inputMode === 'MESSAGE' ? 'text-zinc-500 hover:text-zinc-300' : 'hidden'
              }`}
            >
              <Mic className="size-4" />
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || !message.trim()}
              className={`p-2 disabled:opacity-50 text-white rounded-lg transition-colors ${
                inputMode === 'NOTE' ? 'bg-amber-600 hover:bg-amber-500' :
                inputMode === 'TASK' ? 'bg-rose-600 hover:bg-rose-500' :
                'bg-blue-600 hover:bg-blue-500'
              }`}
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
        )}
        <div className="flex gap-4 mt-2 px-2">
          <button 
            onClick={() => setInputMode('MESSAGE')}
            className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${inputMode === 'MESSAGE' ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Mensagem
          </button>
          <button 
            onClick={() => setInputMode('NOTE')}
            className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${inputMode === 'NOTE' ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Anotação
          </button>
          <button 
            onClick={() => setInputMode('TASK')}
            className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${inputMode === 'TASK' ? 'text-rose-400' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Tarefa
          </button>
        </div>
      </div>
    </div>
  );
}
