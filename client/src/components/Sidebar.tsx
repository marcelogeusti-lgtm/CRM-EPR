'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Kanban, 
  BarChart3, 
  Settings, 
  LogOut,
  CreditCard,
  Package,
  Bot
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: MessageSquare, label: 'Mensagens', href: '/inbox' },
  { icon: Kanban, label: 'Pipeline', href: '/pipeline' },
  { icon: Users, label: 'Contatos', href: '/contacts' },
  { icon: CreditCard, label: 'Financeiro', href: '/finance' },
  { icon: Package, label: 'Produtos', href: '/products' },
  { icon: Bot, label: 'Automações', href: '/automations' },
  { icon: BarChart3, label: 'Relatórios', href: '/reports' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, tenant } = useAuth();

  return (
    <div className="flex flex-col h-full bg-[#161a1f] border-r border-[#222831] w-[260px] text-zinc-400 shadow-sm z-20">
      
      {/* Logotipo */}
      <div className="p-6 pb-2 flex items-center gap-3">
        <div className="w-8 h-8 bg-[#10a37f] rounded flex items-center justify-center font-bold text-[#161a1f]">
          P
        </div>
        <span className="font-extrabold text-xl tracking-tight text-white drop-shadow-sm">PulseERP</span>
      </div>

      <div className="px-6 mb-4 mt-2">
        <div className="p-0.5">
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Espaço de Trabalho</p>
          <p className="font-semibold text-sm text-zinc-200 truncate">{tenant?.name || 'Carregando...'}</p>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
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

      {/* Ações de Rodapé */}
      <div className="p-3 mt-auto space-y-1 border-t border-[#222831]">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-[13px] font-medium text-[#a0a5ab] hover:bg-[#1a1f24] hover:text-zinc-200 transition-all"
        >
          <Settings className="h-[18px] w-[18px] text-[#7a8189]" />
          <span>Configurações</span>
        </Link>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-[13px] font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all text-left"
        >
          <LogOut className="h-[18px] w-[18px] text-red-500" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}
