'use client';

import React, { useEffect, useState } from 'react';
import { Bot, Zap, Loader2, Info } from 'lucide-react';
import { getStageAutomations, setStageAutomation } from '@/actions/automations';
import { withRetry } from '@/lib/withRetry';
import Link from 'next/link';

interface StageWithAutomation {
  id: string;
  name: string;
  color: string | null;
  automation: { activateAgent: boolean; fireN8nWebhook: boolean } | null;
}

export default function AutomationsPage() {
  const [stages, setStages] = useState<StageWithAutomation[]>([]);
  const [hasN8nWebhook, setHasN8nWebhook] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingStageId, setSavingStageId] = useState<string | null>(null);

  useEffect(() => {
    withRetry(() => getStageAutomations())
      .then(({ stages, hasN8nWebhook }) => {
        setStages(stages as StageWithAutomation[]);
        setHasN8nWebhook(hasN8nWebhook);
      })
      .catch(err => {
        console.error(err);
        setError('Não foi possível carregar as automações. Tente recarregar a página.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function toggle(stageId: string, field: 'activateAgent' | 'fireN8nWebhook', current: boolean) {
    setSavingStageId(stageId);
    const next = !current;

    setStages(prev => prev.map(s =>
      s.id === stageId
        ? { ...s, automation: { activateAgent: s.automation?.activateAgent ?? false, fireN8nWebhook: s.automation?.fireN8nWebhook ?? false, [field]: next } }
        : s
    ));

    try {
      await setStageAutomation(stageId, { [field]: next });
    } catch (e) {
      console.error(e);
      alert('Falha ao salvar a automação desta etapa.');
      setStages(prev => prev.map(s =>
        s.id === stageId
          ? { ...s, automation: { activateAgent: s.automation?.activateAgent ?? false, fireN8nWebhook: s.automation?.fireN8nWebhook ?? false, [field]: current } }
          : s
      ));
    } finally {
      setSavingStageId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0a0a0a] text-zinc-500">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0a0a0a] text-zinc-500">
        {error}
      </div>
    );
  }

  return (
    <div className="p-8 h-full bg-[#0a0a0a] overflow-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Bot className="size-6 text-indigo-400" />
          Automações por Etapa
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Quando um negócio entra em uma etapa, dispare ações automáticas.
        </p>
      </div>

      {!hasN8nWebhook && (
        <div className="mb-6 flex items-center gap-3 bg-[#141414] border border-[#262626] rounded-xl p-4 text-sm text-zinc-400 max-w-2xl">
          <Info className="size-4 text-amber-400 shrink-0" />
          Nenhum webhook do n8n configurado ainda. Configure em{' '}
          <Link href="/integrations" prefetch={false} className="text-indigo-400 hover:text-indigo-300 font-medium">Integrações</Link>
          {' '}para poder ativar o disparo de webhook por etapa.
        </div>
      )}

      <div className="flex gap-6 min-w-max">
        {stages.map((stage) => {
          const activateAgent = stage.automation?.activateAgent ?? false;
          const fireN8nWebhook = stage.automation?.fireN8nWebhook ?? false;
          const isSaving = savingStageId === stage.id;

          return (
            <div key={stage.id} className="w-[300px] flex flex-col gap-4">
              <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${stage.color || 'bg-zinc-500'}`} />
                  <h3 className="font-bold text-zinc-200">{stage.name}</h3>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="bg-[#1a1a1a] border border-[#333333] rounded-xl p-3 shadow-sm flex items-start gap-3 cursor-pointer hover:border-indigo-500/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={activateAgent}
                    disabled={isSaving}
                    onChange={() => toggle(stage.id, 'activateAgent', activateAgent)}
                    className="mt-1 accent-indigo-500"
                  />
                  <div className="w-8 h-8 rounded-lg bg-[#222222] flex items-center justify-center shrink-0">
                    <Bot className="size-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-300">Ativar Agente de IA</p>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1 block">Ao entrar na etapa</span>
                  </div>
                </label>

                <label className={`bg-[#1a1a1a] border border-[#333333] rounded-xl p-3 shadow-sm flex items-start gap-3 transition-colors ${hasN8nWebhook ? 'cursor-pointer hover:border-amber-500/40' : 'opacity-50 cursor-not-allowed'}`}>
                  <input
                    type="checkbox"
                    checked={fireN8nWebhook}
                    disabled={isSaving || !hasN8nWebhook}
                    onChange={() => toggle(stage.id, 'fireN8nWebhook', fireN8nWebhook)}
                    className="mt-1 accent-amber-500"
                  />
                  <div className="w-8 h-8 rounded-lg bg-[#222222] flex items-center justify-center shrink-0">
                    <Zap className="size-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-300">Disparar webhook n8n</p>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1 block">Ao entrar na etapa</span>
                  </div>
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
