'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Plus, 
  Search,
  MoreVertical,
  Edit,
  Trash
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  if (isLoading) return <div className="text-white">Carregando catálogo de produtos...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Catálogo de Produtos</h1>
          <p className="text-gray-400 mt-1">Gerencie os produtos e serviços oferecidos pela sua empresa.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
          <Plus className="h-4 w-4 mr-2" /> Novo Produto
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
          <Input placeholder="Buscar por nome ou SKU..." className="pl-10 bg-white/5 border-white/10 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="glass-dark border-white/5 overflow-hidden group">
            <div className="aspect-video bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center relative">
              <Package className="h-12 w-12 text-blue-500/50 group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute top-3 right-3">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10 text-white">
                    <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer">
                      <Edit className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-red-500/10 focus:text-red-500 text-red-500 cursor-pointer">
                      <Trash className="mr-2 h-4 w-4" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <CardContent className="p-5">
              <h3 className="font-bold text-white text-lg truncate">{product.name}</h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2 min-h-[40px]">{product.description || 'Nenhuma descrição disponível.'}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xl font-bold text-blue-400">{formatCurrency(product.price)}</span>
                <span className="text-xs text-gray-600 bg-white/5 px-2 py-1 rounded">Serviço</span>
              </div>
            </CardContent>
          </Card>
        ))}

        <button className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl p-8 hover:border-blue-600/50 hover:bg-blue-600/5 transition-all group">
          <div className="p-4 bg-white/5 rounded-full mb-4 group-hover:bg-blue-600/10">
            <Plus className="h-8 w-8 text-gray-500 group-hover:text-blue-500" />
          </div>
          <p className="text-gray-400 font-medium group-hover:text-white">Adicionar Produto</p>
        </button>
      </div>
    </div>
  );
}
