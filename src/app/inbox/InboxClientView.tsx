'use client';

import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LeadInboxPanel } from '@/components/LeadInboxPanel';

export function InboxClientView({ initialDeals }: { initialDeals: any[] }) {
  const router = useRouter();
  const deals = initialDeals; // Usa a prop diretamente para receber os updates do router.refresh()
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  // Efeito de Polling (Auto-Refresh)
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 3000); // Atualiza a cada 3 segundos
    return () => clearInterval(interval);
  }, [router]);

  const selectedDeal = deals.find(d => d.id === selectedDealId);

  return (
    <div className="flex h-full w-full">
      {/* Lista de Chats (Esquerda) */}
      <div className={`flex flex-col border-r border-white/5 bg-[#050505] transition-all duration-300 ${selectedDeal ? 'w-[350px]' : 'w-[350px] max-w-[500px]'} shrink-0 relative z-20`}>
        
        {/* Header Left Panel */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-1 rounded-md font-medium tracking-wide">Conversas abertas</span>
          </div>
          <div className="flex items-center gap-3 text-zinc-500 text-xs font-mono">
            <span>TOTAL: {deals.length}</span>
            <button className="hover:text-white transition-colors">•••</button>
          </div>
        </div>

        {/* Adicionar Canais Button */}
        <div className="p-5 border-b border-white/5 flex items-center gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors group">
          <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 group-hover:border-blue-500/30 flex items-center justify-center shrink-0 transition-colors shadow-inner">
            <span className="text-zinc-400 group-hover:text-blue-400 text-xl font-light transition-colors">+</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[14px] font-medium text-zinc-200 group-hover:text-white transition-colors">Adicionar canais</span>
            <span className="text-[12px] text-zinc-500">Capture leads do WhatsApp & mais!</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {deals.length === 0 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-zinc-500 text-[13px] w-full px-6">
              Nenhuma conversa encontrada
            </div>
          )}
          {deals.map(deal => {
            const lastActivity = deal.activities?.[0];
            return (
              <div 
                key={deal.id}
                onClick={() => setSelectedDealId(deal.id)}
                className={`p-4 border-b border-white/5 cursor-pointer transition-all relative ${selectedDealId === deal.id ? 'bg-blue-500/10' : 'hover:bg-white/[0.02]'}`}
              >
                {selectedDealId === deal.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-500 rounded-r-md shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                )}
                <div className="flex justify-between items-start mb-1.5 pl-2">
                  <h3 className={`font-semibold text-[14px] truncate tracking-tight ${selectedDealId === deal.id ? 'text-white' : 'text-zinc-300'}`}>
                    {deal.contact?.name || 'Desconhecido'}
                  </h3>
                  <span className="text-[11px] text-zinc-500 shrink-0 font-mono">
                    {lastActivity ? formatDistanceToNow(new Date(lastActivity.createdAt), { addSuffix: true, locale: ptBR }) : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center pl-2">
                  <p className="text-[13px] text-zinc-500 truncate pr-4 leading-relaxed">
                    {lastActivity?.content || 'Sem mensagens'}
                  </p>
                  {deal.stage === 'NEW' && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Painel Principal do Chat (Direita) */}
      <div className="flex-1 bg-[#0a0a0a] relative overflow-hidden">
        {selectedDeal ? (
          <div className="absolute inset-0">
            <div className="w-full h-full flex [&>div]:w-full [&>div]:border-l-0">
              <LeadInboxPanel deal={selectedDeal} onClose={() => setSelectedDealId(null)} />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center relative px-6 z-10">
            
            {/* Background Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay pointer-events-none" />

            <div className="relative z-10 text-center max-w-lg mb-10">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                <Search className="size-8 text-blue-400" />
              </div>
              <h2 className="text-[28px] font-light tracking-tight text-white mb-4">
                Sua central <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-medium">omnichannel</span>.
              </h2>
              <p className="text-[15px] text-zinc-400 leading-relaxed">
                Conecte seus canais sociais para receber, responder e deixar a IA automatizar todas as suas interações em um só lugar.
              </p>
            </div>
            
            <div className="relative z-10 flex flex-wrap justify-center gap-4 max-w-2xl mb-10">
              <button className="group flex items-center gap-3 bg-[#111] hover:bg-[#1a1a1a] border border-white/5 hover:border-[#25D366]/50 px-5 py-3 rounded-2xl text-[14px] font-medium text-zinc-300 transition-all shadow-xl hover:shadow-[0_0_20px_rgba(37,211,102,0.15)]">
                <div className="w-8 h-8 bg-[#25D366]/10 group-hover:bg-[#25D366] rounded-xl flex items-center justify-center transition-colors">
                   <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#25D366] group-hover:text-white fill-current transition-colors"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.299-.018-.461.13-.611.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </div>
              WhatsApp
            </button>
            
            <button className="group flex items-center gap-3 bg-[#111] hover:bg-[#1a1a1a] border border-white/5 hover:border-white/20 px-5 py-3 rounded-2xl text-[14px] font-medium text-zinc-300 transition-all shadow-xl hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]">
              <div className="w-8 h-8 bg-zinc-800 group-hover:bg-zinc-100 rounded-xl flex items-center justify-center transition-colors">
                 <svg viewBox="0 0 24 24" className="w-4 h-4 text-zinc-300 group-hover:text-black fill-current transition-colors"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.12-3.44-3.17-3.61-5.46-.11-1.74.34-3.48 1.34-4.87 1.05-1.5 2.65-2.52 4.46-2.82 1.25-.2 2.53-.13 3.75.25V14.1c-.81-.17-1.66-.21-2.48-.05-.88.16-1.68.68-2.19 1.41-.53.79-.71 1.79-.47 2.72.2 1.02.83 1.9 1.7 2.37 1.04.57 2.32.61 3.39.11 1.25-.56 2.06-1.83 2.15-3.18.06-2.91.03-5.83.03-8.74.01-2.91-.02-5.82-.01-8.72z"/></svg>
              </div>
              TikTok
            </button>

            <button className="group flex items-center gap-3 bg-[#111] hover:bg-[#1a1a1a] border border-white/5 hover:border-[#E1306C]/50 px-5 py-3 rounded-2xl text-[14px] font-medium text-zinc-300 transition-all shadow-xl hover:shadow-[0_0_20px_rgba(225,48,108,0.15)]">
              <div className="w-8 h-8 bg-gradient-to-tr from-yellow-400/10 via-red-500/10 to-purple-500/10 group-hover:from-yellow-400 group-hover:via-red-500 group-hover:to-purple-500 rounded-xl flex items-center justify-center transition-colors">
                 <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#E1306C] group-hover:text-white fill-current transition-colors"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </div>
              Instagram
            </button>

            <button className="group flex items-center gap-3 bg-[#111] hover:bg-[#1a1a1a] border border-white/5 hover:border-[#1877F2]/50 px-5 py-3 rounded-2xl text-[14px] font-medium text-zinc-300 transition-all shadow-xl hover:shadow-[0_0_20px_rgba(24,119,242,0.15)]">
              <div className="w-8 h-8 bg-[#1877F2]/10 group-hover:bg-[#1877F2] rounded-xl flex items-center justify-center transition-colors">
                 <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#1877F2] group-hover:text-white fill-current transition-colors"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </div>
              Facebook
            </button>
          </div>

          <button className="relative z-10 text-zinc-500 hover:text-white text-[13px] font-medium transition-colors hover:underline underline-offset-4 mt-2">
            Ver todos os canais suportados
          </button>
        </div>
        )}
      </div>
    </div>
  );
}
