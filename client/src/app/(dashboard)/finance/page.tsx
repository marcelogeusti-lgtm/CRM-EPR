'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Wallet, 
  Plus, 
  Download,
  Search,
  SlidersHorizontal
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/system/PageHeader';
import { StatsCard } from '@/components/system/StatsCard';
import { motion } from 'framer-motion';

export default function FinancePage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/finance/dashboard`);
        setData(response.data);
      } catch (error) {
        console.error(error);
        setData({
          summary: {
            totalIncome: 125000,
            totalExpense: 15400,
            balance: 109600,
            pendingAmount: 1021
          },
          recentTransactions: [
            { id: '1', createdAt: new Date().toISOString(), description: 'Venda de Mentoria - Marcelo', type: 'INCOME', amount: 997, status: 'COMPLETED' },
            { id: '2', createdAt: new Date().toISOString(), description: 'Gateway Fee Asaas', type: 'EXPENSE', amount: 15.4, status: 'COMPLETED' }
          ]
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  if (isLoading) return <div className="text-zinc-500 p-8">Carregando dados financeiros...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* PageHeader unificado */}
      <PageHeader 
        title="Fluxo de Caixa & Finanças"
        description="Acompanhe seus faturamentos, despesas e transações consolidadas."
        actions={
          <div className="flex gap-2">
            <button className="h-11 px-4 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold rounded-xl border border-zinc-200 text-sm transition-colors shadow-sm flex items-center gap-1.5">
              <Download className="size-4 text-zinc-400" /> Exportar Relatório
            </button>
            <button className="h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition-colors shadow-sm flex items-center gap-1.5">
              <Plus className="size-4" /> Nova Transação
            </button>
          </div>
        }
      />

      {/* Grid de StatsCard Financeiros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Receita Total"
          value={formatCurrency(data?.summary?.totalIncome)}
          icon={ArrowUpCircle}
        />
        <StatsCard 
          title="Despesas Totais"
          value={formatCurrency(data?.summary?.totalExpense)}
          icon={ArrowDownCircle}
        />
        <StatsCard 
          title="Saldo Atual"
          value={formatCurrency(data?.summary?.balance)}
          icon={Wallet}
        />
        <StatsCard 
          title="Faturamento Pendente"
          value={formatCurrency(data?.summary?.pendingAmount)}
          icon={DollarSign}
        />
      </div>

      {/* Tabela de Transações */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden"
      >
        <CardHeader className="flex flex-col md:flex-row items-center justify-between border-b border-zinc-100 p-6 bg-zinc-50/50 gap-4">
          <CardTitle className="text-zinc-800 font-bold text-base">Transações Recentes</CardTitle>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-2.5 size-4 text-zinc-400" />
              <input 
                placeholder="Buscar transações..." 
                className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-3 h-9 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" 
              />
            </div>
            <button className="size-9 bg-white hover:bg-zinc-50 text-zinc-600 rounded-xl transition-all border border-zinc-200 flex items-center justify-center shadow-sm">
              <SlidersHorizontal className="size-4 text-zinc-400" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-400 text-xs font-bold uppercase tracking-wider bg-zinc-50/20">
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4">Valor</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-zinc-600 text-sm divide-y divide-zinc-50">
                {data?.recentTransactions?.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-zinc-50/30 transition-colors">
                    <td className="px-6 py-4 text-xs text-zinc-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-bold text-zinc-800">{tx.description || 'Venda de Produto'}</td>
                    <td className="px-6 py-4">
                      <Badge className="bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-50 text-[10px] font-bold py-0.5 px-2 rounded-full">
                        Vendas
                      </Badge>
                    </td>
                    <td className={`px-6 py-4 font-extrabold ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'} {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                        tx.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        tx.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {tx.status === 'COMPLETED' ? 'Concluído' : tx.status === 'PENDING' ? 'Pendente' : 'Cancelado'}
                      </span>
                    </td>
                  </tr>
                ))}
                {data?.recentTransactions?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 italic">Nenhuma transação encontrada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </motion.div>
    </div>
  );
}
