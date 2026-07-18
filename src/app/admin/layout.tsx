import React from 'react';
import { redirect } from 'next/navigation';
import { Database, ShieldAlert, KeyRound, Users, LayoutDashboard, Settings, Menu } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Painel de controle da plataforma inteira (chave mestre da OpenAI,
  // contagem de todos os tenants). Sem essa checagem, qualquer usuário
  // logado — de qualquer tenant, com papel AGENT — conseguia abrir /admin
  // e ler/trocar a chave mestre de todo mundo.
  try {
    await requireAdmin();
  } catch {
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#000000] text-zinc-300 font-sans">
      
      {/* Mobile Header (Only visible on small screens) */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-[#1f1f1f] bg-[#0a0a0a]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <ShieldAlert className="size-4 text-red-500" />
          </div>
          <h2 className="font-bold text-zinc-100 text-sm">Super Admin</h2>
        </div>
        <button className="text-zinc-400">
          <Menu className="size-6" />
        </button>
      </div>

      {/* Sidebar do Super Admin (Hidden on mobile by default, flex on md) */}
      <div className="hidden md:flex w-64 bg-[#0a0a0a] border-r border-[#1f1f1f] flex-col shrink-0">
        <div className="p-6 border-b border-[#1f1f1f] flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <ShieldAlert className="size-4 text-red-500" />
          </div>
          <div>
            <h2 className="font-bold text-zinc-100 text-sm">Super Admin</h2>
            <p className="text-[10px] text-zinc-500 font-mono tracking-wider">SYSTEM CONTROL</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <a href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#161616] text-white font-medium text-sm border border-[#2a2a2a]">
            <LayoutDashboard className="size-4" />
            Dashboard
          </a>
          <a href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#111] transition-colors font-medium text-sm">
            <Users className="size-4" />
            Clientes (Tenants)
          </a>
          <a href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#111] transition-colors font-medium text-sm">
            <KeyRound className="size-4" />
            Cofre de Chaves
          </a>
          <a href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#111] transition-colors font-medium text-sm">
            <Database className="size-4" />
            Banco de Dados
          </a>
        </nav>

        <div className="p-4 border-t border-[#1f1f1f]">
          <a href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
            <Settings className="size-4" />
            Voltar ao CRM
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-[#050505]">
        {children}
      </div>
    </div>
  );
}
