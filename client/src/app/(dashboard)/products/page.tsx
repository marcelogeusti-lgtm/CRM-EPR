'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Plus, 
  Search,
  MoreVertical,
  Edit,
  Trash,
  SlidersHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from '@/components/system/PageHeader';
import { motion } from 'framer-motion';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/products`);
        setProducts(response.data);
      } catch (error) {
        console.error(error);
        setProducts([
          { id: '1', name: 'Mentoria Exclusiva Pulse', description: 'Acelere suas vendas com 4 mentorias em grupo ao vivo.', price: 997.00 },
          { id: '2', name: 'Curso Completo de Tráfego Pago', description: 'Aprenda do básico ao avançado a anunciar no Meta Ads.', price: 197.00 }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  if (isLoading) return <div className="text-zinc-500 p-8">Carregando catálogo de produtos...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* PageHeader unificado */}
      <PageHeader 
        title="Catálogo de Produtos"
        description="Gerencie os produtos e serviços digitais ou físicos comercializados."
        actions={
          <div className="flex items-center gap-2">
            <div className="bg-white border border-zinc-200 rounded-lg flex items-center px-3 py-2 shadow-sm w-full md:w-64 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
              <Search className="size-[18px] text-zinc-400" />
              <input 
                type="text" 
                placeholder="Buscar por nome ou SKU..." 
                className="bg-transparent border-none outline-none w-full ml-2 text-sm text-zinc-700 placeholder:text-zinc-400"
              />
            </div>
            <button className="h-11 px-4 bg-white hover:bg-zinc-50 text-zinc-600 rounded-xl transition-all font-medium border border-zinc-200 flex items-center gap-2 text-sm shadow-sm">
              <SlidersHorizontal className="size-[18px] text-zinc-400" />
              Filtros
            </button>
            <button className="h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-sm flex items-center gap-2 text-sm whitespace-nowrap">
              <Plus className="size-[18px]" />
              Novo Produto
            </button>
          </div>
        }
      />

      {/* Grid de Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {products.map((product) => (
          <Card key={product.id} className="border-zinc-200 bg-white shadow-sm overflow-hidden group hover:shadow-md transition-all duration-200 rounded-2xl">
            <div className="aspect-video bg-zinc-50 border-b border-zinc-100 flex items-center justify-center relative">
              <Package className="size-10 text-zinc-300 group-hover:scale-110 transition-transform duration-300" />
              
              <div className="absolute top-3 right-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:bg-zinc-200 rounded-lg">
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white border-zinc-200 text-zinc-700 shadow-sm rounded-xl">
                    <DropdownMenuItem className="focus:bg-zinc-50 cursor-pointer text-xs">
                      <Edit className="mr-2 size-3.5 text-zinc-400" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-red-50 text-red-600 cursor-pointer text-xs">
                      <Trash className="mr-2 size-3.5 text-red-400" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <CardContent className="p-5 flex flex-col justify-between min-h-[140px]">
              <div>
                <h3 className="font-bold text-zinc-800 text-sm truncate leading-snug">{product.name}</h3>
                <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 min-h-[32px] leading-relaxed">{product.description || 'Nenhuma descrição disponível.'}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-50 flex items-center justify-between">
                <span className="text-base font-extrabold text-blue-600">{formatCurrency(product.price)}</span>
                <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 uppercase">Digital</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Adicionar Produto Card */}
        <button className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-2xl p-8 hover:border-blue-500/50 hover:bg-blue-50/10 transition-all group min-h-[220px] bg-white/50 cursor-pointer">
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl mb-4 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
            <Plus className="size-6 text-zinc-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <p className="text-zinc-500 text-xs font-semibold group-hover:text-zinc-800 transition-colors">Adicionar Produto</p>
        </button>
      </motion.div>
    </div>
  );
}
