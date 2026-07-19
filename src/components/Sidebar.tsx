'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/login/actions';
import {
  Home,
  MessageCircle,
  KanbanSquare,
  Calendar,
  List,
  Bot,
  Zap,
  Gauge,
  Settings,
  HelpCircle,
  Heart,
  Bell,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  Box,
  LogOut,
  Wrench
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  AGENT: 'Atendente',
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function Sidebar({ isOpen = false, onClose = () => {}, user = null }: { isOpen?: boolean, onClose?: () => void, user?: { name: string; role: string } | null } = {}) {
  const pathname = usePathname();
  const [comunicacoesOpen, setComunicacoesOpen] = useState(pathname.includes('/inbox') || pathname.includes('/email') || pathname.includes('/team'));

  const menuItems = [
    { name: 'Início', href: '/dashboard', icon: Home },
    { 
      name: 'Comunicações', 
      icon: MessageCircle,
      isAccordion: true,
      isOpen: comunicacoesOpen,
      setIsOpen: setComunicacoesOpen,
      subItems: [
        { name: 'Inbox de chat', href: '/inbox' },
        { name: 'Inbox de email', href: '/email' },
        { name: 'Chats da equipe', href: '/team' },
      ]
    },
    { name: 'Funis de vendas', href: '/pipeline', icon: KanbanSquare },
    { name: 'Ordens de Serviço', href: '/service-orders', icon: Wrench },
    { name: 'Calendário', href: '/calendar', icon: Calendar },
    { name: 'Listas', href: '/lists', icon: List },
    { name: 'Agente de IA', href: '/salesbot', icon: Bot },
    { name: 'Automações', href: '/automations', icon: Zap },
    { name: 'Painel', href: '/insights', icon: Gauge },
  ];

  const bottomItems = [
    { name: 'Integrações', href: '/integrations', icon: Settings },
    { name: 'Ajuda', href: '/help', icon: HelpCircle, hasArrow: true },
    { name: 'Enviar feedback', href: '/feedback', icon: Heart },
    { name: 'Notificações', href: '/notifications', icon: Bell },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <div className={cn(
        "w-[260px] h-screen bg-[#111111] border-r border-[#222] flex flex-col py-4 shrink-0 z-50 fixed left-0 top-0 overflow-y-auto custom-scrollbar text-[14px] transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        
        {/* Logo Header */}
        <div className="px-5 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Box className="size-5 text-white" />
            </div>
            <span className="text-zinc-100 font-bold text-xl tracking-tight">Nexus</span>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors md:hidden"
          >
            <PanelLeftClose className="size-4" />
          </button>
        </div>

      {/* Main Nav */}
      <nav className="flex-1 w-full flex flex-col px-3 gap-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          
          if (item.isAccordion) {
            const isChildActive = item.subItems?.some(sub => pathname === sub.href);
            return (
              <div key={item.name} className="flex flex-col mb-1">
                <button 
                  onClick={() => item.setIsOpen(!item.isOpen)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group w-full",
                    isChildActive && !item.isOpen ? "text-blue-400" : "text-zinc-400 hover:bg-[#1a1a1a] hover:text-zinc-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="size-5" strokeWidth={1.5} />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  {item.isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </button>
                
                {item.isOpen && (
                  <div className="flex flex-col mt-1 mb-2 space-y-0.5">
                    {item.subItems?.map(sub => {
                      const isActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          prefetch={false}
                          className={cn(
                            "py-2 pl-11 pr-3 text-[13px] rounded-lg transition-all",
                            isActive 
                              ? "bg-blue-500/10 text-blue-400 font-medium" 
                              : "text-zinc-500 hover:text-zinc-300 hover:bg-[#1a1a1a]"
                          )}
                        >
                          {sub.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href || '#'}
              prefetch={false}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
                isActive ? "bg-blue-500/10 text-blue-400 font-medium" : "text-zinc-400 hover:bg-[#1a1a1a] hover:text-zinc-200 font-medium"
              )}
            >
              <Icon className={cn("size-5", isActive ? "text-blue-400" : "")} strokeWidth={1.5} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="h-px bg-[#222] mx-5 my-6" />

      {/* Bottom Nav */}
      <div className="flex flex-col px-3 gap-1 mb-6">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={false}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group",
                isActive ? "bg-blue-500/10 text-blue-400" : "text-zinc-400 hover:bg-[#1a1a1a] hover:text-zinc-200"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="size-5" strokeWidth={1.5} />
                <span className="font-medium">{item.name}</span>
              </div>
              {item.hasArrow && <ChevronRight className="size-4 text-zinc-600" />}
            </Link>
          );
        })}
      </div>

      {/* User Profile */}
      <div className="px-5 pt-4 pb-4 mt-auto border-t border-[#222]">
        <div className="flex items-center justify-between group">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-lg shadow-purple-900/20">
              {user ? getInitials(user.name) : '?'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-zinc-200 text-sm font-semibold truncate group-hover:text-blue-400 transition-colors">{user?.name ?? 'Usuário'}</span>
              <span className="text-zinc-500 text-xs truncate">{user ? (ROLE_LABELS[user.role] ?? user.role) : ''}</span>
            </div>
          </div>
          <form action={logout}>
            <button 
              type="submit" 
              className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              title="Sair"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>

    </div>
    </>
  );
}
