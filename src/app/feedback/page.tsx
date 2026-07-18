'use client';

import React, { useEffect, useState } from 'react';
import { MessageSquarePlus, Bug, Lightbulb, Loader2, Send } from 'lucide-react';
import { getFeedbacks, createFeedback } from '@/actions/feedback';
import { withRetry } from '@/lib/withRetry';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type FeedbackType = 'SUGGESTION' | 'BUG' | 'OTHER';

interface FeedbackItem {
  id: string;
  type: string;
  message: string;
  createdAt: Date;
  user: { name: string } | null;
}

const TYPE_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  SUGGESTION: { label: 'Sugestão', icon: Lightbulb },
  BUG: { label: 'Bug', icon: Bug },
  OTHER: { label: 'Outro', icon: MessageSquarePlus },
};

export default function FeedbackPage() {
  const [type, setType] = useState<FeedbackType>('SUGGESTION');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    withRetry(() => getFeedbacks())
      .then(data => setFeedbacks(data as unknown as FeedbackItem[]))
      .catch(err => {
        console.error(err);
        setLoadError('Não foi possível carregar os feedbacks. Tente recarregar a página.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || isSending) return;
    setIsSending(true);
    try {
      await createFeedback(type, message);
      setMessage('');
      const data = await getFeedbacks();
      setFeedbacks(data as unknown as FeedbackItem[]);
    } catch (err) {
      console.error(err);
      alert('Falha ao enviar feedback.');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="h-full bg-[#0a0a0a] text-white overflow-y-auto">
      <div className="max-w-2xl mx-auto p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feedback</h1>
          <p className="text-zinc-500 text-sm mt-1">Mande sugestões ou reporte problemas do Nexus CRM.</p>
        </div>

        {loadError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
            {loadError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-4">
          <div className="flex gap-2">
            {(Object.keys(TYPE_LABELS) as FeedbackType[]).map(t => {
              const { label, icon: Icon } = TYPE_LABELS[t];
              return (
                <button
                  type="button"
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                    type === t
                      ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                      : 'bg-[#1a1a1a] border-[#333] text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              );
            })}
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Descreva sua sugestão ou o problema que encontrou..."
            className="w-full h-28 bg-[#111] border border-[#333] rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50 resize-none"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSending || !message.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
            >
              {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Enviar
            </button>
          </div>
        </form>

        <div className="space-y-3">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Enviados recentemente</h2>
          {isLoading ? (
            <Loader2 className="size-5 animate-spin text-zinc-600" />
          ) : feedbacks.length === 0 ? (
            <p className="text-sm text-zinc-600">Nenhum feedback enviado ainda.</p>
          ) : (
            feedbacks.map(fb => {
              const { label, icon: Icon } = TYPE_LABELS[fb.type] || TYPE_LABELS.OTHER;
              return (
                <div key={fb.id} className="bg-[#141414] border border-[#262626] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-400">
                      <Icon className="size-3.5" /> {label}
                    </span>
                    <span className="text-[11px] text-zinc-600">
                      {fb.user?.name || 'Você'} · {formatDistanceToNow(new Date(fb.createdAt), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{fb.message}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
