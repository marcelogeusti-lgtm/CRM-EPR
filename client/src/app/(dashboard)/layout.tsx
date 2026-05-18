'use client';

import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const getPageTitle = () => {
    const route = pathname.split('/').pop();
    switch (route) {
      case 'dashboard': return 'Dashboard';
      case 'inbox': return 'Mensagens';
      case 'campaigns': return 'Campanhas em Massa';
      case 'pipeline': return 'Pipeline';
      case 'contacts': return 'Contatos';
      case 'finance': return 'Financeiro';
      case 'products': return 'Produtos';
      case 'automations': return 'Automações';
      case 'reports': return 'Relatórios';
      case 'billing': return 'Planos & Faturamento';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header (Kirvano Style) */}
        <header className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0 z-10">
          <h2 className="text-[22px] font-bold text-slate-800 tracking-tight">{getPageTitle()}</h2>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors shadow-sm">
              <div className="w-9 h-9 rounded-md bg-slate-100 overflow-hidden border border-slate-200">
                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}&backgroundColor=e2e8f0&textColor=475569`} alt="Avatar" />
              </div>
              <div className="text-sm pr-1">
                <p className="font-semibold text-slate-700 leading-tight truncate max-w-[120px]">{user?.name || 'Administrador'}</p>
                <p className="text-xs text-slate-500 leading-tight">Admin</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto bg-[#f8fafc] p-8">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}
