'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart,
  ShoppingBag,
  CircleDollarSign,
  FileText,
  Users,
  UserCheck,
  Landmark,
  Cable,
  TicketPercent,
  HelpCircle,
  Filter
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Package, label: 'Produtos', href: '/products' },
  { icon: ShoppingCart, label: 'Vitrine', href: '/storefront' },
  { icon: ShoppingBag, label: 'Minhas Vendas', href: '/sales' },
  { icon: CircleDollarSign, label: 'Assinaturas', href: '/subscriptions' },
  { icon: FileText, label: 'Relatórios', href: '/reports' },
  { icon: Users, label: 'Equipe', href: '/team' },
  { icon: UserCheck, label: 'Afiliados', href: '/affiliates' },
  { icon: Landmark, label: 'Financeiro', href: '/finance' },
  { icon: Cable, label: 'Integrações', href: '/integrations' },
  { icon: TicketPercent, label: 'Cupons', href: '/coupons' },
  { icon: HelpCircle, label: 'Quiz', href: '/quiz' },
  { icon: Filter, label: 'Funeleiro', href: '/funnels' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-[#161a1f] border-r border-[#222831] w-[260px] text-zinc-400 shadow-sm z-20">
      
      {/* Espaço reservado para Perfil/Logo superior, se houver */}
      <div className="p-6 pb-2">
        {/* Vazio ou Logo da empresa */}
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group text-[13px] font-medium",
                isActive 
                  ? "bg-[#1f2b31] text-[#10a37f] font-semibold border-l-2 border-[#10a37f]" 
                  : "text-[#a0a5ab] hover:bg-[#1a1f24] hover:text-zinc-200"
              )}
            >
              <Icon className={cn("h-[18px] w-[18px]", isActive ? "text-[#10a37f]" : "text-[#7a8189] group-hover:text-zinc-400")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
