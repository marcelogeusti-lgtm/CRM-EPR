'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/analytics/dashboard`);
        setStats(response.data);
      } catch (error) {
        console.warn("Backend indisponível. Carregando dados de demonstração.", error);
        setStats({
          summary: { mrr: 15400, activeDeals: 42, pipelineValue: 125000, newContacts: 128 },
          trends: [
            { month: 'Jan', value: 4000 },
            { month: 'Fev', value: 5500 },
            { month: 'Mar', value: 8000 },
            { month: 'Abr', value: 7500 },
            { month: 'Mai', value: 11000 },
            { month: 'Jun', value: 15400 }
          ]
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  if (isLoading) return <div className="text-white p-8">Carregando métricas do painel...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Bem-vindo, Admin</h1>
          <p className="text-gray-400 mt-1">Aqui está o resumo da sua operação hoje.</p>
        </div>
        <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10 flex items-center gap-2 text-sm text-gray-400">
          <Clock className="h-4 w-4" />
          Atualizado em: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* 4 Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Receita Mensal (MRR)" 
          value={formatCurrency(stats.summary.mrr)} 
          icon={DollarSign} 
          trend="+12.5%" 
          trendUp={true} 
          color="blue"
        />
        <StatCard 
          title="Negócios Ativos" 
          value={stats.summary.activeDeals} 
          icon={Target} 
          trend="+3" 
          trendUp={true} 
          color="purple"
        />
        <StatCard 
          title="Valor em Pipeline" 
          value={formatCurrency(stats.summary.pipelineValue)} 
          icon={TrendingUp} 
          trend="-2.4%" 
          trendUp={false} 
          color="green"
        />
        <StatCard 
          title="Novos Contatos" 
          value={stats.summary.newContacts} 
          icon={Users} 
          trend="+48" 
          trendUp={true} 
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 glass-dark border-white/5">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Evolução de Faturamento
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.trends}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="month" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Side Summary */}
        <Card className="glass-dark border-white/5">
          <CardHeader>
            <CardTitle className="text-white text-lg">Distribuição de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <ProgressItem label="WhatsApp Leads" value={75} color="bg-green-500" />
              <ProgressItem label="Indicação" value={45} color="bg-blue-500" />
              <ProgressItem label="Orgânico" value={30} color="bg-purple-500" />
              <ProgressItem label="Anúncios" value={60} color="bg-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, trendUp, color }: any) {
  const colors: any = {
    blue: 'bg-blue-500/10 text-blue-500',
    purple: 'bg-purple-500/10 text-purple-500',
    green: 'bg-green-500/10 text-green-500',
    orange: 'bg-orange-500/10 text-orange-500',
  };

  return (
    <Card className="glass-dark border-white/5 group hover:border-white/10 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className={cn("p-3 rounded-xl", colors[color])}>
            <Icon className="h-6 w-6" />
          </div>
          <div className={cn(
            "flex items-center text-xs font-bold px-2 py-1 rounded-full",
            trendUp ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
          )}>
            {trendUp ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
            {trend}
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1 group-hover:scale-105 transition-transform origin-left duration-300">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressItem({ label, value, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-semibold">{value}%</span>
      </div>
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full", color)} 
          style={{ width: `${value}%` }} 
        />
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
