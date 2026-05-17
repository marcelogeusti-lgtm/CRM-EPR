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
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  { icon: LayoutDashboard, label: 'Painel', href: '/dashboard' },
  { icon: MessageSquare, label: 'Mensagens', href: '/inbox' },
  { icon: Kanban, label: 'Pipeline', href: '/pipeline' },
  { icon: Users, label: 'Contatos', href: '/contacts' },
  { icon: CreditCard, label: 'Financeiro', href: '/finance' },
  { icon: Package, label: 'Produtos', href: '/products' },
  { icon: BarChart3, label: 'Relatórios', href: '/reports' },
  { icon: Zap, label: 'Assinatura', href: '/billing' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, tenant } = useAuth();

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border-r border-white/5 w-64 text-white">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">2</div>
        <span className="font-bold text-xl tracking-tight">2Formes</span>
      </div>

      <div className="px-4 mb-4">
        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
          <p className="text-xs text-gray-500 uppercase font-semibold">Tenant</p>
          <p className="font-medium truncate">{tenant?.name || 'Carregando...'}</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" 
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-blue-400" : "group-hover:text-white")} />
              <span className="font-medium">{item.label}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.8)]" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto space-y-2">
        <button
          onClick={() => {}}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all"
        >
          <Settings className="h-5 w-5" />
          <span className="font-medium">Configurações</span>
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </div>
  );
}
