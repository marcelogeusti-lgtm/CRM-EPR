'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
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
  HelpCircle,
  TrendingUp,
  Award,
  Users,
  Target,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/system/PageHeader';
import { StatsCard } from '@/components/system/StatsCard';
import { ProgressMetric } from '@/components/system/ProgressMetric';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/analytics/dashboard`);
        setStats(response.data);
      } catch (error) {
        setStats({
          summary: { 
            mrr: 15400, 
            activeDeals: 42, 
            pipelineValue: 125000, 
            newContacts: 128,
            totalInadimplente: 1850.00,
            countInadimplente: 3,
            orders: {
              total: 32,
              pending: 8,
              completed: 24,
              value: 48900
            }
          },
          trends: [
            { month: '17 de abr.', value: 12000 },
            { month: '21 de abr.', value: 13500 },
            { month: '28 de abr.', value: 13000 },
            { month: '04 de mai.', value: 14200 },
            { month: '12 de mai.', value: 15100 },
            { month: '16 de mai.', value: 15300 },
            { month: '17 de mai.', value: 15400 }
          ]
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) return <div className="text-slate-500 p-8">Carregando métricas...</div>;

  const today = new Date().toLocaleDateString('pt-BR', { month: 'long', day: 'numeric', year: 'numeric' });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Banner Superior */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#0f172a] rounded-xl p-4 flex items-center shadow-sm border border-zinc-800"
      >
        <div className="bg-blue-600 text-white rounded-lg px-4 py-2 flex items-center gap-2 font-bold whitespace-nowrap text-sm">
          <ShieldCheck className="size-4" />
          Complete seu cadastro
        </div>
        <p className="text-slate-300 ml-4 text-sm font-medium">
          para manter sua conta em conformidade com as exigências regulatórias.
        </p>
      </motion.div>

      {/* PageHeader unificado */}
      <PageHeader 
        title={`Bem-vindo, ${user?.name?.split(' ')[0] || 'Admin'} 👋`}
        description={`Hoje é ${today}. Pequenas ações geram grandes resultados.`}
        actions={
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="bg-white border border-zinc-200 rounded-lg px-4 py-2.5 flex items-center gap-2 shadow-sm text-sm font-medium text-zinc-600 cursor-pointer hover:bg-zinc-50 transition-colors">
              <CalendarDays className="size-[18px] text-zinc-400" />
              17/04/2026 - 17/05/2026
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="bg-white border border-zinc-200 rounded-lg flex items-center px-3 py-2 shadow-sm w-full md:w-64 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                <Search className="size-[18px] text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="Buscar produto..." 
                  className="bg-transparent border-none outline-none w-full ml-2 text-sm text-zinc-700 placeholder:text-zinc-400"
                />
              </div>
              <button className="bg-white border border-zinc-200 rounded-lg p-2 shadow-sm hover:bg-zinc-50 text-zinc-500 transition-colors">
                <Eye className="size-[18px]" />
              </button>
            </div>
          </div>
        }
      />

      {/* Grid de Cards de Métricas (Faturamento, OS, Inadimplentes, Funil e Conquistas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Bloco 1: Faturamento Mensal */}
        <StatsCard 
          title="Faturamento Mensal (MRR)"
          value={formatCurrency(stats.summary.mrr)}
          description="Receita líquida aprovada"
          icon={CreditCard}
          trend={{ value: "+18.4%", isUp: true }}
        />

        {/* Bloco 2: Ordens de Serviço (OS) */}
        <StatsCard 
          title="Ordens de Serviço (OS)"
          value={stats.summary.orders.total}
          description={`${stats.summary.orders.completed} concluídas • ${stats.summary.orders.pending} pendentes`}
          icon={FileText}
          trend={{ value: `R$ ${stats.summary.orders.value / 1000}k`, isUp: true }}
        />

        {/* Bloco 3: Inadimplência Vencida */}
        <StatsCard 
          title="Inadimplência (Vencidos)"
          value={formatCurrency(stats.summary.totalInadimplente || 0)}
          description={`${stats.summary.countInadimplente || 0} cobranças pendentes`}
          icon={AlertTriangle}
          trend={{ 
            value: stats.summary.countInadimplente > 0 ? "Atenção" : "Em dia", 
            isUp: stats.summary.countInadimplente === 0 
          }}
          className={stats.summary.countInadimplente > 0 ? "border-red-200/60 bg-red-50/5/30" : ""}
        />

        {/* Bloco 4: Pipeline / Funil */}
        <StatsCard 
          title="Valor do Funil"
          value={formatCurrency(stats.summary.pipelineValue)}
          description={`${stats.summary.activeDeals} negócios ativos`}
          icon={Target}
          trend={{ value: "+8.9%", isUp: true }}
        />

        {/* Bloco 5: Gamificação */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-6 hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full group"
        >
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-bold text-zinc-800">Jornada de conquistas</p>
            <span className="text-xs text-blue-600 font-bold cursor-pointer hover:underline">Saiba mais ↗</span>
          </div>
          <div className="space-y-3 mt-auto">
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500">Você é</span>
              <span className="font-semibold text-zinc-700 flex items-center gap-1">
                <Award className="size-[18px] text-amber-500" /> Explorador
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500">Próximo nível</span>
              <span className="font-semibold text-zinc-700 flex items-center gap-1">
                <Award className="size-[18px] text-emerald-500" /> Avançado
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Seção Gráfica e Conversões */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Gráfico Principal */}
        <Card className="lg:col-span-2 shadow-sm border-zinc-200 bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <h3 className="font-bold text-zinc-800 text-lg">Receita líquida</h3>
              <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2 py-1 rounded flex items-center gap-1 border border-emerald-100">
                <ArrowUpRight className="size-[14px]" /> 100%
              </span>
            </div>
            
            <h2 className="text-3xl font-bold text-zinc-900 mb-8">{formatCurrency(stats.summary.mrr)}</h2>

            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trends} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#71717a' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#71717a' }} 
                    tickFormatter={() => ''}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                    labelStyle={{ color: '#71717a', fontSize: '12px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#2563eb" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorNet)" 
                    activeDot={{ r: 6, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Conversões */}
        <Card className="shadow-sm border-zinc-200 bg-white rounded-2xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-zinc-800 flex items-center gap-1.5 text-base">
                Conversão de pagamento <HelpCircle className="size-4 text-zinc-400" />
              </h3>
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-zinc-300"></div>
                <div className="w-1 h-1 rounded-full bg-zinc-300"></div>
                <div className="w-1 h-1 rounded-full bg-zinc-300"></div>
              </div>
            </div>

            <div className="space-y-6">
              <ProgressMetric 
                label="Cartão de crédito"
                value={45}
                info="2/4"
                icon={CreditCard}
              />
              <ProgressMetric 
                label="PIX"
                value={80}
                info="4/5"
                icon={SmartphoneNfc}
              />
              <ProgressMetric 
                label="Apple Pay"
                value={0}
                info="0/0"
                icon={Apple}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Blocos Inferiores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Ideia em produto */}
        <Card className="md:col-span-1 shadow-sm border-zinc-200 bg-white rounded-2xl flex flex-col justify-between">
          <CardContent className="p-5 flex flex-col h-full justify-between">
            <div>
              <h3 className="font-bold text-zinc-800 text-lg leading-tight mb-2">Transforme sua ideia em produto</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">Do zero ao primeiro cliente: checklist acionável, modelos e tutoriais.</p>
            </div>
            <button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2 px-4 rounded-lg w-fit transition-colors">
              Acessar Blog ↗
            </button>
          </CardContent>
        </Card>

        {/* Central de Ajuda */}
        <Card className="md:col-span-1 shadow-sm border-zinc-200 bg-white rounded-2xl flex flex-col justify-between">
          <CardContent className="p-5 flex flex-col h-full justify-between">
            <div>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-2">Tire dúvidas</p>
              <h3 className="font-bold text-zinc-800 text-lg flex items-center gap-2 mb-4">
                Central de <span className="text-zinc-900">ajuda</span>
              </h3>
              <div className="flex gap-2">
                <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-50 px-2 py-1 rounded-full border border-zinc-200">+50 artigos</span>
                <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-50 px-2 py-1 rounded-full border border-zinc-200">Suporte</span>
              </div>
            </div>
            <button className="mt-6 text-blue-600 font-bold text-sm w-fit hover:underline">
              Acessar ↗
            </button>
          </CardContent>
        </Card>

        {/* Afiliados */}
        <Card className="md:col-span-1 shadow-sm border-zinc-200 bg-white rounded-2xl flex flex-col justify-between">
          <CardContent className="p-5 flex flex-col h-full justify-between">
            <div>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-2">Lucre mais</p>
              <h3 className="font-bold text-zinc-800 text-lg">
                Marketplace <br/> de <span className="text-zinc-900">afiliados</span>
              </h3>
            </div>
            <button className="mt-6 text-blue-600 font-bold text-sm w-fit hover:underline">
              Acessar ↗
            </button>
          </CardContent>
        </Card>

        {/* Saúde da conta */}
        <Card className="md:col-span-1 shadow-sm border-zinc-200 bg-white rounded-2xl">
          <CardContent className="p-5">
            <h3 className="font-bold text-zinc-800 text-[15px] flex items-center gap-1.5 mb-6">
              <span className="text-2xl font-black">10</span> 
              A saúde da conta está ótima <HelpCircle className="size-4 text-zinc-400" />
            </h3>
            
            <div className="relative pt-2">
              <div className="flex h-2.5 rounded-full overflow-hidden">
                <div className="bg-red-400" style={{ width: '25%' }}></div>
                <div className="bg-orange-300" style={{ width: '25%' }}></div>
                <div className="bg-emerald-200" style={{ width: '25%' }}></div>
                <div className="bg-emerald-600" style={{ width: '25%' }}></div>
              </div>
              <div className="absolute top-0 left-[85%] w-1 h-6 bg-zinc-800 -translate-x-1/2"></div>
            </div>

            <div className="flex justify-between mt-4">
              <div className="text-center">
                <p className="text-sm font-bold text-zinc-900">0%</p>
                <p className="text-[10px] text-zinc-500 font-medium">Chargeback</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-zinc-900">0%</p>
                <p className="text-[10px] text-zinc-500 font-medium">MED</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-zinc-900">0%</p>
                <p className="text-[10px] text-zinc-500 font-medium">Estorno</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
