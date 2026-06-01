'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Check, MoreVertical, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getDealActivities, sendMessage, addInternalNote } from '@/actions/inbox';

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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchActivities() {
      if (deal?.id) {
        const data = await getDealActivities(deal.id);
        setActivities(data);
      }
    }
    fetchActivities();
  }, [deal?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activities]);

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
        await sendMessage(deal.id, currentMessage);
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

  return (
    <div className="w-1/3 min-w-[400px] h-full bg-[#111111] border-l border-[#262626] flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
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
        <div className="flex items-center gap-2">
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

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat opacity-[0.03]" style={{ backgroundColor: '#0a0a0a' }}>
        
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
          
          return (
            <div key={act.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`${isMe ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-100 rounded-tr-none' : 'bg-[#222222] border-[#333333] text-zinc-200 rounded-tl-none'} border p-3 rounded-2xl max-w-[85%] shadow-sm relative`}>
                <p className="text-sm leading-relaxed">{act.content}</p>
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

      <div className={`p-4 border-t ${inputMode === 'NOTE' ? 'bg-amber-950/20 border-amber-900/30' : inputMode === 'TASK' ? 'bg-rose-950/20 border-rose-900/30' : 'bg-[#141414] border-[#262626]'}`}>
        <div className="relative flex items-center">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={inputMode === 'NOTE' ? 'Digite uma anotação interna...' : inputMode === 'TASK' ? 'O que precisa ser feito?' : 'Digite uma mensagem (WhatsApp)...'}
            className={`w-full border rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none transition-colors ${
              inputMode === 'NOTE' ? 'bg-amber-500/5 border-amber-500/20 text-amber-100 placeholder:text-amber-700/50 focus:border-amber-500/50' : 
              inputMode === 'TASK' ? 'bg-rose-500/5 border-rose-500/20 text-rose-100 placeholder:text-rose-700/50 focus:border-rose-500/50' : 
              'bg-[#222222] border-[#333333] text-zinc-200 placeholder:text-zinc-500 focus:border-blue-500/50'
            }`}
          />
          <button 
            onClick={handleSend}
            disabled={isSending || !message.trim()}
            className={`absolute right-2 p-2 disabled:opacity-50 text-white rounded-lg transition-colors ${
              inputMode === 'NOTE' ? 'bg-amber-600 hover:bg-amber-500' :
              inputMode === 'TASK' ? 'bg-rose-600 hover:bg-rose-500' :
              'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            <Send className="size-4" />
          </button>
        </div>
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
