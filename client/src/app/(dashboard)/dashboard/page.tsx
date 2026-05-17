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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
  Award
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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
          summary: { mrr: 15400, activeDeals: 42, pipelineValue: 125000, newContacts: 128 },
          trends: [
            { month: '17 de abr.', value: 0 },
            { month: '21 de abr.', value: 0 },
            { month: '28 de abr.', value: 0 },
            { month: '04 de mai.', value: 0 },
            { month: '12 de mai.', value: 0 },
            { month: '16 de mai.', value: 80 },
            { month: '17 de mai.', value: 10 }
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Banner Superior */}
      <div className="bg-[#0f172a] rounded-xl p-4 flex items-center shadow-sm">
        <div className="bg-blue-600 text-white rounded-lg px-4 py-2 flex items-center gap-2 font-bold whitespace-nowrap">
          <ShieldCheck className="h-5 w-5" />
          Complete seu cadastro
        </div>
        <p className="text-slate-300 ml-4 text-sm font-medium">
          para manter sua conta em conformidade com as exigências regulatórias.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 flex items-center gap-2 shadow-sm text-sm font-medium text-slate-600 cursor-pointer hover:bg-slate-50">
          <CalendarDays className="h-4 w-4 text-slate-400" />
          17/04/2026 - 17/05/2026
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="bg-white border border-slate-200 rounded-lg flex items-center px-3 py-2 shadow-sm w-full md:w-64 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
            <Search className="h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar produto..." 
              className="bg-transparent border-none outline-none w-full ml-2 text-sm text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <button className="bg-white border border-slate-200 rounded-lg p-2 shadow-sm hover:bg-slate-50 text-slate-500">
            <Eye className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Quatro Blocos Iniciais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Bloco 1: Saudação */}
        <Card className="shadow-sm border-slate-200 overflow-hidden bg-white">
          <CardContent className="p-5">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-3">Hoje é {today}</p>
            <h3 className="text-xl font-bold text-slate-800">Olá, {user?.name?.split(' ')[0] || 'Admin'} 👋</h3>
            <p className="text-xs text-slate-500 mt-2">Pequenas ações geram grandes resultados.</p>
          </CardContent>
        </Card>

        {/* Bloco 2: Saldo */}
        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <p className="text-sm font-medium text-slate-600 mb-2">Saldo disponível</p>
            <h3 className="text-2xl font-bold text-slate-900">R$ 1.250,99</h3>
            <div className="flex items-center gap-1 mt-auto pt-2 text-xs text-slate-500 font-medium">
              <CreditCard className="h-3.5 w-3.5" />
              <span>Pendente: R$ 10,21</span>
            </div>
          </CardContent>
        </Card>

        {/* Bloco 3: Vendas */}
        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <p className="text-sm font-medium text-slate-600 mb-2">Vendas aprovadas</p>
            <h3 className="text-2xl font-bold text-slate-900">42</h3>
            <div className="flex items-center gap-1 mt-auto pt-2 text-xs text-slate-500 font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Ticket médio: R$ 29,78</span>
            </div>
          </CardContent>
        </Card>

        {/* Bloco 4: Gamificação */}
        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="p-5">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm font-bold text-slate-800">Jornada de conquistas</p>
              <span className="text-xs text-blue-600 font-bold cursor-pointer hover:underline">Saiba mais ↗</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Você é</span>
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Award className="h-4 w-4 text-amber-500" /> Explorador
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Próximo nível</span>
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Award className="h-4 w-4 text-emerald-500" /> Avançado
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Gráfico Principal */}
        <Card className="lg:col-span-2 shadow-sm border-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <h3 className="font-bold text-slate-800 text-lg">Receita líquida</h3>
              <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" /> 100%
              </span>
            </div>
            
            <h2 className="text-3xl font-bold text-slate-900 mb-8">R$ 10,21</h2>

            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trends} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    tickFormatter={() => ''} // Hide Y axis numbers to match reference
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                    labelStyle={{ color: '#64748b', fontSize: '12px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#2563eb" 
                    strokeWidth={2.5}
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
        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
                Conversão de pagamento <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
              </h3>
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                <div className="w-1 h-1 rounded-full bg-slate-300"></div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Cartão */}
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                  <CreditCard className="h-4 w-4" /> Cartão de crédito
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-slate-900 w-8">45%</span>
                  <span className="text-xs text-slate-400 w-6">2/4</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
              </div>

              {/* PIX */}
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                  <SmartphoneNfc className="h-4 w-4" /> PIX
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-slate-900 w-8">80%</span>
                  <span className="text-xs text-slate-400 w-6">4/5</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                </div>
              </div>

              {/* Apple Pay */}
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                  <Apple className="h-4 w-4" /> Apple Pay
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-slate-900 w-8">0%</span>
                  <span className="text-xs text-slate-400 w-6">0/0</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Blocos Inferiores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Ideia em produto */}
        <Card className="md:col-span-1 shadow-sm border-slate-200 bg-white">
          <CardContent className="p-5 flex flex-col h-full">
            <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2">Transforme sua ideia em produto digital</h3>
            <p className="text-xs text-slate-500 mb-6">Do zero ao primeiro cliente: checklist acionável, modelos e tutoriais.</p>
            <button className="mt-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2 px-4 rounded-lg w-fit transition-colors">
              Acessar Blog ↗
            </button>
          </CardContent>
        </Card>

        {/* Central de Ajuda */}
        <Card className="md:col-span-1 shadow-sm border-slate-200 bg-white">
          <CardContent className="p-5 flex flex-col h-full">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Tire dúvidas</p>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-slate-400" />
              Central de <span className="text-slate-900">ajuda</span>
            </h3>
            <div className="flex gap-2 mb-6">
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">+50 artigos</span>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">Suporte</span>
            </div>
            <button className="mt-auto text-blue-600 font-bold text-sm w-fit hover:underline">
              Acessar ↗
            </button>
          </CardContent>
        </Card>

        {/* Afiliados */}
        <Card className="md:col-span-1 shadow-sm border-slate-200 bg-white">
          <CardContent className="p-5 flex flex-col h-full">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Lucre mais</p>
            <h3 className="font-bold text-slate-800 text-lg mb-6">
              Marketplace <br/> de <span className="text-slate-900">afiliados</span>
            </h3>
            <button className="mt-auto text-blue-600 font-bold text-sm w-fit hover:underline">
              Acessar ↗
            </button>
          </CardContent>
        </Card>

        {/* Saúde da conta */}
        <Card className="md:col-span-1 shadow-sm border-slate-200 bg-white">
          <CardContent className="p-5">
            <h3 className="font-bold text-slate-800 text-[15px] flex items-center gap-1.5 mb-6">
              <span className="text-2xl font-black">10</span> 
              A saúde da conta está ótima <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
            </h3>
            
            {/* Gráfico de saúde com as 4 cores */}
            <div className="relative pt-2">
              <div className="flex h-2.5 rounded-full overflow-hidden">
                <div className="bg-red-400" style={{ width: '25%' }}></div>
                <div className="bg-orange-300" style={{ width: '25%' }}></div>
                <div className="bg-emerald-200" style={{ width: '25%' }}></div>
                <div className="bg-emerald-600" style={{ width: '25%' }}></div>
              </div>
              {/* O marcador na faixa verde forte */}
              <div className="absolute top-0 left-[85%] w-1 h-6 bg-slate-800 -translate-x-1/2"></div>
            </div>

            <div className="flex justify-between mt-4">
              <div className="text-center">
                <p className="text-sm font-bold text-slate-900">0%</p>
                <p className="text-[10px] text-slate-500 font-medium">Chargeback</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-900">0%</p>
                <p className="text-[10px] text-slate-500 font-medium">MED</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-900">0%</p>
                <p className="text-[10px] text-slate-500 font-medium">Estorno</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
