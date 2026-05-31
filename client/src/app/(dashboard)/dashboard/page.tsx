'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Eye,
  RefreshCcw,
  Users
} from 'lucide-react';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer 
} from 'recharts';

export default function DashboardPage() {
  // Chart Dummy Data
  const chartData = [
    { time: '00:00', value: 0 },
    { time: '04:00', value: 0 },
    { time: '08:00', value: 0 },
    { time: '12:00', value: 0 },
    { time: '16:00', value: 0 },
    { time: '20:00', value: 0 },
    { time: '23:00', value: 0 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 text-left bg-[#1a1f24] min-h-screen">
      
      {/* Banner Superior Verde */}
      <div className="w-full bg-gradient-to-r from-[#17462a] via-[#105634] to-[#1a1f24] rounded-xl p-4 flex items-center justify-between border border-[#1a4a32] shadow-sm relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute left-10 top-0 w-64 h-64 bg-[#21c55d]/10 blur-[80px] rounded-full mix-blend-screen pointer-events-none" />
        
        <div className="flex items-center gap-12 z-10">
          <h2 className="text-2xl font-black text-[#4ade80] tracking-tighter uppercase ml-6" style={{ textShadow: '0 2px 10px rgba(74,222,128,0.2)'}}>
            Você no Controle.
          </h2>
          <div className="bg-[#0f4d2c] border border-[#1b6b3e] px-4 py-2 rounded-full flex items-center gap-2 shadow-inner">
            <Users className="size-5 text-[#4ade80]" />
            <span className="text-sm font-semibold text-[#4ade80]">Equipe</span>
            <div className="size-5 rounded-full border border-[#4ade80] flex items-center justify-center ml-2">
              <div className="size-2 bg-[#4ade80] rounded-full animate-pulse" />
            </div>
          </div>
        </div>
        <div className="text-zinc-300 text-sm font-medium pr-12 z-10 leading-snug">
          Gerencie quem acessa sua<br/>dashboard. Sem senha. Sem risco.
        </div>
      </div>

      {/* Título e Filtros */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 mt-8">
        <div>
          <h1 className="text-[22px] font-bold text-zinc-100 tracking-tight">Dashboard</h1>
          <p className="text-[11px] text-zinc-500 font-medium mt-1">Última atualização: 31/05/2026 às 13:49</p>
        </div>

        <div className="flex items-center gap-3">
          <select className="bg-[#222831] border border-[#2a313c] text-zinc-400 rounded-md px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#10a37f] w-40 appearance-none">
            <option>Tipo</option>
          </select>

          <select className="bg-[#222831] border border-[#2a313c] text-zinc-400 rounded-md px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#10a37f] w-48 appearance-none">
            <option>Produtos</option>
          </select>

          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-500 font-bold mb-1 ml-1 absolute -mt-4">Período</span>
            <select className="bg-[#222831] border border-[#2a313c] text-zinc-200 rounded-md px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#10a37f] w-40 appearance-none">
              <option>Hoje</option>
            </select>
          </div>

          <button className="bg-[#0f8b65] hover:bg-[#0c7354] text-white px-5 py-2 rounded-md text-xs font-bold transition-colors shadow-sm flex items-center gap-2">
            Atualizar <RefreshCcw className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Cards Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1 */}
        <div className="bg-[#222831] border-l-2 border-l-[#10a37f] rounded-lg p-5 flex flex-col justify-between h-28 shadow-sm">
          <div className="text-[11px] text-zinc-400 font-medium">Vendas realizadas</div>
          <div className="flex items-end justify-between mt-auto">
            <div className="text-2xl font-bold text-zinc-100">R$ 0,00</div>
            <Eye className="size-4 text-zinc-500 cursor-pointer hover:text-zinc-300" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#222831] border-l-2 border-l-[#10a37f] rounded-lg p-5 flex flex-col justify-between h-28 shadow-sm">
          <div className="text-[11px] text-zinc-400 font-medium">Quantidade de vendas</div>
          <div className="flex items-end justify-between mt-auto">
            <div className="text-2xl font-bold text-zinc-100">0</div>
            <Eye className="size-4 text-zinc-500 cursor-pointer hover:text-zinc-300" />
          </div>
        </div>
      </div>

      {/* Grid Meio: Tabela e Sidecard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Tabela Meios de Pagamento */}
        <div className="lg:col-span-2 bg-[#222831] rounded-lg shadow-sm border border-[#2a313c]">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#2a313c]">
                <th className="py-4 px-5 text-[11px] text-zinc-400 font-medium w-1/2">Meios de Pagamento</th>
                <th className="py-4 px-5 text-[11px] text-zinc-400 font-medium">Conversão</th>
                <th className="py-4 px-5 text-[11px] text-zinc-400 font-medium flex items-center gap-2">
                  Valor <Eye className="size-3.5 cursor-pointer hover:text-zinc-200" />
                </th>
              </tr>
            </thead>
            <tbody className="text-xs text-zinc-200 font-semibold divide-y divide-[#2a313c]/50">
              {[
                { name: 'Pix', icon: '❖' },
                { name: 'Boleto', icon: '|||' },
                { name: 'Cartão de crédito', icon: '💳' },
                { name: 'Pic Pay', icon: 'P' },
                { name: 'Apple Pay', icon: '' },
                { name: 'Google Pay', icon: 'G' },
                { name: '3DS', icon: '💳' },
                { name: 'PIX Automático', icon: '❖' }
              ].map((method, i) => (
                <tr key={i} className="hover:bg-[#2a313c]/30 transition-colors">
                  <td className="py-3.5 px-5 flex items-center gap-3">
                    <div className="text-zinc-400 w-5 text-center">{method.icon}</div>
                    <span>{method.name}</span>
                  </td>
                  <td className="py-3.5 px-5 text-zinc-400">0%</td>
                  <td className="py-3.5 px-5">R$ 0,00</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Card Side Metrics */}
        <div className="bg-[#222831] rounded-lg shadow-sm border border-[#2a313c] p-5 space-y-6">
          {[
            { label: 'Abandono C.', val: '0' },
            { label: 'Reembolso', val: '0%' },
            { label: 'Charge Back', val: '0%' },
            { label: 'MED', val: '0%' },
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-start">
              <div>
                <div className="text-[11px] text-zinc-400 font-medium">{item.label}</div>
                <div className="text-base font-bold text-zinc-100 mt-1">{item.val}</div>
              </div>
              <Eye className="size-4 text-zinc-500 cursor-pointer hover:text-zinc-300 mt-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico Inferior */}
      <div className="bg-[#222831] rounded-lg shadow-sm border border-[#2a313c] p-6 h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10a37f" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10a37f" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a313c" />
            <XAxis 
              dataKey="time" 
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
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#10a37f" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorValue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
