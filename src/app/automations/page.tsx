'use client';

import React, { useEffect, useState } from 'react';
import { Bot, Zap, Loader2, Info, MessageCircle, Workflow, Megaphone, CheckCircle2, ArrowRight, Plus, Play, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { getStageAutomations, setStageAutomation } from '@/actions/automations';
import { getIntegrations } from '@/actions/integrations';
import { getFlows, createFlow } from '@/actions/automationFlows';
import { CHANNEL_INTEGRATIONS } from '@/lib/integrationCatalog';
import { withRetry } from '@/lib/withRetry';

type Tab = 'canais' | 'fluxos' | 'campanhas';

interface StageWithAutomation {
  id: string;
  name: string;
  color: string | null;
  automation: { activateAgent: boolean; fireN8nWebhook: boolean } | null;
}

interface FlowSummary {
  id: string;
  name: string;
  triggerType: string;
  isActive: boolean;
}

const TABS = [
  { id: 'canais', name: 'Canais', icon: MessageCircle },
  { id: 'fluxos', name: 'Fluxos', icon: Workflow },
  { id: 'campanhas', name: 'Campanhas', icon: Megaphone },
] as const;

export default function AutomationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('canais');

  // Aba Canais
  const [installedApps, setInstalledApps] = useState<{ provider: string }[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [channelsError, setChannelsError] = useState('');

  // Aba Fluxos — motor de fluxo visual (novo) + regras por etapa (legado, mesma lógica de antes)
  const [flows, setFlows] = useState<FlowSummary[]>([]);
  const [isLoadingFlowList, setIsLoadingFlowList] = useState(true);
  const [flowListError, setFlowListError] = useState('');
  const [isCreatingFlow, setIsCreatingFlow] = useState(false);

  const [stages, setStages] = useState<StageWithAutomation[]>([]);
  const [hasN8nWebhook, setHasN8nWebhook] = useState(false);
  const [isLoadingFlows, setIsLoadingFlows] = useState(true);
  const [flowsError, setFlowsError] = useState('');
  const [savingStageId, setSavingStageId] = useState<string | null>(null);

  useEffect(() => {
    withRetry(() => getIntegrations())
      .then(setInstalledApps)
      .catch(err => {
        console.error(err);
        setChannelsError('Não foi possível carregar os canais. Tente recarregar a página.');
      })
      .finally(() => setIsLoadingChannels(false));

    withRetry(() => getFlows())
      .then(data => setFlows(data as FlowSummary[]))
      .catch(err => {
        console.error(err);
        setFlowListError('Não foi possível carregar os fluxos. Tente recarregar a página.');
      })
      .finally(() => setIsLoadingFlowList(false));

    withRetry(() => getStageAutomations())
      .then(({ stages, hasN8nWebhook }) => {
        setStages(stages as StageWithAutomation[]);
        setHasN8nWebhook(hasN8nWebhook);
      })
      .catch(err => {
        console.error(err);
        setFlowsError('Não foi possível carregar as automações. Tente recarregar a página.');
      })
      .finally(() => setIsLoadingFlows(false));
  }, []);

  async function handleCreateFlow() {
    // createFlow() termina com redirect() — não pode ficar dentro de
    // try/catch (o redirect lança um erro especial NEXT_REDIRECT que
    // precisa se propagar, não ser engolido). Ver node_modules/next/dist/docs/
    // .../redirect.md, "should be called outside the try block".
    setIsCreatingFlow(true);
    await createFlow();
  }

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

  return (
    <div className="h-full bg-[#0a0a0a] overflow-auto">
      <div className="p-8 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Zap className="size-6 text-indigo-400" />
            Automações
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Canais de conversa, regras automáticas e campanhas — tudo num lugar só.</p>
        </div>

        <div className="flex gap-6 border-b border-[#222] mb-8 overflow-x-auto custom-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium relative flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <tab.icon className="size-4" />
              {tab.name}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-500 rounded-t-full" />}
            </button>
          ))}
        </div>

        {activeTab === 'canais' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {channelsError && (
              <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
                {channelsError}
              </div>
            )}
            {isLoadingChannels ? (
              <div className="flex items-center justify-center py-24 text-zinc-500">
                <Loader2 className="size-6 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {CHANNEL_INTEGRATIONS.map(channel => {
                  const isConnected = installedApps.some(i => i.provider === channel.id);
                  return (
                    <Link
                      key={channel.id}
                      href="/integrations"
                      prefetch={false}
                      className="bg-[#141414] border border-[#262626] rounded-2xl p-5 hover:border-indigo-500/30 hover:bg-[#1a1a1a] transition-all flex items-center gap-4"
                    >
                      <div className={`w-12 h-12 shrink-0 border border-white/10 rounded-xl flex items-center justify-center p-2.5 ${channel.iconColor === 'text-black' || channel.id === 'instagram' ? 'bg-zinc-800' : 'bg-white/5'}`}>
                        <img
                          src={channel.icon}
                          alt={channel.name}
                          className="w-full h-full object-contain"
                          style={{ filter: channel.id === 'instagram' ? '' : 'brightness(0) invert(1)' }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-zinc-200 truncate">{channel.name}</h3>
                        <p className="text-xs text-zinc-500 truncate">{channel.desc}</p>
                      </div>
                      {isConnected ? (
                        <span className="shrink-0 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 border border-emerald-500/20">
                          <CheckCircle2 className="size-3" />
                          CONECTADO
                        </span>
                      ) : (
                        <span className="shrink-0 text-zinc-500 text-xs font-bold flex items-center gap-1">
                          Conectar <ArrowRight className="size-3" />
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'fluxos' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Fluxos</h2>
              <button
                onClick={handleCreateFlow}
                disabled={isCreatingFlow}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
              >
                {isCreatingFlow ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                Novo Fluxo
              </button>
            </div>

            {flowListError && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400 max-w-2xl">
                {flowListError}
              </div>
            )}

            {isLoadingFlowList ? (
              <div className="flex items-center justify-center py-12 text-zinc-500">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : flows.length === 0 ? (
              <div className="mb-8 border border-dashed border-[#333] rounded-xl p-6 text-sm text-zinc-500 max-w-2xl">
                Nenhum fluxo criado ainda. Um fluxo dispara automaticamente por palavra-chave ou na
                primeira mensagem de um contato, e pode enviar texto, mídia, checar condições,
                marcar tags e passar a conversa pra IA.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                {flows.map((flow) => (
                  <Link
                    key={flow.id}
                    href={`/automations/flows/${flow.id}`}
                    prefetch={false}
                    className="bg-[#141414] border border-[#262626] rounded-2xl p-5 hover:border-indigo-500/30 hover:bg-[#1a1a1a] transition-all flex items-center gap-4"
                  >
                    <div className="w-12 h-12 shrink-0 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      {flow.triggerType === 'WELCOME' ? <MessageSquare className="size-5 text-indigo-400" /> : <Play className="size-5 text-indigo-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-zinc-200 truncate">{flow.name}</h3>
                      <p className="text-xs text-zinc-500">{flow.triggerType === 'WELCOME' ? 'Primeira mensagem' : 'Palavra-chave'}</p>
                    </div>
                    {flow.isActive ? (
                      <span className="shrink-0 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-md border border-emerald-500/20">ATIVO</span>
                    ) : (
                      <span className="shrink-0 text-zinc-600 text-[10px] font-bold px-2 py-1">INATIVO</span>
                    )}
                  </Link>
                ))}
              </div>
            )}

            <div className="mb-6 flex items-start gap-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 text-sm text-zinc-400 max-w-2xl">
              <Info className="size-4 text-indigo-400 shrink-0 mt-0.5" />
              Abaixo continuam as regras rápidas por etapa do funil (mais simples, sem canvas).
            </div>

            {flowsError && (
              <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400 max-w-2xl">
                {flowsError}
              </div>
            )}

            {isLoadingFlows ? (
              <div className="flex items-center justify-center py-24 text-zinc-500">
                <Loader2 className="size-6 animate-spin" />
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}

        {activeTab === 'campanhas' && (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-24 animate-in fade-in">
            <Megaphone className="size-12 mb-4 opacity-20" />
            <h3 className="text-lg font-bold text-zinc-400">Em Desenvolvimento</h3>
            <p className="text-sm mt-2 max-w-sm text-center">
              Disparo e remarketing por canal e segmento de contatos — usando o mesmo motor de
              fluxo da aba Fluxos assim que ele estiver pronto.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
