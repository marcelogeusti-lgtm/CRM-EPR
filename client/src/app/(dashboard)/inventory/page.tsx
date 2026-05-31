'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowDownCircle, ArrowUpCircle, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

export default function InventoryMovementsPage() {
  const [movements, setMovements] = useState([]);

  useEffect(() => {
    setMovements([
      { id: '1', type: 'IN', quantity: 50, notes: 'Reposição de estoque semanal', product: { name: 'Peça A' }, user: { name: 'Admin' }, createdAt: new Date() },
      { id: '2', type: 'OUT', quantity: 2, notes: 'Usado na OS #1234', product: { name: 'Cabo XYZ' }, user: { name: 'João Técnico' }, createdAt: new Date(Date.now() - 3600000) },
    ]);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Movimentações</h1>
          <p className="text-gray-400 mt-1">Histórico de entrada e saída de produtos e peças.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <Input placeholder="Buscar produtos..." className="pl-9 h-10 w-64 bg-white/5 border-white/10 text-white" />
        </div>
      </div>

      <Card className="bg-[#111] border-white/5 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-[#1a1a1a] text-gray-400 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-semibold">Tipo</th>
                <th className="px-6 py-4 font-semibold">Produto</th>
                <th className="px-6 py-4 font-semibold">Qtd</th>
                <th className="px-6 py-4 font-semibold">Motivo/OS</th>
                <th className="px-6 py-4 font-semibold">Funcionário</th>
                <th className="px-6 py-4 font-semibold">Data</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((mov: any) => (
                <tr key={mov.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    {mov.type === 'IN' ? (
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20"><ArrowDownCircle className="w-3 h-3 mr-1" /> Entrada</Badge>
                    ) : (
                      <Badge className="bg-red-500/10 text-red-400 border-red-500/20"><ArrowUpCircle className="w-3 h-3 mr-1" /> Saída</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-500" />
                    {mov.product.name}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-gray-300">
                    {mov.type === 'IN' ? '+' : '-'}{mov.quantity}
                  </td>
                  <td className="px-6 py-4 text-gray-400">{mov.notes}</td>
                  <td className="px-6 py-4 text-gray-300">{mov.user.name}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{format(new Date(mov.createdAt), "dd/MM/yyyy HH:mm")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
