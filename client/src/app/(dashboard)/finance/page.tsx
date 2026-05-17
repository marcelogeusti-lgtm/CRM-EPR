'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Wallet, 
  Plus, 
  Download,
  Search,
  Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

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
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  if (isLoading) return <div className="text-white">Carregando dados financeiros...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestão Financeira</h1>
          <p className="text-gray-400 mt-1">Monitore sua receita, despesas e fluxo de caixa.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
            <Download className="h-4 w-4 mr-2" /> Exportar
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
            <Plus className="h-4 w-4 mr-2" /> Nova Transação
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-dark border-white/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <ArrowUpCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Receita Total</p>
                <p className="text-xl font-bold text-white mt-0.5">{formatCurrency(data?.summary?.totalIncome)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-dark border-white/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <ArrowDownCircle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Despesas Totais</p>
                <p className="text-xl font-bold text-white mt-0.5">{formatCurrency(data?.summary?.totalExpense)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-dark border-white/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Wallet className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Saldo Atual</p>
                <p className="text-xl font-bold text-white mt-0.5">{formatCurrency(data?.summary?.balance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-dark border-white/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/10 rounded-xl">
                <DollarSign className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Pendente</p>
                <p className="text-xl font-bold text-white mt-0.5">{formatCurrency(data?.summary?.pendingAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-dark border-white/5">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
          <CardTitle className="text-white text-lg">Transações Recentes</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input placeholder="Buscar..." className="pl-9 h-9 w-64 bg-white/5 border-white/10 text-white text-sm" />
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9 border-white/10 text-white">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs text-gray-500 uppercase bg-white/5 font-semibold">
                <tr>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4">Valor</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data?.recentTransactions?.map((tx: any) => (
                  <tr key={tx.id} className="text-sm hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-white font-medium">{tx.description || 'Venda de Produto'}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-none">Vendas</Badge>
                    </td>
                    <td className={`px-6 py-4 font-bold ${tx.type === 'INCOME' ? 'text-green-500' : 'text-red-500'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'} {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={
                        tx.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' :
                        tx.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20' :
                        'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                      }>
                        {tx.status === 'COMPLETED' ? 'Concluído' : tx.status === 'PENDING' ? 'Pendente' : 'Cancelado'}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {data?.recentTransactions?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">Nenhuma transação encontrada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
