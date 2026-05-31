import React from 'react';
import { Play, ChevronDown, ChevronRight, Zap, HelpCircle, Calendar, Sparkles, MessageSquare, Users, Database, Check } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto space-y-8">
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-white tracking-tight">Painel de Controle</h1>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Nexus IA Ativo
          </span>
        </div>
      </div>

      {/* 1. Premium Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-[#111] p-10 flex flex-col md:flex-row items-center justify-between shadow-2xl">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-50%] left-[-10%] w-[60%] h-[150%] bg-blue-600/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-50%] right-[-10%] w-[50%] h-[150%] bg-purple-600/20 blur-[120px] rounded-full" />
          {/* Subtle noise texture overlay */}
          <div className="absolute inset-0 opacity-[0.015] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>

        <div className="max-w-xl z-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="size-5 text-blue-400" />
            <p className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Boas-vindas ao Nexus</p>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-6 tracking-tight">
            Converta chats em vendas com <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">IA Poderosa</span>
          </h2>
          <p className="text-zinc-400 text-lg mb-8 leading-relaxed max-w-md">
            Unifique WhatsApp, Instagram e TikTok. Deixe a nossa Inteligência Artificial qualificar, responder e vender por você 24h por dia.
          </p>
          <div className="flex items-center gap-4">
            <button className="bg-white hover:bg-zinc-200 text-black px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center gap-2">
              <Zap className="size-4 fill-black" />
              Ativar Agente de IA
            </button>
            <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-xl text-sm font-bold transition-colors">
              Explorar Plataforma
            </button>
          </div>
        </div>
        
        {/* Abstract 3D / AI Illustration Concept */}
        <div className="mt-10 md:mt-0 relative z-10 hidden lg:block">
          <div className="w-[340px] h-[340px] relative flex items-center justify-center">
            {/* Holographic rings */}
            <div className="absolute inset-0 border border-blue-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
            <div className="absolute inset-4 border border-purple-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
            <div className="absolute inset-8 border border-indigo-500/20 rounded-full animate-[spin_20s_linear_infinite]" />
            
            {/* Center Core */}
            <div className="w-32 h-32 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full blur-xl opacity-50 absolute" />
            <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.5)] z-10">
              <BotIcon className="size-10 text-white" />
            </div>

            {/* Floating Elements */}
            <div className="absolute top-10 -left-6 bg-[#1a1a1a] border border-white/10 shadow-xl px-4 py-2 rounded-2xl flex items-center gap-3 animate-bounce shadow-blue-900/20">
               <div className="w-2 h-2 bg-green-500 rounded-full" />
               <span className="text-xs font-medium text-zinc-300">"Qual o valor do produto?"</span>
            </div>
            
            <div className="absolute bottom-12 -right-12 bg-gradient-to-r from-blue-600 to-purple-600 shadow-xl px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-purple-900/30">
               <Zap className="size-3 text-white fill-white" />
               <span className="text-xs font-bold text-white">Criando link de pagamento...</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2. Overview / Trial (Left Column - 1 span) */}
        <div className="col-span-1 space-y-6">
          <div className="bg-[#141414] rounded-2xl border border-[#262626] p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none" />
            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
              <Database className="size-5 text-emerald-400" />
              Visão Geral
            </h3>
            
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Dias de Teste</span>
                <span className="text-sm font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">14 restantes</span>
              </div>
              <div className="h-px w-full bg-gradient-to-r from-transparent via-[#262626] to-transparent" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Leads</span>
                <span className="text-sm font-semibold text-white">Ilimitado</span>
              </div>
              <div className="h-px w-full bg-gradient-to-r from-transparent via-[#262626] to-transparent" />

              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Contatos</span>
                <span className="text-sm font-semibold text-white">Ilimitado</span>
              </div>
              <div className="h-px w-full bg-gradient-to-r from-transparent via-[#262626] to-transparent" />

              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Memória</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-[#262626] rounded-full overflow-hidden">
                    <div className="w-[15%] h-full bg-blue-500 rounded-full" />
                  </div>
                  <span className="text-sm font-semibold text-white">1.5 / 10 GB</span>
                </div>
              </div>
            </div>

            <button className="w-full mt-8 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">
              Fazer Upgrade
            </button>
          </div>

          {/* Help Card */}
          <div className="bg-[#141414] rounded-2xl border border-[#262626] p-6 hover:border-blue-500/50 transition-colors cursor-pointer group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <HelpCircle className="size-6 text-blue-400" />
            </div>
            <h4 className="font-bold text-white mb-2">Agendar Demo Gratuita</h4>
            <p className="text-sm text-zinc-400 mb-4">
              Agende uma chamada pelo Zoom com um especialista e descubra como escalar suas vendas.
            </p>
            <span className="text-sm font-bold text-blue-400 group-hover:text-blue-300">Marcar reunião →</span>
          </div>
        </div>

        {/* 3. Main Content (Right Column - 2 span) */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          
          {/* Tutorials / Onboarding */}
          <div className="bg-[#141414] rounded-2xl border border-[#262626] p-1">
            <div className="p-5 border-b border-[#262626] flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Check className="size-5 text-blue-400" />
                Missões de Configuração
              </h3>
              <span className="text-xs font-medium text-zinc-500">0 de 3 concluídas</span>
            </div>
            
            <div className="p-2 space-y-1">
              
              <div className="p-4 rounded-xl hover:bg-[#1a1a1a] transition-colors border border-transparent hover:border-[#262626] flex flex-col sm:flex-row gap-4 sm:items-center justify-between group cursor-pointer">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-[#222] border border-[#333] flex items-center justify-center shrink-0 group-hover:border-blue-500/50 transition-colors">
                    <MessageSquare className="size-4 text-zinc-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-200 mb-1">Conectar canais de chat</h4>
                    <p className="text-sm text-zinc-500">Integre WhatsApp, Instagram ou TikTok para unificar as mensagens.</p>
                  </div>
                </div>
                <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0">
                  Conectar Canal
                </button>
              </div>

              <div className="p-4 rounded-xl hover:bg-[#1a1a1a] transition-colors border border-transparent hover:border-[#262626] flex flex-col sm:flex-row gap-4 sm:items-center justify-between group cursor-pointer">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-[#222] border border-[#333] flex items-center justify-center shrink-0 group-hover:border-purple-500/50 transition-colors">
                    <BotIcon className="size-4 text-zinc-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-200 mb-1">Treinar Inteligência Artificial</h4>
                    <p className="text-sm text-zinc-500">Faça o upload do seu PDF de produtos para a IA aprender a vender.</p>
                  </div>
                </div>
                <button className="bg-[#222] hover:bg-[#333] border border-[#333] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0">
                  Treinar IA
                </button>
              </div>

              <div className="p-4 rounded-xl hover:bg-[#1a1a1a] transition-colors border border-transparent hover:border-[#262626] flex flex-col sm:flex-row gap-4 sm:items-center justify-between group cursor-pointer">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-[#222] border border-[#333] flex items-center justify-center shrink-0 group-hover:border-emerald-500/50 transition-colors">
                    <Users className="size-4 text-zinc-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-zinc-200">Convidar Equipe</h4>
                      <span className="text-[10px] uppercase font-bold text-zinc-500 bg-[#222] px-2 py-0.5 rounded">Opcional</span>
                    </div>
                    <p className="text-sm text-zinc-500">Traga seus vendedores para colaborar no fechamento de negócios.</p>
                  </div>
                </div>
                <button className="bg-[#222] hover:bg-[#333] border border-[#333] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0">
                  Adicionar Membros
                </button>
              </div>

            </div>
          </div>

          {/* Novidades Banner */}
          <div className="bg-[#141414] rounded-2xl border border-[#262626] overflow-hidden group cursor-pointer relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-purple-500/20 text-purple-400 text-xs font-bold px-2 py-1 rounded">ATUALIZAÇÃO</span>
                  <span className="text-zinc-500 text-sm">Maio 2026</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 transition-all">
                  Descubra os novos Agentes de Voz
                </h3>
                <p className="text-zinc-400">
                  Agora a IA pode ligar para os seus leads, agendar reuniões e qualificar clientes pelo telefone de forma 100% autônoma.
                </p>
              </div>
              
              <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-white transition-all">
                <Play className="size-6 text-white group-hover:text-black ml-1 fill-current" />
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

// Simple fallback icon if lucide Bot doesn't look exact
function BotIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  );
}
