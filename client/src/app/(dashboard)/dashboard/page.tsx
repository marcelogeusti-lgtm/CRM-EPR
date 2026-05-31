'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles,
  TrendingUp,
  DollarSign,
  Wallet,
  Target,
  ArrowUpRight,
  Activity,
  Bot,
  Zap,
  MessageSquare,
  ArrowRight,
  MoreHorizontal
} from 'lucide-react';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';

export default function PremiumDashboardPage() {
  const { tenant } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = [
    { name: 'Jan', entradas: 1200, saidas: 400, mrr: 800 },
    { name: 'Fev', entradas: 1800, saidas: 500, mrr: 1200 },
    { name: 'Mar', entradas: 2100, saidas: 600, mrr: 1500 },
    { name: 'Abr', entradas: 2800, saidas: 1100, mrr: 2100 },
    { name: 'Mai', entradas: 4200, saidas: 1400, mrr: 3500 },
    { name: 'Jun', entradas: 5900, saidas: 1800, mrr: 4800 },
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0a0c10] text-zinc-100 p-2 sm:p-6 lg:p-8 relative overflow-hidden -mx-8 -my-6">
      
      {/* Efeitos de Luz no Fundo (Aura Premium) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none" />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-[1600px] mx-auto space-y-8 relative z-10"
      >
        {/* ================= HEADER INTELIGENTE ================= */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Visão Geral
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <div className="size-1.5 rounded-full bg-blue-500 animate-pulse" /> Live
              </span>
            </h1>
            <p className="text-sm text-zinc-400 font-medium">Controle financeiro e inteligência de automação da organização.</p>
          </div>

          <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4 md:max-w-md shadow-[0_0_30px_rgba(59,130,246,0.15)] flex items-start gap-4">
            <div className="size-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30">
              <Sparkles className="size-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-1">Insight da Inteligência Artificial</h3>
              <p className="text-[11px] text-blue-100/70 leading-relaxed font-medium">
                Sua automação <strong className="text-white">n8n</strong> classificou 4 novos contatos e a taxa de conversão no funil subiu <strong className="text-emerald-400">+2.1%</strong> nas últimas 24h.
              </p>
            </div>
          </div>
        </motion.div>

        {/* ================= CARDS DE MÉTRICAS (GLASSMORPHISM) ================= */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: MRR */}
          <div className="group relative bg-[#11151c]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:border-blue-500/30 hover:shadow-[0_0_40px_rgba(59,130,246,0.1)]">
            <div className="absolute top-0 right-0 p-6 opacity-20 transition-opacity group-hover:opacity-40">
              <TrendingUp className="size-16 text-blue-500 -mt-4 -mr-4" />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Receita Recorrente (MRR)</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-3xl font-extrabold text-white tracking-tight">{formatCurrency(4800)}</h2>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                      <ArrowUpRight className="size-3 mr-0.5" /> +12%
                    </span>
                    <span className="text-[10px] text-zinc-500 font-medium">vs último mês</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Faturamento */}
          <div className="group relative bg-[#11151c]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:border-indigo-500/30 hover:shadow-[0_0_40px_rgba(99,102,241,0.1)]">
            <div className="absolute top-0 right-0 p-6 opacity-20 transition-opacity group-hover:opacity-40">
              <DollarSign className="size-16 text-indigo-500 -mt-4 -mr-4" />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Faturamento Bruto</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-3xl font-extrabold text-white tracking-tight">{formatCurrency(5900)}</h2>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                      <ArrowUpRight className="size-3 mr-0.5" /> +8%
                    </span>
                    <span className="text-[10px] text-zinc-500 font-medium">vs último mês</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Caixa */}
          <div className="group relative bg-[#11151c]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:border-purple-500/30 hover:shadow-[0_0_40px_rgba(168,85,247,0.1)]">
            <div className="absolute top-0 right-0 p-6 opacity-20 transition-opacity group-hover:opacity-40">
              <Wallet className="size-16 text-purple-500 -mt-4 -mr-4" />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Caixa Livre</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-3xl font-extrabold text-white tracking-tight">{formatCurrency(4100)}</h2>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] font-bold text-zinc-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                      Margem 69%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Conversão */}
          <div className="group relative bg-[#11151c]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:border-amber-500/30 hover:shadow-[0_0_40px_rgba(245,158,11,0.1)] cursor-pointer">
            <div className="absolute top-0 right-0 p-6 opacity-20 transition-opacity group-hover:opacity-40">
              <Target className="size-16 text-amber-500 -mt-4 -mr-4" />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Conversão de Leads</span>
                <ArrowRight className="size-4 text-zinc-500 transition-transform group-hover:translate-x-1" />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-3xl font-extrabold text-white tracking-tight">14.2%</h2>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                      <ArrowUpRight className="size-3 mr-0.5" /> +2.1%
                    </span>
                    <span className="text-[10px] text-zinc-500 font-medium">Radar n8n</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </motion.div>

        {/* ================= MIDDLE SECTION: CHART & RADAR ================= */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          
          {/* Gráfico Neo-brutalista / Cinematic */}
          <motion.div variants={itemVariants} className="xl:col-span-2 bg-[#11151c]/80 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col min-h-[450px]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Performance Financeira</h3>
                <p className="text-xs text-zinc-400 font-medium mt-1">Trajetória de entradas líquidas e crescimento de MRR</p>
              </div>
              
              <div className="flex items-center gap-6 bg-black/20 p-1.5 rounded-full border border-white/5 px-4">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                  <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">MRR</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                  <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Entradas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                  <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Saídas</span>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff" strokeOpacity={0.05} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#71717a', fontSize: 11, fontWeight: 600}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#71717a', fontSize: 11, fontWeight: 600}} 
                    dx={-10}
                    tickFormatter={(value) => `R$${value/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0c10', borderColor: '#27272a', borderRadius: '12px', fontSize: '13px', color: '#fff', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                    itemStyle={{ color: '#e4e4e7', fontWeight: 'bold' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Area type="monotone" dataKey="saidas" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorSaidas)" />
                  <Area type="monotone" dataKey="entradas" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorEntradas)" />
                  <Area type="monotone" dataKey="mrr" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorMrr)" style={{ filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.5))' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Radar n8n: Feed de Automações */}
          <motion.div variants={itemVariants} className="bg-[#11151c]/80 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden flex flex-col shadow-xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Activity className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Radar n8n</h3>
                  <p className="text-[10px] text-zinc-400 font-medium">Log em tempo real</p>
                </div>
              </div>
              <button className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-500 transition-colors">
                <MoreHorizontal className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent space-y-6">
                
                {[
                  {
                    type: 'deal_won',
                    title: 'Negócio Fechado (IA)',
                    desc: 'O n8n converteu o Lead "Carlos Silva".',
                    time: 'Agora mesmo',
                    icon: <Target className="size-3 text-emerald-400" />,
                    bg: 'bg-emerald-500/20 border-emerald-500/30'
                  },
                  {
                    type: 'webhook_lead',
                    title: 'Lead Recebido',
                    desc: 'A Evolution API enviou webhook de nova conversa.',
                    time: '12 min atrás',
                    icon: <Zap className="size-3 text-blue-400" />,
                    bg: 'bg-blue-500/20 border-blue-500/30'
                  },
                  {
                    type: 'ai_reply',
                    title: 'Resposta Automática',
                    desc: 'Gemini 1.5 Flash atendeu cliente.',
                    time: '45 min atrás',
                    icon: <Bot className="size-3 text-purple-400" />,
                    bg: 'bg-purple-500/20 border-purple-500/30'
                  },
                  {
                    type: 'deal_move',
                    title: 'Estágio Alterado',
                    desc: 'n8n moveu "Fernanda" p/ Em Negociação.',
                    time: '2 horas atrás',
                    icon: <MessageSquare className="size-3 text-indigo-400" />,
                    bg: 'bg-indigo-500/20 border-indigo-500/30'
                  }
                ].map((log, i) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${log.bg} z-10 relative bg-[#0a0c10]`}>
                      {log.icon}
                    </div>
                    
                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors shadow-sm ml-4 md:ml-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-zinc-200">{log.title}</span>
                        <span className="text-[9px] font-bold text-zinc-500">{log.time}</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">{log.desc}</p>
                    </div>
                  </div>
                ))}
                
              </div>
            </div>
            
            <div className="p-4 border-t border-white/5 bg-white/[0.01]">
              <button className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 transition-colors">
                Ver Todo o Histórico
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
