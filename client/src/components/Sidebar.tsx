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
  Bot,
  Megaphone,
  Wrench,
  Shield,
  ArrowRightLeft
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: MessageSquare, label: 'Mensagens', href: '/inbox' },
  { icon: Megaphone, label: 'Campanhas', href: '/campaigns' },
  { icon: Kanban, label: 'Pipeline', href: '/pipeline' },
  { icon: Users, label: 'Contatos', href: '/contacts' },
  { icon: CreditCard, label: 'Financeiro', href: '/finance' },
  { icon: Package, label: 'Produtos', href: '/products' },
  { icon: ArrowRightLeft, label: 'Movimentações', href: '/inventory' },
  { icon: Wrench, label: 'Ordens de Serviço', href: '/work-orders' },
  { icon: Bot, label: 'Automações', href: '/automations' },
  { icon: BarChart3, label: 'Relatórios', href: '/reports' },
  { icon: Shield, label: 'Auditoria', href: '/audit-logs' },
  { icon: Zap, label: 'Assinatura', href: '/billing' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, tenant } = useAuth();

  return (
    <div className="flex flex-col h-full bg-zinc-950/90 backdrop-blur-xl border-r border-zinc-800 w-[260px] text-zinc-300 shadow-sm z-20">
      
      {/* Logotipo */}
      <div className="p-6 pb-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]">
          P
        </div>
        <span className="font-extrabold text-xl tracking-tight text-white drop-shadow-sm">PulseERP</span>
      </div>

      <div className="px-6 mb-6">
        <div className="p-0.5">
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Espaço de Trabalho</p>
          <p className="font-semibold text-sm text-zinc-200 truncate">{tenant?.name || 'Carregando...'}</p>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
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
                  ? "bg-blue-600/10 text-blue-400 font-semibold border border-blue-500/20 shadow-[inset_0_0_10px_rgba(37,99,235,0.1)]" 
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              )}
            >
              <Icon className={cn("h-[18px] w-[18px]", isActive ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Ações de Rodapé */}
      <div className="p-4 mt-auto space-y-1 border-t border-zinc-800/50">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-all"
        >
          <Settings className="h-[18px] w-[18px] text-zinc-500" />
          <span>Configurações</span>
        </Link>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
        >
          <LogOut className="h-[18px] w-[18px] text-red-500" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}
