'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Wrench, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/work-orders`);
        setWorkOrders(response.data);
      } catch (error) {
        console.error('Failed to load work orders', error);
      } finally {
        setIsLoading(false);
      }
    };
    // fetchOrders();
    // mock for now to show UI
    setWorkOrders([
      { id: '1', title: 'Manutenção Preventiva', description: 'Revisão do equipamento XYZ', status: 'PENDING', createdAt: new Date() },
      { id: '2', title: 'Instalação de Software', description: 'Instalar pacote Office e ERP', status: 'IN_PROGRESS', createdAt: new Date() },
      { id: '3', title: 'Troca de Peça', description: 'Trocar fonte de alimentação', status: 'COMPLETED', createdAt: new Date() }
    ]);
    setIsLoading(false);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20"><Wrench className="w-3 h-3 mr-1" /> Em Andamento</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" /> Concluída</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20"><XCircle className="w-3 h-3 mr-1" /> Cancelada</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Ordens de Serviço</h1>
          <p className="text-gray-400 mt-1">Gerencie as OS da sua equipe de campo e manutenção.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <Input placeholder="Buscar OS..." className="pl-9 h-10 w-64 bg-white/5 border-white/10 text-white" />
          </div>
          <Button variant="outline" className="border-white/10 text-white">
            <Filter className="h-4 w-4 mr-2" /> Filtros
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
            <Plus className="h-4 w-4 mr-2" /> Nova OS
          </Button>
        </div>
      </div>

      <Card className="bg-[#111] border-white/5 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-[#1a1a1a] text-gray-400 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-semibold">OS # / Título</th>
                <th className="px-6 py-4 font-semibold">Descrição</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Data</th>
                <th className="px-6 py-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map((os: any) => (
                <tr key={os.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center border border-white/10">
                      <Wrench className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <div>{os.title}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">#{os.id.substring(0,8)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{os.description}</td>
                  <td className="px-6 py-4">{getStatusBadge(os.status)}</td>
                  <td className="px-6 py-4 text-gray-400">{format(new Date(os.createdAt), "dd/MM/yyyy")}</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10">Ver Detalhes</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {workOrders.length === 0 && !isLoading && (
            <div className="p-12 text-center text-gray-500">
              Nenhuma ordem de serviço encontrada.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
