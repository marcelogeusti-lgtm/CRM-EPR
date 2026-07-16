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
  LogOut
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
    { name: 'Calendário', href: '/calendar', icon: Calendar },
    { name: 'Listas', href: '/lists', icon: List },
    { name: 'Agente de IA', href: '/salesbot', icon: Bot },
    { name: 'Automações', href: '/automations', icon: Zap },
    { name: 'Painel', href: '/insights', icon: Gauge },
  ];

  const bottomItems = [
    { name: 'Configurações', href: '/integrations', icon: Settings },
    { name: 'Ajuda', href: '/help', icon: HelpCircle, hasArrow: true },
    { name: 'Enviar feedback', href: '/feedback', icon: Heart },
    { name: 'Notificações', href: '/notifications', icon: Bell },
  ];

  const pinnedIntegrations = [
    { name: 'Instagram', color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500', svg: <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-white fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
    { name: 'WhatsApp Business', color: 'bg-[#25D366]', svg: <svg viewBox="0 0 24 24" className="w-3 h-3 text-white fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.299-.018-.461.13-.611.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
    { name: 'Facebook', color: 'bg-[#1877F2]', svg: <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-white fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
    { name: 'TikTok', color: 'bg-zinc-800', svg: <svg viewBox="0 0 24 24" className="w-3 h-3 text-white fill-current"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.12-3.44-3.17-3.61-5.46-.11-1.74.34-3.48 1.34-4.87 1.05-1.5 2.65-2.52 4.46-2.82 1.25-.2 2.53-.13 3.75.25V14.1c-.81-.17-1.66-.21-2.48-.05-.88.16-1.68.68-2.19 1.41-.53.79-.71 1.79-.47 2.72.2 1.02.83 1.9 1.7 2.37 1.04.57 2.32.61 3.39.11 1.25-.56 2.06-1.83 2.15-3.18.06-2.91.03-5.83.03-8.74.01-2.91-.02-5.82-.01-8.72z"/></svg> },
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
        
        {/* Fixed Integrations */}
        <div className="mt-6 mb-2 px-3">
          <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">Canais Fixados</span>
        </div>
        {pinnedIntegrations.map((integration) => (
          <Link 
            key={integration.name}
            href="/integrations"
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all group text-zinc-400 hover:bg-[#1a1a1a] hover:text-zinc-200"
          >
            <div className={cn("w-5 h-5 rounded flex items-center justify-center shrink-0 shadow-sm", integration.color)}>
              {integration.svg}
            </div>
            <span className="text-[13px] font-medium">{integration.name}</span>
          </Link>
        ))}
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
