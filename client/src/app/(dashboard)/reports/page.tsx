'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, DollarSign, Users, Target, Sparkles, TrendingUp, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/system/PageHeader';
import { StatsCard } from '@/components/system/StatsCard';
import { motion } from 'framer-motion';

interface AIReportData {
  stats: {
    summary: {
      mrr: number;
      activeDeals: number;
      pipelineValue: number;
      newContacts: number;
    };
    trends: any[];
  };
  aiSummary: string;
}

export default function ReportsPage() {
  const [data, setData] = useState<AIReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await axios.get(`${apiUrl}/analytics/report`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar relatório com IA');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* PageHeader com botão de carregar */}
      <PageHeader 
        title="Relatórios Executivos"
        description="Acompanhe insights e dados estratégicos compilados por nossa Inteligência Artificial."
        actions={
          <button 
            onClick={fetchReport}
            disabled={loading}
            className="h-11 px-5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-medium rounded-xl transition-all shadow-sm flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="size-4 animate-spin text-zinc-400" />
            ) : (
              <Sparkles className="size-4 text-blue-500" />
            )}
            {loading ? 'Analisando...' : 'Reavaliar IA'}
          </button>
        }
      />

      {/* Sumário Estratégico com IA - Estilo Kirvano/Fintech Premium */}
      {loading ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm animate-pulse space-y-4">
          <div className="h-5 bg-zinc-100 rounded w-1/4"></div>
          <div className="h-4 bg-zinc-50 rounded w-full"></div>
          <div className="h-4 bg-zinc-50 rounded w-5/6"></div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white border border-zinc-200 border-l-4 border-l-blue-600 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-5 items-start"
        >
          <div className="size-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Sparkles className="size-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-zinc-900 text-lg">Resumo Estratégico Diário (IA)</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded">
                Gemini Powered
              </span>
            </div>
            <p className="text-zinc-600 leading-relaxed text-sm md:text-base font-normal">
              "{data?.aiSummary}"
            </p>
          </div>
        </motion.div>
      )}

      {/* Grid de Métricas usando StatsCard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard 
          title="Receita Mensal (MRR)"
          value={loading ? '...' : formatCurrency(data?.stats.summary.mrr || 0)}
          icon={DollarSign}
        />
        <StatsCard 
          title="Valor em Pipeline"
          value={loading ? '...' : formatCurrency(data?.stats.summary.pipelineValue || 0)}
          icon={TrendingUp}
        />
        <StatsCard 
          title="Negócios Ativos"
          value={loading ? '...' : (data?.stats.summary.activeDeals || 0)}
          icon={Target}
        />
        <StatsCard 
          title="Novos Contatos"
          value={loading ? '...' : (data?.stats.summary.newContacts || 0)}
          icon={Users}
        />
      </div>

    </div>
  );
}
