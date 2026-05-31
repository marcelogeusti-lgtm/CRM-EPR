'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Eye,
  RefreshCcw,
  Target,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Wallet
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

export default function DashboardPage() {
  // Chart Data: MRR Growth & Cashflow (Entradas vs Saídas)
  const chartData = [
    { name: 'Jan', entradas: 42000, saidas: 18000, mrr: 31000 },
    { name: 'Fev', entradas: 48000, saidas: 21000, mrr: 35000 },
    { name: 'Mar', entradas: 51000, saidas: 19500, mrr: 42000 },
    { name: 'Abr', entradas: 62000, saidas: 24000, mrr: 58000 },
    { name: 'Mai', entradas: 78500, saidas: 28000, mrr: 72000 },
    { name: 'Jun', entradas: 89000, saidas: 29500, mrr: 84000 },
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 text-left bg-[#1a1f24] min-h-screen">
      
      {/* Título e Filtros */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 mt-4">
        <div>
          <h1 className="text-[22px] font-bold text-zinc-100 tracking-tight">Visão Geral</h1>
          <p className="text-[11px] text-zinc-500 font-medium mt-1">Sua central de controle estratégico e financeiro.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-500 font-bold mb-1 ml-1 absolute -mt-4">Período</span>
            <select className="bg-[#222831] border border-[#2a313c] text-zinc-200 rounded-md px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#10a37f] w-40 appearance-none">
              <option>Últimos 30 Dias</option>
              <option>Este Mês</option>
              <option>Este Ano</option>
            </select>
          </div>

          <button className="bg-[#0f8b65] hover:bg-[#0c7354] text-white px-5 py-2 rounded-md text-xs font-bold transition-colors shadow-sm flex items-center gap-2 mt-1">
            Atualizar <RefreshCcw className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Cards de Métricas Principais (SaaS & CRM) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <div className="bg-[#222831] border-l-2 border-l-[#10a37f] rounded-lg p-5 flex flex-col justify-between h-28 shadow-sm group">
          <div className="flex justify-between items-center">
            <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-widest">Receita Recorrente (MRR)</div>
            <RefreshCcw className="size-3.5 text-[#10a37f] opacity-50" />
          </div>
          <div className="flex items-end justify-between mt-auto">
            <div className="text-2xl font-bold text-zinc-100">{formatCurrency(84000)}</div>
            <div className="flex items-center gap-1 text-[10px] text-[#10a37f] font-bold bg-[#10a37f]/10 px-1.5 py-0.5 rounded">
              <ArrowUpRight className="size-3" /> +16%
            </div>
          </div>
        </div>

        {/* Faturamento Bruto */}
        <div className="bg-[#222831] border-l-2 border-l-blue-500 rounded-lg p-5 flex flex-col justify-between h-28 shadow-sm group">
          <div className="flex justify-between items-center">
            <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-widest">Faturamento Bruto</div>
            <DollarSign className="size-3.5 text-blue-500 opacity-50" />
          </div>
          <div className="flex items-end justify-between mt-auto">
            <div className="text-2xl font-bold text-zinc-100">{formatCurrency(142500)}</div>
            <div className="flex items-center gap-1 text-[10px] text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded">
              <ArrowUpRight className="size-3" /> +8%
            </div>
          </div>
        </div>

        {/* Lucro / Caixa Livre */}
        <div className="bg-[#222831] border-l-2 border-l-purple-500 rounded-lg p-5 flex flex-col justify-between h-28 shadow-sm group">
          <div className="flex justify-between items-center">
            <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-widest">Caixa Livre</div>
            <Wallet className="size-3.5 text-purple-500 opacity-50" />
          </div>
          <div className="flex items-end justify-between mt-auto">
            <div className="text-2xl font-bold text-zinc-100">{formatCurrency(54000)}</div>
            <div className="text-[11px] text-zinc-500 font-medium">Margem 37%</div>
          </div>
        </div>

        {/* Conversão de Vendas */}
        <div className="bg-[#222831] border-l-2 border-l-amber-500 rounded-lg p-5 flex flex-col justify-between h-28 shadow-sm group">
          <div className="flex justify-between items-center">
            <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-widest">Conversão de Leads</div>
            <Target className="size-3.5 text-amber-500 opacity-50" />
          </div>
          <div className="flex items-end justify-between mt-auto">
            <div className="text-2xl font-bold text-zinc-100">28.4%</div>
            <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
              <ArrowDownRight className="size-3" /> -1.2%
            </div>
          </div>
        </div>
      </div>

      {/* Grid Meio: Gráfico de Receita vs Despesa e Tabela Financeira */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Gráfico Financeiro (MRR + Fluxo) */}
        <div className="lg:col-span-2 bg-[#222831] rounded-lg shadow-sm border border-[#2a313c] p-6 h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-semibold text-zinc-200">Evolução de MRR e Fluxo de Caixa</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2"><div className="size-2 rounded-full bg-[#10a37f]" /><span className="text-[10px] text-zinc-400 uppercase tracking-widest">MRR</span></div>
              <div className="flex items-center gap-2"><div className="size-2 rounded-full bg-blue-500" /><span className="text-[10px] text-zinc-400 uppercase tracking-widest">Entradas</span></div>
              <div className="flex items-center gap-2"><div className="size-2 rounded-full bg-red-500" /><span className="text-[10px] text-zinc-400 uppercase tracking-widest">Saídas</span></div>
            </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10a37f" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10a37f" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a313c" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#71717a', fontSize: 10}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#71717a', fontSize: 10}} 
                  dx={-10}
                  tickFormatter={(value) => `R$${value/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1f24', borderColor: '#2a313c', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                  itemStyle={{ color: '#e4e4e7' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Area type="monotone" dataKey="saidas" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorSaidas)" />
                <Area type="monotone" dataKey="entradas" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorEntradas)" />
                <Area type="monotone" dataKey="mrr" stroke="#10a37f" strokeWidth={3} fillOpacity={1} fill="url(#colorMrr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabela de Distribuição de Receitas (Meios de Pagamento) */}
        <div className="bg-[#222831] rounded-lg shadow-sm border border-[#2a313c] flex flex-col">
          <div className="p-5 border-b border-[#2a313c]">
            <h3 className="text-sm font-semibold text-zinc-200">Formas de Pagamento</h3>
            <p className="text-[10px] text-zinc-500 mt-1">Distribuição das entradas liquidadas</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#2a313c]">
                  <th className="py-3 px-5 text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Método</th>
                  <th className="py-3 px-5 text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Transações</th>
                  <th className="py-3 px-5 text-[10px] text-zinc-500 uppercase tracking-widest font-medium text-right">Volume</th>
                </tr>
              </thead>
              <tbody className="text-xs text-zinc-300 font-semibold divide-y divide-[#2a313c]/50">
                {[
                  { name: 'Pix', count: 1420, val: 82500, icon: '❖' },
                  { name: 'Cartão de Crédito', count: 850, val: 45000, icon: '💳' },
                  { name: 'Boleto Bancário', count: 120, val: 15000, icon: '|||' },
                  { name: 'Transferência (TED)', count: 5, val: 0, icon: '🏦' }
                ].map((method, i) => (
                  <tr key={i} className="hover:bg-[#2a313c]/30 transition-colors">
                    <td className="py-4 px-5 flex items-center gap-3">
                      <div className="text-zinc-500 w-5 text-center text-sm">{method.icon}</div>
                      <span>{method.name}</span>
                    </td>
                    <td className="py-4 px-5 text-zinc-400">{method.count}</td>
                    <td className="py-4 px-5 text-right font-bold text-zinc-100">{formatCurrency(method.val)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
