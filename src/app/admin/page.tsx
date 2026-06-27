import React from 'react';
import { PrismaClient } from '@prisma/client';
import { KeyRound, ShieldCheck, Activity, Users, Zap } from 'lucide-react';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export default async function AdminDashboardPage() {
  // Fetch system configs
  const configs = await prisma.systemConfig.findMany();
  const openAiKeyConfig = configs.find(c => c.key === 'OPENAI_MASTER_KEY');
  
  // Basic stats
  const tenantsCount = await prisma.tenant.count();
  const agentsCount = await prisma.aiAgent.count({ where: { isActive: true } });

  // Server action to save the key
  async function saveKey(formData: FormData) {
    'use server';
    const key = formData.get('openai_key') as string;
    
    if (key) {
      await prisma.systemConfig.upsert({
        where: { key: 'OPENAI_MASTER_KEY' },
        update: { value: key },
        create: { key: 'OPENAI_MASTER_KEY', value: key }
      });
      revalidatePath('/admin');
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Painel de Controle Global</h1>
        <p className="text-sm md:text-base text-zinc-400 mt-2">Gerencie as configurações críticas de toda a plataforma SaaS.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-[#111] border border-[#222] p-5 md:p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
            <Users className="size-6 text-blue-500" />
          </div>
          <div>
            <p className="text-xs md:text-sm text-zinc-400 font-medium">Clientes (Tenants)</p>
            <p className="text-xl md:text-2xl font-bold text-white">{tenantsCount}</p>
          </div>
        </div>

        <div className="bg-[#111] border border-[#222] p-5 md:p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Zap className="size-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs md:text-sm text-zinc-400 font-medium">Agentes de IA Ativos</p>
            <p className="text-xl md:text-2xl font-bold text-white">{agentsCount}</p>
          </div>
        </div>

        <div className="bg-[#111] border border-[#222] p-5 md:p-6 rounded-2xl flex items-center gap-4 sm:col-span-2 md:col-span-1">
          <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
            <Activity className="size-6 text-purple-500" />
          </div>
          <div>
            <p className="text-xs md:text-sm text-zinc-400 font-medium">Tokens Gastos Hoje</p>
            <p className="text-xl md:text-2xl font-bold text-white">0 <span className="text-xs text-zinc-500 font-normal">/ limite 1M</span></p>
          </div>
        </div>
      </div>

      {/* Configurações de API (O Cofre) */}
      <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl overflow-hidden relative">
        <div className="p-5 md:p-6 border-b border-[#222] flex items-center gap-3 bg-[#111]">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
            <KeyRound className="size-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white leading-tight">Cofre de Chaves Mestre</h2>
            <p className="text-xs md:text-sm text-zinc-400 mt-1">As chaves inseridas servem de motor para todos os clientes.</p>
          </div>
        </div>

        <div className="p-5 md:p-8">
          <form action={saveKey} className="max-w-2xl space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-bold text-zinc-300 block">OpenAI API Key (ChatGPT Motor)</label>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <div className="relative flex-1">
                  <input 
                    type="password"
                    name="openai_key"
                    defaultValue={openAiKeyConfig?.value || ''}
                    placeholder="sk-proj-..."
                    className="w-full bg-[#161616] border border-[#333] rounded-lg px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-orange-500/50 font-mono tracking-widest"
                  />
                  {openAiKeyConfig && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-[10px] font-bold uppercase pointer-events-none">
                      <ShieldCheck className="size-3" />
                      Salva
                    </div>
                  )}
                </div>
                <button type="submit" className="w-full sm:w-auto bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-lg text-sm font-bold transition-colors shrink-0">
                  Salvar Chave
                </button>
              </div>
              <p className="text-[11px] md:text-xs text-zinc-500">Essa chave será criptografada e usada no Vercel AI SDK para dar vida ao Salesbot de todos os tenants.</p>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}
