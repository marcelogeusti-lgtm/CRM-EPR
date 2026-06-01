// Removido import de video
import Link from 'next/link';
import { ArrowRight, Globe, BarChart3, MessageSquare, Zap, Palette, Phone } from 'lucide-react';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-purple-500/30">
      
      {/* Header */}
      <header className="fixed inset-x-0 top-4 z-50 mx-auto flex w-[calc(100%-2rem)] max-w-5xl flex-col rounded-full border border-white/5 bg-[#0a0a0a]/50 backdrop-blur-md transition-all duration-300">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              <Zap className="size-4 text-white fill-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Nexus</span>
          </div>
          
          <nav className="hidden items-center gap-8 text-[13px] font-medium text-white/55 md:flex">
            <a className="transition-colors duration-200 hover:text-white" href="#features">Recursos</a>
            <a className="transition-colors duration-200 hover:text-white" href="#modes">Como Funciona</a>
            <a className="transition-colors duration-200 hover:text-white" href="#pricing">Preços</a>
          </nav>
          
          <div className="hidden items-center gap-4 md:flex">
            <Link className="rounded-full px-4 py-2 text-[13px] font-medium text-white/65 transition-colors duration-200 hover:text-white hover:bg-white/[0.05]" href="/login">
              Entrar
            </Link>
            <Link className="group inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2 text-[13px] font-bold text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-200 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]" href="/login">
              Começar Agora
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex flex-col overflow-hidden min-h-screen pt-32 pb-16 w-full">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* O Vídeo sendo servido pela pasta Public de forma tradicional e garantida */}
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover opacity-100"
          >
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-6 lg:px-16 mx-auto w-full max-w-7xl">
          <div className="mb-8 animate-fade-in-up">
            <span className="inline-flex items-center gap-3 font-mono text-sm text-white/60">
              <span className="hidden sm:block h-px w-8 bg-blue-500"></span>
              A Nova Era do CRM
              <span className="hidden sm:block h-px w-8 bg-blue-500"></span>
            </span>
          </div>
          
          <h1 className="flex flex-col font-light tracking-tight text-white mb-6" style={{ fontSize: 'clamp(2.5rem, 6.5vw, 5.5rem)', lineHeight: 1.1 }}>
            <span className="whitespace-nowrap">Conecte seus canais.</span>
            <span className="relative inline-flex shrink-0 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 px-6 pt-2 pb-3 shadow-[0_0_30px_rgba(168,85,247,0.15)] mt-4 mx-auto w-fit">
              <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                A IA atende.
              </span>
            </span>
          </h1>
          
          <p className="mt-6 w-full max-w-3xl text-[16px] md:text-[18px] leading-relaxed text-white/60 mx-auto">
            Dê adeus ao atendimento manual. O Nexus é um CRM projetado para a era da Inteligência Artificial. Centralize WhatsApp, Instagram e TikTok, e deixe nossa IA responder, qualificar e agendar reuniões por você 24 horas por dia.
          </p>
          
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center w-full max-w-md mx-auto sm:max-w-none">
            <Link className="group inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-[15px] font-semibold text-black shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-200 hover:shadow-[0_0_40px_rgba(255,255,255,0.5)] sm:w-auto" href="/login">
              Criar Conta Gratuita
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <a href="#demo" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-8 py-4 text-[15px] font-medium text-white/80 backdrop-blur-sm transition-colors duration-200 hover:border-white/20 hover:bg-white/[0.05] sm:w-auto">
              Assistir Demo (30s)
            </a>
          </div>
        </div>

        {/* Stats Row */}
        <div className="relative z-10 border-t border-white/[0.05] px-6 py-8 lg:px-16 mx-auto w-full max-w-7xl mt-20">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-10 lg:gap-24 text-center">
            <div className="flex flex-col gap-1.5 items-center">
              <span className="text-4xl lg:text-5xl font-light tracking-tight text-white">4,200+</span>
              <span className="text-xs uppercase tracking-widest text-white/50">Lojas usando Nexus</span>
            </div>
            <div className="flex flex-col gap-1.5 items-center">
              <span className="text-4xl lg:text-5xl font-light tracking-tight text-white">2.1M</span>
              <span className="text-xs uppercase tracking-widest text-white/50">Mensagens Automatizadas</span>
            </div>
            <div className="flex flex-col gap-1.5 items-center">
              <span className="text-4xl lg:text-5xl font-light tracking-tight text-white">4.9/5</span>
              <span className="text-xs uppercase tracking-widest text-white/50">Avaliação Média</span>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee Infinite Scroll */}
      <div className="overflow-hidden border-y border-white/[0.04] bg-[#050505] py-4 select-none flex relative">
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#050505] to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#050505] to-transparent z-10" />
        
        <div className="flex shrink-0 animate-[marqueeLeft_30s_linear_infinite]">
          {[
            "E-commerce", "Imobiliárias", "Clínicas Médicas", "Infoprodutores", 
            "Agências de Marketing", "Advogados", "Academias", "Restaurantes",
            "E-commerce", "Imobiliárias", "Clínicas Médicas", "Infoprodutores", 
            "Agências de Marketing", "Advogados", "Academias", "Restaurantes"
          ].map((niche, idx) => (
            <div key={idx} className="flex items-center gap-5 shrink-0 px-8 border-r border-white/[0.04]">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500/50" />
              <span className="text-[14px] whitespace-nowrap tracking-wide text-white/60">{niche}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Features / Bento Grid */}
      <section id="features" className="relative px-6 py-24 sm:py-32 mx-auto max-w-7xl">
        <div className="mb-16 max-w-2xl mx-auto text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-blue-400">Plataforma Completa</p>
          <h2 className="mt-3 text-[32px] font-light leading-tight tracking-tight text-white sm:text-[44px]">
            Tudo o que você precisa.<br />Nenhum sistema legado.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Card 1: Omnichannel IA */}
          <div className="group relative overflow-hidden rounded-[32px] bg-[#111] border border-white/[0.04] transition-colors hover:border-white/10 md:col-span-8 p-10 flex flex-col justify-end min-h-[400px]">
            <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.15),transparent_60%)]" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay" />
            
            <div className="relative z-10 w-full md:w-2/3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.08] text-purple-400 mb-6">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="text-[26px] font-light tracking-tight text-white mb-3">Omnichannel Nativo.</h3>
              <p className="text-[15px] leading-relaxed text-white/50">
                Conecte Instagram Direct, WhatsApp e Webchat em uma única caixa de entrada inteligente. A IA analisa o contexto e responde de forma humanizada.
              </p>
            </div>
          </div>

          {/* Card 2: Analytics */}
          <div className="group relative overflow-hidden rounded-[32px] bg-[#111] border border-white/[0.04] transition-colors hover:border-white/10 md:col-span-4 p-10 flex flex-col">
             <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.15),transparent_60%)]" />
             <div className="relative z-10 h-full flex flex-col">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.08] text-blue-400 mb-6">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="text-[22px] font-medium tracking-tight text-white mb-3">Métricas Reais</h3>
                <p className="text-[14px] leading-relaxed text-white/50 flex-grow">
                  Acompanhe taxas de conversão, tempo de resposta da IA e ROI de campanhas em tempo real.
                </p>
             </div>
          </div>

          {/* Card 3: Mobile Ready */}
          <div className="group relative overflow-hidden rounded-[32px] bg-[#111] border border-white/[0.04] transition-colors hover:border-white/10 md:col-span-4 p-10 flex flex-col">
             <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.1),transparent_60%)]" />
             <div className="relative z-10 h-full flex flex-col">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.08] text-emerald-400 mb-6">
                  <Phone className="h-6 w-6" />
                </div>
                <h3 className="text-[22px] font-medium tracking-tight text-white mb-3">App Integrado</h3>
                <p className="text-[14px] leading-relaxed text-white/50 flex-grow">
                  Assuma o controle a qualquer momento. Se a IA detectar que um humano é necessário, você recebe uma notificação na hora.
                </p>
             </div>
          </div>

          {/* Card 4: Funil Kanban */}
          <div className="group relative overflow-hidden rounded-[32px] bg-[#111] border border-white/[0.04] transition-colors hover:border-white/10 md:col-span-8 p-10 flex flex-col justify-end min-h-[300px]">
             <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.1),transparent_80%)]" />
             <div className="relative z-10 w-full md:w-2/3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.08] text-pink-400 mb-6">
                  <Palette className="h-6 w-6" />
                </div>
                <h3 className="text-[26px] font-light tracking-tight text-white mb-3">Funil Automático.</h3>
                <p className="text-[15px] leading-relaxed text-white/50">
                  Quando a IA converte um lead, ele é movido automaticamente pelo Kanban. Menos cliques, mais fechamentos.
                </p>
             </div>
          </div>

        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative py-24 sm:py-32 overflow-hidden border-t border-white/[0.05]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.15),transparent_50%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-light tracking-tight text-white mb-8">
            Pronto para revolucionar seu atendimento?
          </h2>
          <Link className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-10 py-5 text-[16px] font-semibold text-black shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(255,255,255,0.4)]" href="/login">
            Criar Conta Gratuitamente
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

    </div>
  );
}
