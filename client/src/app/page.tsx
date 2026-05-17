import Link from "next/link";
import { ArrowRight, MessageSquare, LayoutDashboard, BarChart3, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[150px] -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[150px] -z-10" />

      {/* Header */}
      <header className="container mx-auto px-6 py-6 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg">P</div>
          <span className="text-xl font-bold tracking-tight">PulseERP</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <Link href="#features" className="hover:text-white transition-colors">Funcionalidades</Link>
          <Link href="#solutions" className="hover:text-white transition-colors">Soluções</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Preços</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Entrar</Link>
          <Link href="/register">
            <Button className="bg-white text-black hover:bg-gray-200 font-semibold rounded-full px-6">
              Começar Grátis
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-24 pb-32 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium mb-8 text-blue-400">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          A Plataforma Omnichannel Completa
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
          O Único Sistema que a <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Sua Empresa Precisa.
          </span>
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12">
          Unifique seu CRM, Gestão Financeira (ERP) e Atendimento por WhatsApp em um único painel intuitivo e poderoso. Feito para escalar suas vendas.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full px-8 py-6 text-lg w-full sm:w-auto transition-all hover:scale-105">
              Criar Conta Gratuita <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="#features">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 font-semibold rounded-full px-8 py-6 text-lg w-full sm:w-auto">
              Ver Demonstração
            </Button>
          </Link>
        </div>

        {/* Dashboard Mockup Preview */}
        <div className="mt-20 relative mx-auto max-w-5xl">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-10" />
          <img 
            src="/assets/dashboard.png" 
            alt="PulseERP Dashboard" 
            className="rounded-xl border border-white/10 shadow-2xl shadow-blue-500/20"
          />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-24 relative z-10 border-t border-white/10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Tudo em um só lugar</h2>
          <p className="text-gray-400 max-w-xl mx-auto">Nossa arquitetura SaaS Multi-tenant entrega as ferramentas mais modernas do mercado para o seu time de vendas e suporte.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-6 text-green-400">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">WhatsApp Omnichannel</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Integração nativa com a API Oficial da Meta. Atenda todos os seus clientes em um único número com múltiplos atendentes.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-6 text-blue-400">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">CRM Kanban</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Arraste e solte seus cards de vendas. Acompanhe cada etapa do funil e não perca nenhuma oportunidade de negócio.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-6 text-purple-400">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Gestão ERP e Financeiro</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Emissão de faturas, controle de contas a pagar/receber e relatórios de fluxo de caixa em tempo real.
            </p>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="container mx-auto px-6 py-24 text-center relative z-10">
        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-white/10 rounded-3xl p-12 max-w-4xl mx-auto">
          <Building2 className="w-12 h-12 mx-auto mb-6 text-white" />
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Pronto para transformar sua empresa?</h2>
          <p className="text-gray-300 mb-8 max-w-lg mx-auto">Junte-se a milhares de empresas que já gerenciam suas vendas e atendimento pelo PulseERP.</p>
          <Link href="/register">
            <Button className="bg-white text-black hover:bg-gray-200 font-semibold rounded-full px-8 py-6 text-lg w-full sm:w-auto">
              Criar Conta Gratuita
            </Button>
          </Link>
        </div>
      </section>
      
      {/* Footer Minimal */}
      <footer className="container mx-auto px-6 py-8 border-t border-white/10 text-center text-sm text-gray-500">
        <p>&copy; 2026 PulseERP. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
