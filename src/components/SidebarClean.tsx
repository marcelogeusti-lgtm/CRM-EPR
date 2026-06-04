'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home,
  Search,
  MessageCircle,
  KanbanSquare,
  Calendar,
  Bot,
  Briefcase,
  Heart,
  PlusSquare,
  Menu,
  SquareStack,
  Camera,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function SidebarClean({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Página inicial', href: '/dashboard', icon: Home },
    { name: 'Pesquisa', href: '#', icon: Search },
    { name: 'Mensagens', href: '/inbox', icon: MessageCircle, badge: 6 },
    { name: 'Funis de vendas', href: '/pipeline', icon: KanbanSquare },
    { name: 'Calendário', href: '/calendar', icon: Calendar },
    { name: 'Notificações', href: '/notifications', icon: Heart },
    { name: 'Criar', href: '#', icon: PlusSquare },
    { name: 'Agente de IA', href: '/salesbot', icon: Bot },
    { name: 'Financeiro', href: '/erp', icon: Briefcase },
    { name: 'Perfil', href: '/settings', isAvatar: true },
  ];

  return (
    <div className="w-[245px] h-screen bg-[#000000] border-r border-[#262626] flex flex-col pt-8 pb-5 shrink-0 z-50 fixed left-0 top-0 overflow-y-auto custom-scrollbar">
      
      {/* Top Logo */}
      <div className="px-6 mb-8 flex items-center">
        <Link href="/dashboard" className="text-white hover:opacity-80 transition-opacity">
          <Camera strokeWidth={2} className="w-6 h-6" />
        </Link>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 w-full flex flex-col gap-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link 
              key={item.name} 
              href={item.href || '#'}
              onClick={onClose}
              className={cn(
                "flex items-center gap-4 px-3 py-3 rounded-lg transition-colors group",
                "hover:bg-[#1a1a1a]",
              )}
            >
              <div className="relative flex items-center justify-center">
                {item.isAvatar ? (
                  <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden">
                    <img src="https://github.com/shadcn.png" alt="Profile" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  item.icon && <item.icon className="w-[26px] h-[26px] text-white" strokeWidth={isActive ? 2.5 : 1.5} />
                )}
                
                {/* Notification Badge */}
                {item.badge && (
                  <div className="absolute -top-1 -right-1.5 min-w-[18px] h-[18px] bg-[#ff3040] rounded-full flex items-center justify-center px-1 border-2 border-black">
                    <span className="text-[10px] text-white font-bold">{item.badge}</span>
                  </div>
                )}
              </div>
              <span className={cn(
                "text-[16px] text-white tracking-wide",
                isActive ? "font-bold" : "font-normal"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Nav */}
      <div className="px-3 mt-auto flex flex-col gap-1">
        <Link 
          href="#"
          className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-[#1a1a1a] transition-colors"
        >
          <Menu className="w-[26px] h-[26px] text-white" strokeWidth={1.5} />
          <span className="text-[16px] text-white font-normal tracking-wide">Mais</span>
        </Link>
        <Link 
          href="#"
          className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-[#1a1a1a] transition-colors"
        >
          <SquareStack className="w-[26px] h-[26px] text-white" strokeWidth={1.5} />
          <span className="text-[16px] text-white font-normal tracking-wide">Também da Meta</span>
        </Link>
      </div>

    </div>
  );
}
