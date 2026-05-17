'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, TrendingUp, DollarSign, Users, Target, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

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
    <div className="flex-1 p-8 overflow-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
              <BarChart3 className="h-10 w-10 text-blue-500" />
              Relatórios Executivos
            </h1>
            <p className="text-gray-400 mt-2 text-lg">
              Insights e dados estratégicos gerados por Inteligência Artificial.
            </p>
          </div>
          <button 
            onClick={fetchReport}
            disabled={loading}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all flex items-center gap-2"
          >
            <Sparkles className="h-5 w-5 text-blue-400" />
            {loading ? 'Analisando dados...' : 'Atualizar IA'}
          </button>
        </div>

        {/* AI Executive Summary Box */}
        {loading ? (
          <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-3xl p-8 shadow-[0_0_30px_rgba(37,99,235,0.1)] relative overflow-hidden animate-pulse">
            <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-white/5 rounded w-full mb-2"></div>
            <div className="h-4 bg-white/5 rounded w-5/6"></div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-3xl p-8 shadow-[0_0_30px_rgba(37,99,235,0.1)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-50"></div>
            <div className="flex gap-6 items-start">
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center shrink-0 border border-blue-400/30 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                <Sparkles className="h-8 w-8 text-blue-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                  Resumo Estratégico Diário (IA)
                  <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 rounded-md border border-purple-500/30">Gemini Powered</span>
                </h3>
                <p className="text-lg text-blue-100/80 leading-relaxed font-light">
                  "{data?.aiSummary}"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#111111]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <p className="text-gray-400 text-sm font-medium mb-1 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-400" /> MRR Atual
            </p>
            <h3 className="text-3xl font-bold text-white">
              {loading ? '...' : formatCurrency(data?.stats.summary.mrr || 0)}
            </h3>
          </div>

          <div className="bg-[#111111]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <p className="text-gray-400 text-sm font-medium mb-1 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-400" /> Valor no Pipeline
            </p>
            <h3 className="text-3xl font-bold text-white">
              {loading ? '...' : formatCurrency(data?.stats.summary.pipelineValue || 0)}
            </h3>
          </div>

          <div className="bg-[#111111]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <p className="text-gray-400 text-sm font-medium mb-1 flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-400" /> Negócios Ativos
            </p>
            <h3 className="text-3xl font-bold text-white">
              {loading ? '...' : data?.stats.summary.activeDeals || 0}
            </h3>
          </div>

          <div className="bg-[#111111]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <p className="text-gray-400 text-sm font-medium mb-1 flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-400" /> Novos Leads
            </p>
            <h3 className="text-3xl font-bold text-white">
              {loading ? '...' : data?.stats.summary.newContacts || 0}
            </h3>
          </div>
        </div>

      </div>
    </div>
  );
}
