'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search,
  CalendarDays,
  Target,
  FileText,
  AlertTriangle,
  Briefcase,
  Layers,
  Sparkles,
  DollarSign,
  Activity,
  UserCheck,
  Compass,
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/system/PageHeader';
import { StatsCard } from '@/components/system/StatsCard';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { user } = useAuth();

  const today = new Date().toLocaleDateString('pt-BR', { month: 'long', day: 'numeric', year: 'numeric' });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Massa de dados simplificada unificada (Foco exclusivo em CRM)
  const currentData = {
    health: {
      faturamento: 78500,
      faturamentoTrend: '+8%',
      lucro: 24300,
      orcamentosAberto: 35,
      conversao: 28,
      tempoFechamento: 6.8,
      leadsParados: 29
    },
    funnel: [
      { stage: 'Leads Captados', value: 120, color: 'bg-blue-500' },
      { stage: 'Qualificados', value: 65, color: 'bg-indigo-500' },
      { stage: 'Reunião/Demo', value: 34, color: 'bg-purple-500' },
      { stage: 'Proposta Enviada', value: 18, color: 'bg-amber-500' },
      { stage: 'Negociação', value: 10, color: 'bg-emerald-500' },
      { stage: 'Fechado (Ganho)', value: 15, color: 'bg-zinc-500' }
    ],
    sales: [
      { name: 'Rodrigo SDR', conversion: 32, revenue: 38000 },
      { name: 'Beatriz Account', conversion: 24, revenue: 26000 },
      { name: 'Felipe Executivo', conversion: 19, revenue: 14500 }
    ],
    operational: {
      titulo: 'Projetos & Atividades Recentes',
      items: [
        { label: 'Reuniões Agendadas (Hoje)', count: 6, color: 'text-blue-500' },
        { label: 'Follow-ups Atrasados', count: 2, color: 'text-red-500' },
        { label: 'Propostas Visualizadas', count: 9, color: 'text-emerald-500' },
        { label: 'Contratos em Assinatura', count: 4, color: 'text-amber-500' }
      ]
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 text-left">
      
      {/* PageHeader minimalista */}
      <PageHeader 
        title={`Bem-vindo, ${user?.name?.split(' ')[0] || 'Admin'} 👋`}
        description={`Hoje é ${today}. Análise focada em maximizar o seu faturamento.`}
        actions={
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="bg-[#18181b] border border-[#27272a] rounded-[8px] px-4 py-2 flex items-center gap-2 shadow-sm text-xs font-semibold text-zinc-300 hover:bg-[#1f1f22] cursor-pointer transition-colors">
              <CalendarDays className="size-4 text-zinc-500" />
              <span>Mês Atual</span>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="bg-[#18181b] border border-[#27272a] rounded-[8px] flex items-center px-3 py-2 shadow-sm w-full md:w-64 focus-within:border-[#3f3f46] transition-colors duration-200">
                <Search className="size-4 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="Buscar métricas…" 
                  className="bg-transparent border-none focus-visible:outline-none w-full ml-2 text-xs text-zinc-200 placeholder:text-zinc-600"
                />
              </div>
            </div>
          </div>
        }
      />

      {/* 1. SEÇÃO TOPO: SAÚDE DA EMPRESA (KPIS PRINCIPAIS) */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4"
      >
        <StatsCard 
          title="Faturamento do Mês"
          value={formatCurrency(currentData.health.faturamento)}
          description={`${currentData.health.faturamentoTrend} vs mês anterior`}
          icon={DollarSign}
          trend={{ value: currentData.health.faturamentoTrend, isUp: true }}
        />
        <StatsCard 
          title="Lucro Estimado"
          value={formatCurrency(currentData.health.lucro)}
          description={`${((currentData.health.lucro / currentData.health.faturamento) * 100).toFixed(0)}% margem`}
          icon={TrendingUp}
          trend={{ value: "Saudável", isUp: true }}
        />
        <StatsCard 
          title="Negócios em Aberto"
          value={currentData.health.orcamentosAberto}
          description="Aguardando fechamento"
          icon={FileText}
          trend={{ value: "Atenção", isUp: false }}
        />
        <StatsCard 
          title="Taxa de Conversão"
          value={`${currentData.health.conversao}%`}
          description="Contatos em clientes"
          icon={Target}
          trend={{ value: "+2.4%", isUp: true }}
        />
        <StatsCard 
          title="Tempo Médio"
          value={`${currentData.health.tempoFechamento} dias`}
          description="Ciclo médio de vendas"
          icon={Clock}
          trend={{ value: "Rápido", isUp: true }}
        />
        <StatsCard 
          title="Sem Retorno"
          value={currentData.health.leadsParados}
          description="Leads travados no funil"
          icon={AlertTriangle}
          trend={{ value: "Gargalo", isUp: false }}
          className="border-red-900/30 bg-[#1f1616]/80"
        />
      </motion.div>

      {/* 2. SEÇÃO MEIO: VISÃO DO FUNIL & OPERAÇÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* FUNIL DE VENDAS */}
        <Card className="lg:col-span-2 shadow-sm border-[#27272a] bg-[#18181b] rounded-[10px]">
          <CardContent className="p-5">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="font-semibold text-zinc-200 text-sm flex items-center gap-2">
                  <Layers className="size-4 text-blue-500" />
                  <span>Funil de Vendas</span>
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {currentData.funnel.map((item, idx) => (
                <div key={idx} className="relative flex flex-col justify-between p-3 bg-[#131316] border border-[#27272a] rounded-[8px] hover:border-[#3f3f46] transition-colors duration-200">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Etapa {idx + 1}</span>
                    <span className="text-[11px] font-medium text-zinc-300 leading-tight block">{item.stage}</span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-[18px] font-bold text-zinc-100">{item.value}</span>
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest">leads</span>
                  </div>
                  <div className={`h-1 w-full ${item.color} rounded-full mt-3 opacity-80`} />
                  
                  {idx < currentData.funnel.length - 1 && (
                    <div className="hidden sm:flex absolute top-1/2 -translate-y-1/2 -right-[13px] z-20 size-5 rounded-full bg-[#18181b] border border-[#27272a] items-center justify-center">
                      <ArrowRight className="size-3 text-zinc-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FLUXO OPERACIONAL DETALHADO */}
        <Card className="shadow-sm border-[#27272a] bg-[#18181b] rounded-[10px] flex flex-col justify-between">
          <CardContent className="p-5 h-full flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-zinc-200 text-sm flex items-center gap-2">
                  <Activity className="size-4 text-emerald-500" />
                  <span>{currentData.operational.titulo}</span>
                </h3>
              </div>

              <div className="space-y-2.5">
                {currentData.operational.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-[#131316] hover:bg-[#1a1a1f] p-2.5 border border-[#27272a] rounded-[8px] transition-colors duration-200">
                    <span className="text-[11px] font-medium text-zinc-400">{item.label}</span>
                    <span className={`text-[12px] font-bold ${item.color} bg-[#18181b] border border-[#27272a] size-6 rounded-md flex items-center justify-center`}>
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-4 text-[10px] text-zinc-600 font-medium text-center border-t border-[#27272a] pt-3 flex items-center justify-center gap-1.5">
              <Compass className="size-3 text-zinc-600" />
              <span>Dados sincronizados em tempo real.</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. PERFORMANCE VENDEDORES */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="shadow-sm border-[#27272a] bg-[#18181b] rounded-[10px]">
          <CardContent className="p-5">
            <h3 className="font-semibold text-zinc-200 text-sm mb-4 flex items-center gap-2">
              <UserCheck className="size-4 text-purple-500" />
              <span>Performance dos Vendedores</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#27272a] text-[10px] text-zinc-500 font-bold uppercase tracking-widest pb-3">
                    <th className="pb-3 font-bold">Vendedor</th>
                    <th className="pb-3 font-bold text-center">Taxa de Conversão</th>
                    <th className="pb-3 font-bold text-right">Vendas Fechadas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]">
                  {currentData.sales.map((sl, idx) => (
                    <tr key={idx} className="hover:bg-[#1f1f22]/50 transition-colors">
                      <td className="py-3 font-medium text-zinc-300 flex items-center gap-3 text-[12px]">
                        <div className="size-6 rounded-full bg-[#27272a] flex items-center justify-center font-bold text-zinc-400 text-[9px] uppercase">
                          {sl.name.split(' ').map(n=>n[0]).join('')}
                        </div>
                        <span>{sl.name}</span>
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`text-[12px] font-bold ${sl.conversion > 30 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {sl.conversion}%
                          </span>
                          <div className="w-16 h-1 bg-[#27272a] rounded-full overflow-hidden hidden sm:block">
                            <div className={`h-full ${sl.conversion > 30 ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${sl.conversion}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-right font-bold text-zinc-100 text-[13px]">
                        {formatCurrency(sl.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
