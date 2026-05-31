'use client';

import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical,
  CheckCircle2,
  Clock,
  XCircle,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState('receivable');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Transações simuladas com valores baixos (fase inicial)
  const transactions = [
    { id: 1, type: 'IN', title: 'Mensalidade - Cliente A', amount: 1500, date: 'Hoje', status: 'PAID', method: 'Pix' },
    { id: 2, type: 'IN', title: 'Setup - Empresa B', amount: 850, date: 'Hoje', status: 'PENDING', method: 'Boleto' },
    { id: 3, type: 'OUT', title: 'Hospedagem AWS', amount: 350, date: 'Ontem', status: 'PAID', method: 'Cartão' },
    { id: 4, type: 'IN', title: 'Consultoria Avulsa', amount: 900, date: 'Amanhã', status: 'PENDING', method: 'Pix' },
    { id: 5, type: 'OUT', title: 'Anúncios Google', amount: 400, date: 'Dia 15', status: 'OVERDUE', method: 'Cartão' },
  ];

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PAID':
        return <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20"><CheckCircle2 className="size-3" /> Liquidado</span>;
      case 'PENDING':
        return <span className="flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded border border-amber-500/20"><Clock className="size-3" /> Pendente</span>;
      case 'OVERDUE':
        return <span className="flex items-center gap-1 text-[10px] bg-red-500/10 text-red-400 font-bold px-2 py-0.5 rounded border border-red-500/20"><XCircle className="size-3" /> Atrasado</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 text-left bg-[#1a1f24] min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 mt-4">
        <div>
          <h1 className="text-[22px] font-bold text-zinc-100 tracking-tight">Financeiro (ERP)</h1>
          <p className="text-[11px] text-zinc-500 font-medium mt-1">Gestão de Contas a Receber, Pagar e Fluxo de Caixa.</p>
        </div>

        <div className="flex gap-2">
          <Button className="bg-[#222831] hover:bg-[#2a313c] text-zinc-200 border border-[#2a313c] px-4 h-9 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-2">
            <FileText className="size-3.5" /> Emitir NF
          </Button>
          <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 h-9 rounded-md text-xs font-bold transition-colors shadow-sm cursor-pointer border-none flex items-center gap-2">
            <Plus className="size-3.5" /> Nova Fatura
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#222831] border-t-2 border-t-emerald-500 rounded-lg p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <ArrowUpRight className="size-4 text-emerald-500" />
              </div>
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">A Receber Hoje</span>
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-zinc-100">{formatCurrency(2350)}</h2>
          <p className="text-[10px] text-zinc-500 mt-1 font-medium">De 3 faturas pendentes</p>
        </div>

        <div className="bg-[#222831] border-t-2 border-t-red-500 rounded-lg p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-red-500/10 flex items-center justify-center">
                <ArrowDownRight className="size-4 text-red-500" />
              </div>
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">A Pagar Hoje</span>
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-zinc-100">{formatCurrency(750)}</h2>
          <p className="text-[10px] text-zinc-500 mt-1 font-medium">De 2 obrigações pendentes</p>
        </div>

        <div className="bg-[#222831] border-t-2 border-t-[#3b82f6] rounded-lg p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-[#3b82f6]/10 flex items-center justify-center">
                <DollarSign className="size-4 text-[#3b82f6]" />
              </div>
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Saldo em Conta</span>
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-zinc-100">{formatCurrency(4100)}</h2>
          <p className="text-[10px] text-emerald-400 mt-1 font-bold">+ {formatCurrency(1600)} Previsto (24h)</p>
        </div>
      </div>

      {/* Tabs e Tabela */}
      <div className="bg-[#222831] rounded-lg shadow-sm border border-[#2a313c] flex flex-col">
        
        {/* Controles */}
        <div className="p-4 border-b border-[#2a313c] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-2 w-full sm:w-auto p-1 bg-[#1a1f24] rounded-lg border border-[#2a313c]">
            <button 
              onClick={() => setActiveTab('receivable')}
              className={`px-4 py-1.5 rounded-md text-[11px] font-bold transition-all flex-1 sm:flex-none cursor-pointer ${activeTab === 'receivable' ? 'bg-[#3b82f6] text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              A Receber (CRM)
            </button>
            <button 
              onClick={() => setActiveTab('payable')}
              className={`px-4 py-1.5 rounded-md text-[11px] font-bold transition-all flex-1 sm:flex-none cursor-pointer ${activeTab === 'payable' ? 'bg-[#3b82f6] text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              A Pagar (Despesas)
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Buscar lançamento..." 
                className="w-full bg-[#1a1f24] border border-[#2a313c] rounded-md pl-8 pr-3 h-8 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#3b82f6]"
              />
            </div>
            <button className="h-8 px-3 bg-[#1a1f24] border border-[#2a313c] text-zinc-400 rounded-md hover:text-zinc-200 transition-colors cursor-pointer flex items-center justify-center">
              <Filter className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#2a313c] text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                <th className="p-4 w-10">
                  <input type="checkbox" className="rounded border-zinc-700 bg-transparent" />
                </th>
                <th className="p-4">Descrição / Origem CRM</th>
                <th className="p-4">Vencimento</th>
                <th className="p-4">Método</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Valor</th>
                <th className="p-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="text-xs font-semibold text-zinc-300 divide-y divide-[#2a313c]/50">
              {transactions
                .filter(t => activeTab === 'receivable' ? t.type === 'IN' : t.type === 'OUT')
                .map(tx => (
                <tr key={tx.id} className="hover:bg-[#2a313c]/30 transition-colors group">
                  <td className="p-4">
                    <input type="checkbox" className="rounded border-zinc-700 bg-transparent" />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-1 h-8 rounded-full ${tx.type === 'IN' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                      <div>
                        <span className="text-zinc-200 font-bold block">{tx.title}</span>
                        {tx.type === 'IN' && <span className="text-[9px] text-[#3b82f6] font-bold">Ref: CRM-LEAD-489</span>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-zinc-400">{tx.date}</td>
                  <td className="p-4">
                    <span className="bg-[#1a1f24] border border-[#2a313c] text-zinc-400 px-2 py-0.5 rounded text-[10px]">{tx.method}</span>
                  </td>
                  <td className="p-4">{getStatusBadge(tx.status)}</td>
                  <td className={`p-4 text-right font-extrabold ${tx.type === 'IN' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.type === 'IN' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-zinc-600 hover:text-zinc-300 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Footer Tabela */}
        <div className="p-3 border-t border-[#2a313c] text-center text-[10px] text-zinc-500 font-medium">
          Exibindo lançamentos conciliados com gateway Asaas
        </div>
      </div>

    </div>
  );
}
