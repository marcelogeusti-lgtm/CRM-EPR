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
  Zap,
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
  { icon: Zap, label: 'Assinatura', href: '/billing' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, tenant } = useAuth();

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-[260px] text-slate-700 shadow-sm z-20">
      
      {/* Logotipo */}
      <div className="p-6 pb-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white shadow-sm">
          P
        </div>
        <span className="font-extrabold text-xl tracking-tight text-slate-900">PulseERP</span>
      </div>

      <div className="px-6 mb-6">
        <div className="p-0.5">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Espaço de Trabalho</p>
          <p className="font-semibold text-sm text-slate-700 truncate">{tenant?.name || 'Carregando...'}</p>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-sm font-medium",
                isActive 
                  ? "bg-slate-100 text-slate-900 font-semibold" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-[18px] w-[18px]", isActive ? "text-slate-800" : "text-slate-400 group-hover:text-slate-600")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Ações de Rodapé */}
      <div className="p-4 mt-auto space-y-1 border-t border-slate-100">
        <button
          onClick={() => {}}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
        >
          <Settings className="h-[18px] w-[18px] text-slate-400" />
          <span>Configurações</span>
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut className="h-[18px] w-[18px] text-red-400" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}
