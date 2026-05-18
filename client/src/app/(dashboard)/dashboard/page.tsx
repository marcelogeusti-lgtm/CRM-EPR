'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search,
  Eye,
  ShieldCheck,
  CalendarDays,
  CreditCard,
  SmartphoneNfc,
  Apple,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
  TrendingUp,
  Award,
  Users,
  Target,
  FileText,
  AlertTriangle,
  Briefcase,
  Layers,
  Sparkles,
  DollarSign,
  Activity,
  CheckCircle2,
  Clock,
  Compass,
  ArrowRight,
  UserCheck,
  HelpCircle as Info,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/system/PageHeader';
import { StatsCard } from '@/components/system/StatsCard';
import { ProgressMetric } from '@/components/system/ProgressMetric';
import { motion, AnimatePresence } from 'framer-motion';

// Definição dos Nichos
type NicheType = 'vidracaria' | 'clinica' | 'imobiliaria' | 'geral';

export default function DashboardPage() {
  const { user } = useAuth();
  const [niche, setNiche] = useState<NicheType>('vidracaria');
  const [isLoading, setIsLoading] = useState(false);

  const today = new Date().toLocaleDateString('pt-BR', { month: 'long', day: 'numeric', year: 'numeric' });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Massa de dados fictícios premium adaptativa por Nicho
  const dataMap = {
    vidracaria: {
      health: {
        faturamento: 87420,
        faturamentoTrend: '+18%',
        lucro: 31220,
        orcamentosAberto: 42,
        conversao: 37,
        tempoFechamento: 4.2,
        leadsParados: 17
      },
      funnel: [
        { stage: 'Novos Leads', value: 34, color: 'bg-blue-500' },
        { stage: 'Orçamento', value: 18, color: 'bg-indigo-500' },
        { stage: 'Medição', value: 12, color: 'bg-purple-500' },
        { stage: 'Produção', value: 8, color: 'bg-amber-500' },
        { stage: 'Instalação', value: 6, color: 'bg-emerald-500' },
        { stage: 'Finalizado', value: 24, color: 'bg-slate-500' }
      ],
      services: [
        { name: 'Sacada', revenue: 41000, percentage: 47 },
        { name: 'Box Banheiro', revenue: 22000, percentage: 25 },
        { name: 'Fachada', revenue: 16000, percentage: 18 },
        { name: 'Espelhos', revenue: 8420, percentage: 10 }
      ],
      sales: [
        { name: 'João Silva', conversion: 41, revenue: 27000 },
        { name: 'Pedro Santos', conversion: 22, revenue: 11000 },
        { name: 'Ana Oliveira', conversion: 35, revenue: 19000 }
      ],
      operational: {
        titulo: 'Produção & Logística Operacional',
        items: [
          { label: 'Pedidos em Produção', count: 14, color: 'text-amber-500' },
          { label: 'Pedidos Atrasados na Fábrica', count: 3, color: 'text-red-500' },
          { label: 'Instalações Agendadas (Semana)', count: 9, color: 'text-blue-500' },
          { label: 'Equipes Externas de Montagem', count: 2, color: 'text-emerald-500' },
          { label: 'Pedidos Concluídos', count: 24, color: 'text-slate-500' }
        ]
      },
      alerts: [
        '⚠️ 12 orçamentos aguardando aprovação há mais de 5 dias.',
        '⚠️ 3 instalações de sacada correm risco de atraso de insumo.',
        '⚠️ Vendedor Pedro Santos abaixo do ticket médio de conversão.',
        '⚠️ Custos de frete de ferragens subiram 11% este mês.'
      ],
      aiInsight: 'O faturamento subiu 18% este mês, impulsionado pelo serviço de Sacadas (R$ 41k), que responde por 47% das receitas. Contudo, detectamos gargalo na etapa de "Medição" com 12 orçamentos retidos. Recomendamos ativar o auto-disparo de WhatsApp para acelerar agendamentos técnicos.'
    },
    clinica: {
      health: {
        faturamento: 94800,
        faturamentoTrend: '+12%',
        lucro: 42100,
        orcamentosAberto: 28, // Consultas aguardando confirmação
        conversao: 64, // Taxa de comparecimento
        tempoFechamento: 1.5, // Dias para retorno
        leadsParados: 9 // Pacientes sem reagendar retorno
      },
      funnel: [
        { stage: 'Primeiro Contato', value: 45, color: 'bg-blue-500' },
        { stage: 'Triagem', value: 31, color: 'bg-indigo-500' },
        { stage: 'Consulta Agendada', value: 24, color: 'bg-purple-500' },
        { stage: 'Tratamento', value: 16, color: 'bg-amber-500' },
        { stage: 'Retorno', value: 12, color: 'bg-emerald-500' },
        { stage: 'Concluído', value: 28, color: 'bg-slate-500' }
      ],
      services: [
        { name: 'Cirurgias Estéticas', revenue: 45000, percentage: 47 },
        { name: 'Consultas Clínicas', revenue: 25800, percentage: 27 },
        { name: 'Procedimentos Laser', revenue: 16000, percentage: 17 },
        { name: 'Retornos de Triagem', revenue: 8000, percentage: 9 }
      ],
      sales: [
        { name: 'Dra. Ana Costa', conversion: 78, revenue: 52000 },
        { name: 'Dr. Lucas Prado', conversion: 52, revenue: 28000 },
        { name: 'Dra. Marina Vale', conversion: 61, revenue: 14800 }
      ],
      operational: {
        titulo: 'Controles Clínicos & Agendas',
        items: [
          { label: 'Consultas Agendadas Hoje', count: 18, color: 'text-blue-500' },
          { label: 'Faltas não justificadas hoje', count: 3, color: 'text-red-500' },
          { label: 'Paciente pós-operatório sem retorno', count: 5, color: 'text-amber-500' },
          { label: 'Especialistas ativos na escala', count: 4, color: 'text-emerald-500' },
          { label: 'Prontuários finalizados', count: 14, color: 'text-slate-500' }
        ]
      },
      alerts: [
        '⚠️ 5 pacientes de pós-operatório imediato não agendaram o retorno.',
        '⚠️ Taxa de faltas (No-Show) na quarta-feira subiu 15%.',
        '⚠️ Dr. Lucas Prado com tempo médio de consulta 12 min acima da meta.',
        '⚠️ Estoque de insumos cirúrgicos (Botox/Fios) em nível de alerta.'
      ],
      aiInsight: 'Seu lucro estimado cresceu para R$ 42k. O no-show (faltas) de quarta-feira está em 15%, gerando um prejuízo invisível estimado em R$ 3.800/semana. Recomenda-se acionar confirmações automáticas de WhatsApp 24h e 4h antes das consultas.'
    },
    imobiliaria: {
      health: {
        faturamento: 125000,
        faturamentoTrend: '+22%',
        lucro: 48900,
        orcamentosAberto: 31, // Propostas em análise
        conversao: 12, // Conversão de visita em fechamento
        tempoFechamento: 18.5, // Dias de negociação
        leadsParados: 44 // Leads sem visita agendada
      },
      funnel: [
        { stage: 'Captação', value: 89, color: 'bg-blue-500' },
        { stage: 'Visita Marcada', value: 42, color: 'bg-indigo-500' },
        { stage: 'Visita Realizada', value: 28, color: 'bg-purple-500' },
        { stage: 'Proposta Emitida', value: 14, color: 'bg-amber-500' },
        { stage: 'Análise de Crédito', value: 8, color: 'bg-emerald-500' },
        { stage: 'Contrato Assinado', value: 12, color: 'bg-slate-500' }
      ],
      services: [
        { name: 'Vendas Residenciais', revenue: 75000, percentage: 60 },
        { name: 'Aluguel Comercial', revenue: 32000, percentage: 26 },
        { name: 'Taxa de Administração', revenue: 10000, percentage: 8 },
        { name: 'Vistorias & Laudos', revenue: 8000, percentage: 6 }
      ],
      sales: [
        { name: 'Roberto Corretor', conversion: 15, revenue: 68000 },
        { name: 'Juliana Imóveis', conversion: 10, revenue: 37000 },
        { name: 'Carlos Vendas', conversion: 8, revenue: 20000 }
      ],
      operational: {
        titulo: 'Vistorias & Visitas de Imóveis',
        items: [
          { label: 'Visitas Agendadas (Semana)', count: 26, color: 'text-blue-500' },
          { label: 'Vistorias Pendentes de Laudo', count: 4, color: 'text-amber-500' },
          { label: 'Chaves sob custódia na recepção', count: 18, color: 'text-emerald-500' },
          { label: 'Imóveis novos captados', count: 12, color: 'text-indigo-500' },
          { label: 'Contratos em fase de cartório', count: 5, color: 'text-slate-500' }
        ]
      },
      alerts: [
        '⚠️ 8 propostas correm risco por lentidão na análise cadastral.',
        '⚠️ 4 vistorias de desocupação atrasadas há mais de 48 horas.',
        '⚠️ Imóveis do proprietário Silva sem visualizações há 30 dias.',
        '⚠️ Taxa de inadimplência de locações subiu para 4.1% este mês.'
      ],
      aiInsight: 'O faturamento de Vendas Residenciais (R$ 75k) está excelente, porém você tem 44 leads parados no funil sem agendamento de visita. Automatizar disparos de novos lançamentos baseados nas preferências desses leads recuperará cerca de R$ 15k de receita perdida.'
    },
    geral: {
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
        { stage: 'Fechado (Ganho)', value: 15, color: 'bg-slate-500' }
      ],
      services: [
        { name: 'Licenciamento SaaS', revenue: 42000, percentage: 53 },
        { name: 'Serviço Setup/Onboarding', revenue: 18500, percentage: 24 },
        { name: 'Consultoria Premium', revenue: 10000, percentage: 13 },
        { name: 'Suporte Adicional', revenue: 8000, percentage: 10 }
      ],
      sales: [
        { name: 'Rodrigo SDR', conversion: 32, revenue: 38000 },
        { name: 'Beatriz Account', conversion: 24, revenue: 26000 },
        { name: 'Felipe Executivo', conversion: 19, revenue: 14500 }
      ],
      operational: {
        titulo: 'Projetos & Onboarding de Clientes',
        items: [
          { label: 'Contas em Fase de Onboarding', count: 9, color: 'text-blue-500' },
          { label: 'Projetos com Entrega Atrasada', count: 2, color: 'text-red-500' },
          { label: 'Reuniões de Alinhamento Hoje', count: 6, color: 'text-purple-500' },
          { label: 'Pesquisas de Satisfação NPS enviadas', count: 42, color: 'text-emerald-500' },
          { label: 'Contas migradas com sucesso', count: 15, color: 'text-slate-500' }
        ]
      },
      alerts: [
        '⚠️ 4 clientes paralisados na etapa de importação de banco de dados.',
        '⚠️ 2 projetos atrasados correm risco de churn prematuro.',
        '⚠️ NPS de suporte técnico caiu de 84 para 78 esta semana.',
        '⚠️ Custos de servidores de nuvem subiram 18% vs mês passado.'
      ],
      aiInsight: 'O faturamento mensal está estável em R$ 78.500, mas a inadimplência aumentou para R$ 3.800. A principal causa é a falta de cobrança ativa via Pix. Sugerimos integrar o gateway Asaas para emitir notificações de pagamento automáticas com desconto anti-atraso.'
    }
  };

  const currentData = dataMap[niche];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 text-left">
      
      {/* Banner Superior Premium de Alinhamento */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#0f172a] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between shadow-sm border border-zinc-800"
      >
        <div className="flex items-center gap-3">
          <div className="bg-blue-600/10 text-blue-400 rounded-lg p-2 flex items-center justify-center font-bold whitespace-nowrap text-sm border border-blue-500/20">
            <Sparkles className="size-4 animate-pulse text-blue-500" />
            <span className="ml-1.5 text-xs font-bold uppercase tracking-wider">Business Intelligence</span>
          </div>
          <p className="text-slate-350 text-xs font-medium leading-relaxed max-w-[480px]">
            Painel adaptativo de tomada de decisão. Altere o template comercial para redefinir instantaneamente as métricas de nicho.
          </p>
        </div>

        {/* SELETOR DE NICHO ADAPTATIVO (WOW FACTOR) */}
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">Template de Negócio</label>
          <select 
            value={niche}
            onChange={(e) => {
              setIsLoading(true);
              setNiche(e.target.value as NicheType);
              setTimeout(() => setIsLoading(false), 250);
            }}
            className="bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer shadow-md"
          >
            <option value="vidracaria">🪟 Vidraçaria & Instalação</option>
            <option value="clinica">🏥 Clínica & Consultório</option>
            <option value="imobiliaria">🏢 Imobiliária & Locações</option>
            <option value="geral">🚀 Geral & Serviços/SaaS</option>
          </select>
        </div>
      </motion.div>

      {/* PageHeader unificado */}
      <PageHeader 
        title={`Bem-vindo, ${user?.name?.split(' ')[0] || 'Admin'} 👋`}
        description={`Hoje é ${today}. Análise em tempo real focada em maximizar o lucro de sua operação.`}
        actions={
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="bg-white border border-zinc-200 rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-sm text-xs font-bold text-zinc-650 cursor-pointer hover:bg-zinc-50 transition-colors">
              <CalendarDays className="size-[18px] text-zinc-400" />
              <span>Mês Atual de Referência</span>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="bg-white border border-zinc-200 rounded-xl flex items-center px-3 py-2 shadow-sm w-full md:w-64 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
                <Search className="size-[18px] text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="Buscar métricas..." 
                  className="bg-transparent border-none outline-none w-full ml-2 text-xs text-zinc-700 placeholder:text-zinc-400"
                />
              </div>
            </div>
          </div>
        }
      />

      {/* 1. SEÇÃO TOPO: SAÚDE DA EMPRESA (KPIS PRINCIPAIS) */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 py-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-28 bg-white border border-zinc-250 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div 
            key={niche}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4"
          >
            {/* Faturamento do Mês */}
            <StatsCard 
              title="💰 Faturamento do Mês"
              value={formatCurrency(currentData.health.faturamento)}
              description={`${currentData.health.faturamentoTrend} vs mês anterior`}
              icon={DollarSign}
              trend={{ value: currentData.health.faturamentoTrend, isUp: true }}
            />

            {/* Lucro Estimado */}
            <StatsCard 
              title="📈 Lucro Estimado"
              value={formatCurrency(currentData.health.lucro)}
              description={`${((currentData.health.lucro / currentData.health.faturamento) * 100).toFixed(0)}% margem líquida`}
              icon={TrendingUp}
              trend={{ value: "Saudável", isUp: true }}
            />

            {/* Orçamentos em Aberto */}
            <StatsCard 
              title="📋 Orçamentos em Aberto"
              value={currentData.health.orcamentosAberto}
              description="Aguardando resposta técnica"
              icon={FileText}
              trend={{ value: "Atenção", isUp: false }}
            />

            {/* Taxa de Conversão */}
            <StatsCard 
              title="🔥 Taxa de Conversão"
              value={`${currentData.health.conversao}%`}
              description="Contatos em clientes"
              icon={Target}
              trend={{ value: "+2.4%", isUp: true }}
            />

            {/* Tempo Médio de Fechamento */}
            <StatsCard 
              title="⏱ Tempo Médio"
              value={`${currentData.health.tempoFechamento} dias`}
              description="Ciclo médio de vendas"
              icon={Clock}
              trend={{ value: "Rápido", isUp: true }}
            />

            {/* Clientes Sem Retorno */}
            <StatsCard 
              title="⚠️ Sem Retorno"
              value={currentData.health.leadsParados}
              description="Leads travados no funil"
              icon={AlertTriangle}
              trend={{ value: "Gargalo", isUp: false }}
              className="border-red-200/60 bg-red-50/5"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. SEÇÃO MEIO: VISÃO DO FUNIL ADAPTATIVO & OPERAÇÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* FUNIL OPERACIONAL DE NICHO */}
        <Card className="lg:col-span-2 shadow-sm border-zinc-200 bg-white rounded-2xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-zinc-800 text-base flex items-center gap-1.5">
                  <Layers className="size-4.5 text-blue-500" />
                  <span>Fluxo do Funil Operacional ({niche === 'vidracaria' ? 'Vidraçaria' : niche === 'clinica' ? 'Clínica' : niche === 'imobiliaria' ? 'Imobiliária' : 'Geral'})</span>
                </h3>
                <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">Representação real da esteira de etapas ativas na empresa.</p>
              </div>
              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-wide">
                Integração Live
              </span>
            </div>

            {/* Render do Funil Horizontal */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {currentData.funnel.map((item, idx) => (
                <div key={idx} className="relative flex flex-col justify-between p-3.5 bg-zinc-50 border border-zinc-200/60 rounded-xl hover:shadow-md hover:border-zinc-300 transition-all">
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wide block">Etapa {idx + 1}</span>
                    <span className="text-[11px] font-bold text-zinc-800 leading-tight block">{item.stage}</span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-xl font-black text-zinc-900">{item.value}</span>
                    <span className="text-[9px] text-zinc-400 font-semibold font-mono">leads</span>
                  </div>
                  <div className={`h-1.5 w-full ${item.color} rounded-full mt-3`} />
                  
                  {idx < currentData.funnel.length - 1 && (
                    <div className="hidden sm:block absolute top-1/2 -translate-y-1/2 -right-2.5 z-20 size-5 rounded-full bg-white border border-zinc-200 shadow-sm flex items-center justify-center">
                      <ArrowRight className="size-3 text-zinc-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 3. FLUXO OPERACIONAL DETALHADO */}
        <Card className="shadow-sm border-zinc-200 bg-white rounded-2xl flex flex-col justify-between">
          <CardContent className="p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-1.5">
                  <Activity className="size-4.5 text-blue-500" />
                  <span>{currentData.operational.titulo}</span>
                </h3>
              </div>

              <div className="space-y-3.5">
                {currentData.operational.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-zinc-50/50 hover:bg-zinc-50 p-2.5 border border-zinc-150 rounded-xl transition-all">
                    <span className="text-xs font-semibold text-zinc-650">{item.label}</span>
                    <span className={`text-sm font-black ${item.color} bg-white border border-zinc-200 size-7 rounded-lg flex items-center justify-center shadow-xs font-mono`}>
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-5 text-[10px] text-zinc-400 font-medium text-center border-t border-slate-100 pt-3 flex items-center justify-center gap-1.5">
              <Compass className="size-3.5 text-zinc-400" />
              <span>Sincronizado com despacho de rotas e técnicos.</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. SEÇÃO ABAIXO: FATURAMENTO POR SERVIÇO + PERFORMANCE VENDEDORES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* FATURAMENTO POR SERVIÇO */}
        <Card className="shadow-sm border-zinc-200 bg-white rounded-2xl">
          <CardContent className="p-6">
            <h3 className="font-bold text-zinc-800 text-sm mb-4 flex items-center gap-1.5">
              <Briefcase className="size-4.5 text-blue-500" />
              <span>Receitas por Serviços (Qual serviço realmente dá dinheiro?)</span>
            </h3>

            <div className="space-y-4 py-2">
              {currentData.services.map((svc, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-zinc-800">
                    <span>{svc.name}</span>
                    <span className="font-mono">{formatCurrency(svc.revenue)}</span>
                  </div>
                  <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full" 
                      style={{ width: `${svc.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-zinc-400 font-bold">
                    <span>Participação</span>
                    <span>{svc.percentage}% do faturamento</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* PERFORMANCE DOS VENDEDORES */}
        <Card className="shadow-sm border-zinc-200 bg-white rounded-2xl">
          <CardContent className="p-6">
            <h3 className="font-bold text-zinc-800 text-sm mb-4 flex items-center gap-1.5">
              <UserCheck className="size-4.5 text-blue-500" />
              <span>Performance dos Vendedores (Mude o patamar da equipe)</span>
            </h3>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-150 text-[10px] text-zinc-400 font-bold uppercase tracking-wider pb-3">
                    <th className="pb-3 font-bold">Vendedor</th>
                    <th className="pb-3 font-bold text-center">Taxa de Conversão</th>
                    <th className="pb-3 font-bold text-right">Vendas Fechadas</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-zinc-650 divide-y divide-zinc-50">
                  {currentData.sales.map((sl, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-3.5 font-bold text-zinc-800 flex items-center gap-2">
                        <div className="size-7 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-zinc-600 text-[10px] uppercase">
                          {sl.name.split(' ').map(n=>n[0]).join('')}
                        </div>
                        <span>{sl.name}</span>
                      </td>
                      <td className="py-3.5 text-center font-bold text-zinc-900 font-mono">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={sl.conversion > 30 ? 'text-emerald-600' : 'text-amber-500'}>
                            {sl.conversion}%
                          </span>
                          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                            <div className={`h-full ${sl.conversion > 30 ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${sl.conversion}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 text-right font-black text-zinc-900 font-mono">
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

      {/* 5. SEÇÃO: FLUXO FINANCEIRO & MAPA DE PROBLEMAS + PULSEAI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* FLUXO FINANCEIRO DETALHADO */}
        <Card className="lg:col-span-2 shadow-sm border-zinc-200 bg-white rounded-2xl">
          <CardContent className="p-6">
            <h3 className="font-bold text-zinc-800 text-sm mb-4 flex items-center gap-1.5">
              <CreditCard className="size-4.5 text-blue-500" />
              <span>Fluxo Financeiro Mensal (Visão de Caixa & Previsões)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              
              <div className="p-4 bg-zinc-50 border border-zinc-200/60 rounded-xl">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Caixa Atual</span>
                <span className="text-sm font-black text-zinc-800 font-mono mt-2 block">{formatCurrency(18290)}</span>
                <span className="text-[9px] text-zinc-400 mt-1 block">Saldo líquido</span>
              </div>

              <div className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-xl">
                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">Contas a Receber</span>
                <span className="text-sm font-black text-emerald-700 font-mono mt-2 block">{formatCurrency(43180)}</span>
                <span className="text-[9px] text-emerald-500 mt-1 block">Próximos 15 dias</span>
              </div>

              <div className="p-4 bg-red-50/30 border border-red-100 rounded-xl">
                <span className="text-[9px] font-bold text-red-600 uppercase tracking-wider block">Contas a Pagar</span>
                <span className="text-sm font-black text-red-700 font-mono mt-2 block">{formatCurrency(12450)}</span>
                <span className="text-[9px] text-red-500 mt-1 block">Vencendo este mês</span>
              </div>

              <div className="p-4 bg-blue-50/30 border border-blue-100 rounded-xl">
                <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider block">Previsão 30 Dias</span>
                <span className="text-sm font-black text-blue-700 font-mono mt-2 block">{formatCurrency(68900)}</span>
                <span className="text-[9px] text-blue-500 mt-1 block">Faturamento estimado</span>
              </div>

              <div className="p-4 bg-amber-50/30 border border-amber-100 rounded-xl">
                <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider block">Inadimplência</span>
                <span className="text-sm font-black text-amber-700 font-mono mt-2 block">{formatCurrency(3800)}</span>
                <span className="text-[9px] text-amber-500 mt-1 block">30 dias em atraso</span>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* MAPA DE PROBLEMAS INTELIGENTE (WOW FACTOR) */}
        <Card className="shadow-sm border-zinc-200 bg-white rounded-2xl border-red-200/50">
          <CardContent className="p-6">
            <h3 className="font-bold text-red-700 text-sm mb-4 flex items-center gap-1.5">
              <AlertCircle className="size-4.5 text-red-500 animate-pulse" />
              <span>Mapa de Problemas (Atenção Imediata!)</span>
            </h3>

            <div className="space-y-3">
              {currentData.alerts.map((al, idx) => (
                <div key={idx} className="p-3 bg-red-50/50 border border-red-100 rounded-xl text-[11px] font-semibold text-red-700 leading-normal">
                  {al}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* 6. BUSINESS INTELLIGENCE LAYER: PULSEAI OPERACIONAL DIAGNOSIS (IA ANALISANDO A EMPRESA - THE NÍVEL PREMIUM) */}
      <Card className="shadow-sm border-zinc-200 bg-gradient-to-r from-blue-50/30 to-indigo-50/30 rounded-2xl border-blue-200/60 overflow-hidden relative">
        <div className="absolute right-0 top-0 w-32 h-32 bg-blue-600/5 rounded-full filter blur-xl" />
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Sparkles className="size-4 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 text-sm">PulseAI - Diagnóstico & Insight Preditivo Comercial</h3>
              <span className="text-[8px] font-bold text-blue-600 tracking-widest uppercase">Camada analítica de inteligência preditiva ativa</span>
            </div>
          </div>

          <div className="p-4 bg-white/80 border border-blue-100/60 rounded-xl mt-3 flex items-start gap-3">
            <Info className="size-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-700 leading-relaxed font-medium">
              "{currentData.aiInsight}"
            </p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

// Utilitário simplificado de classes
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
