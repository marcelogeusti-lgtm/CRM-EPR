'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bot, MessageCircle, TrendingUp, Users, ArrowRight, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { getDashboardStats } from '@/actions/dashboard';

interface DashboardStats {
  userName: string;
  totalLeads: number;
  totalValue: number;
  winRate: number;
  pipelineData: { name: string; count: number }[];
  contactsCount: number;
  usersCount: number;
  hasChannelConnected: boolean;
  aiAgentConfigured: boolean;
  aiAgentActive: boolean;
}

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

function StatCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string | number; accent: string }) {
  return (
    <div className="bg-[#141414] border border-[#262626] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent}`}>
          <Icon className="size-4" />
        </div>
      </div>
      <div className="text-2xl font-light text-white">{value}</div>
    </div>
  );
}

function ChecklistItem({ done, title, description, href, ctaLabel, disabled }: { done: boolean; title: string; description: string; href?: string; ctaLabel: string; disabled?: boolean }) {
  return (
    <div className="p-4 rounded-xl border border-[#262626] flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
      <div className="flex gap-3 items-start">
        {done ? <CheckCircle2 className="size-5 text-emerald-400 shrink-0 mt-0.5" /> : <Circle className="size-5 text-zinc-600 shrink-0 mt-0.5" />}
        <div>
          <h4 className="font-bold text-zinc-200 mb-1">{title}</h4>
          <p className="text-sm text-zinc-500">{description}</p>
        </div>
      </div>
      {done ? (
        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider shrink-0">Concluído</span>
      ) : disabled ? (
        <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider shrink-0">Em breve</span>
      ) : (
        <Link href={href || '#'} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0 text-center">
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboardStats()
      .then(data => setStats(data as DashboardStats))
      .catch(err => {
        console.error(err);
        setError('Não foi possível carregar o painel. Tente recarregar a página.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0a0a0a] text-zinc-500">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0a0a0a] text-zinc-500">
        {error || 'Não foi possível carregar o painel.'}
      </div>
    );
  }

  const completedMissions = [stats.hasChannelConnected, stats.aiAgentConfigured].filter(Boolean).length;

  return (
    <div className="h-full bg-[#0a0a0a] text-white overflow-y-auto">
      <div className="max-w-5xl mx-auto p-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Olá, {stats.userName.split(' ')[0]}</h1>
            <p className="text-zinc-500 text-sm mt-1">Aqui está o resumo do seu workspace.</p>
          </div>
          <span className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border ${
            stats.aiAgentActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${stats.aiAgentActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`} />
            {stats.aiAgentActive ? 'Agente de IA Ativo' : 'Agente de IA Inativo'}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={TrendingUp} label="Negócios" value={stats.totalLeads} accent="bg-blue-500/10 text-blue-400" />
          <StatCard icon={TrendingUp} label="Em negociação" value={formatCurrency(stats.totalValue)} accent="bg-emerald-500/10 text-emerald-400" />
          <StatCard icon={TrendingUp} label="Taxa de conversão" value={`${stats.winRate}%`} accent="bg-purple-500/10 text-purple-400" />
          <StatCard icon={Users} label="Contatos" value={stats.contactsCount} accent="bg-amber-500/10 text-amber-400" />
        </div>

        {/* Onboarding Checklist */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white">Primeiros Passos</h2>
            <span className="text-xs font-medium text-zinc-500">{completedMissions} de 2 concluídos</span>
          </div>
          <div className="space-y-3">
            <ChecklistItem
              done={stats.hasChannelConnected}
              title="Conectar um canal de chat"
              description="Integre WhatsApp ou Instagram para unificar as mensagens no inbox."
              href="/integrations"
              ctaLabel="Conectar Canal"
            />
            <ChecklistItem
              done={stats.aiAgentConfigured}
              title="Configurar o Agente de IA"
              description="Defina a persona, tom de voz e roteiro de atendimento do seu agente."
              href="/salesbot"
              ctaLabel="Configurar Agente"
            />
            <ChecklistItem
              done={stats.usersCount > 1}
              title="Convidar sua equipe"
              description="Traga outros atendentes para colaborar no fechamento de negócios."
              ctaLabel="Adicionar Membros"
              disabled
            />
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/inbox" className="group bg-[#141414] border border-[#262626] hover:border-blue-500/30 rounded-xl p-5 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <MessageCircle className="size-5 text-blue-400" />
              </div>
              <span className="font-semibold text-zinc-200">Ir para o Inbox</span>
            </div>
            <ArrowRight className="size-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          </Link>
          <Link href="/salesbot" className="group bg-[#141414] border border-[#262626] hover:border-indigo-500/30 rounded-xl p-5 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Bot className="size-5 text-indigo-400" />
              </div>
              <span className="font-semibold text-zinc-200">Configurar Agente de IA</span>
            </div>
            <ArrowRight className="size-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          </Link>
        </div>

      </div>
    </div>
  );
}
