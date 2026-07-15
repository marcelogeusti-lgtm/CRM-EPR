'use client';

import React, { useEffect, useState } from 'react';
import { MessageCircle, Bot, CheckCircle2, UserPlus, Loader2, Radio } from 'lucide-react';
import { getInsightsStats } from '@/actions/insights';

interface InsightsStats {
  periodDays: number;
  totalMessages: number;
  receivedMessages: number;
  sentByAgentMessages: number;
  sentByAiMessages: number;
  channelBreakdown: { name: string; count: number }[];
  channelCount: number;
  aiAgentActive: boolean;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  newLeads: number;
}

function StatCard({ icon: Icon, label, value, sublabel, accent }: { icon: React.ElementType; label: string; value: string | number; sublabel?: string; accent: string }) {
  return (
    <div className="bg-[#141414] border border-[#262626] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent}`}>
          <Icon className="size-4" />
        </div>
      </div>
      <div className="text-3xl font-light text-white">{value}</div>
      {sublabel && <p className="text-xs text-zinc-500 mt-1">{sublabel}</p>}
    </div>
  );
}

export default function InsightsPage() {
  const [stats, setStats] = useState<InsightsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getInsightsStats().then(data => {
      setStats(data as InsightsStats);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0a0a0a] text-zinc-500">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0a0a0a] text-zinc-500">
        Não foi possível carregar o painel.
      </div>
    );
  }

  const taskCompletionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  return (
    <div className="h-full bg-[#0a0a0a] text-white overflow-y-auto">
      <div className="max-w-5xl mx-auto p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Painel</h1>
          <p className="text-zinc-500 text-sm mt-1">Atendimento e IA nos últimos {stats.periodDays} dias.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={MessageCircle}
            label="Mensagens recebidas"
            value={stats.receivedMessages}
            sublabel={`${stats.totalMessages} no total`}
            accent="bg-emerald-500/10 text-emerald-400"
          />
          <StatCard
            icon={Bot}
            label="Respondidas pela IA"
            value={stats.sentByAiMessages}
            sublabel={stats.aiAgentActive ? 'Agente ativo' : 'Agente inativo'}
            accent="bg-indigo-500/10 text-indigo-400"
          />
          <StatCard
            icon={UserPlus}
            label="Novos leads"
            value={stats.newLeads}
            accent="bg-blue-500/10 text-blue-400"
          />
          <StatCard
            icon={CheckCircle2}
            label="Tarefas concluídas"
            value={`${taskCompletionRate}%`}
            sublabel={`${stats.completedTasks} de ${stats.totalTasks}`}
            accent="bg-amber-500/10 text-amber-400"
          />
        </div>

        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-300 uppercase tracking-wider mb-4">
            <Radio className="size-4 text-zinc-500" />
            Mensagens por canal
          </h2>
          {stats.channelBreakdown.length === 0 ? (
            <p className="text-sm text-zinc-600">Nenhuma mensagem registrada ainda neste período.</p>
          ) : (
            <div className="space-y-3">
              {stats.channelBreakdown.map(channel => {
                const pct = stats.totalMessages > 0 ? Math.round((channel.count / stats.totalMessages) * 100) : 0;
                return (
                  <div key={channel.name} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-300">{channel.name}</span>
                      <span className="text-zinc-500">{channel.count}</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#222] rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
