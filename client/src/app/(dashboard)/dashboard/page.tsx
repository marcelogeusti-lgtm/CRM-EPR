'use client';

import React from 'react';
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
  // Dados coerentes para testes iniciais
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
            <select className="bg-[#222831] border border-[#2a313c] text-zinc-200 rounded-md px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#3b82f6] w-40 appearance-none">
              <option>Últimos 30 Dias</option>
              <option>Este Mês</option>
              <option>Este Ano</option>
            </select>
          </div>

          <button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-5 py-2 rounded-md text-xs font-bold transition-colors shadow-sm flex items-center gap-2 mt-1 cursor-pointer">
            Atualizar <RefreshCcw className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <div className="bg-[#222831] border-l-2 border-l-[#3b82f6] rounded-lg p-5 flex flex-col justify-between h-28 shadow-sm group">
          <div className="flex justify-between items-center">
            <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-widest">Receita Recorrente (MRR)</div>
            <RefreshCcw className="size-3.5 text-[#3b82f6] opacity-50" />
          </div>
          <div className="flex items-end justify-between mt-auto">
            <div className="text-2xl font-bold text-zinc-100">{formatCurrency(4800)}</div>
            <div className="flex items-center gap-1 text-[10px] text-[#3b82f6] font-bold bg-[#3b82f6]/10 px-1.5 py-0.5 rounded">
              <ArrowUpRight className="size-3" /> +12%
            </div>
          </div>
        </div>

        {/* Faturamento Bruto */}
        <div className="bg-[#222831] border-l-2 border-l-blue-400 rounded-lg p-5 flex flex-col justify-between h-28 shadow-sm group">
          <div className="flex justify-between items-center">
            <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-widest">Faturamento Bruto</div>
            <DollarSign className="size-3.5 text-blue-400 opacity-50" />
          </div>
          <div className="flex items-end justify-between mt-auto">
            <div className="text-2xl font-bold text-zinc-100">{formatCurrency(5900)}</div>
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
            <div className="text-2xl font-bold text-zinc-100">{formatCurrency(4100)}</div>
            <div className="text-[11px] text-zinc-500 font-medium">Margem 69%</div>
          </div>
        </div>

        {/* Conversão de Vendas */}
        <div className="bg-[#222831] border-l-2 border-l-amber-500 rounded-lg p-5 flex flex-col justify-between h-28 shadow-sm group">
          <div className="flex justify-between items-center">
            <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-widest">Conversão de Leads</div>
            <Target className="size-3.5 text-amber-500 opacity-50" />
          </div>
          <div className="flex items-end justify-between mt-auto">
            <div className="text-2xl font-bold text-zinc-100">14.2%</div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
              <ArrowUpRight className="size-3" /> +2.1%
            </div>
          </div>
        </div>
      </div>

      {/* Grid Meio: Gráfico de Receita vs Despesa e Tabela Financeira */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Gráfico Financeiro */}
        <div className="lg:col-span-2 bg-[#222831] rounded-lg shadow-sm border border-[#2a313c] p-6 h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-semibold text-zinc-200">Evolução de MRR e Fluxo de Caixa</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2"><div className="size-2 rounded-full bg-[#3b82f6]" /><span className="text-[10px] text-zinc-400 uppercase tracking-widest">MRR</span></div>
              <div className="flex items-center gap-2"><div className="size-2 rounded-full bg-emerald-500" /><span className="text-[10px] text-zinc-400 uppercase tracking-widest">Entradas</span></div>
              <div className="flex items-center gap-2"><div className="size-2 rounded-full bg-red-500" /><span className="text-[10px] text-zinc-400 uppercase tracking-widest">Saídas</span></div>
            </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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
                <Area type="monotone" dataKey="entradas" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorEntradas)" />
                <Area type="monotone" dataKey="mrr" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMrr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabela de Distribuição */}
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
                  <th className="py-3 px-5 text-[10px] text-zinc-500 uppercase tracking-widest font-medium text-right">Volume</th>
                </tr>
              </thead>
              <tbody className="text-xs text-zinc-300 font-semibold divide-y divide-[#2a313c]/50">
                {[
                  { name: 'Pix', count: 14, val: 3250, icon: '❖' },
                  { name: 'Cartão de Crédito', count: 8, val: 2650, icon: '💳' },
                  { name: 'Boleto Bancário', count: 1, val: 0, icon: '|||' },
                ].map((method, i) => (
                  <tr key={i} className="hover:bg-[#2a313c]/30 transition-colors">
                    <td className="py-4 px-5 flex items-center gap-3">
                      <div className="text-[#3b82f6] w-5 text-center text-sm">{method.icon}</div>
                      <div>
                        <span>{method.name}</span>
                        <div className="text-[9px] text-zinc-500 mt-0.5">{method.count} vendas</div>
                      </div>
                    </td>
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
