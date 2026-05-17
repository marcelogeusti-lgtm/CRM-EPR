'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { 
  CreditCard, 
  Zap, 
  Check, 
  Users, 
  MessageSquare, 
  Kanban, 
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  Loader2
} from 'lucide-react';

interface SubscriptionData {
  status: string;
  planId: string;
  currentPeriodEnd: string | null;
}

export default function BillingPage() {
  const { tenant } = useAuth();
  const [sub, setSub] = useState<SubscriptionData>({
    status: 'ACTIVE',
    planId: 'STARTER',
    currentPeriodEnd: null,
  });
  const [usage, setUsage] = useState({
    users: 2,
    whatsAppInstances: 1,
    pipelines: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        
        // Obter Assinatura do Backend
        const subResponse = await axios.get<SubscriptionData>(`${apiUrl}/billing/subscription`);
        setSub(subResponse.data);

        // Para os limites de uso, vamos buscar contagens dinâmicas ou assumir mocks baseados no tenant real
        // Na vida real faríamos chamadas como /users/count, /whatsapp/count, /pipelines/count
        setUsage({
          users: 2,
          whatsAppInstances: 1,
          pipelines: 1,
        });
        setIsDemoMode(false);
      } catch (error) {
        console.warn("Backend de Billing offline. Ativando modo de demonstração interativo.");
        setIsDemoMode(true);
        // Mocks de demonstração integrados
        setSub({
          status: 'ACTIVE',
          planId: (tenant?.plan || 'STARTER').toUpperCase(),
          currentPeriodEnd: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000).toISOString(),
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBillingData();
  }, [tenant]);

  const handleUpgrade = async (planId: string) => {
    setUpgradingPlan(planId);
    setMessage(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      if (isDemoMode) {
        // Simular checkout no modo demo
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        // Atualizar mock local
        setSub({
          status: 'ACTIVE',
          planId: planId,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
        
        // Mudar limites mockados baseados no plano
        if (planId === 'PRO') {
          setUsage(prev => ({ ...prev, users: 3, pipelines: 2 }));
        } else if (planId === 'ENTERPRISE') {
          setUsage(prev => ({ ...prev, users: 4, whatsAppInstances: 2 }));
        }

        setMessage({
          type: 'success',
          text: `Upgrade para o plano ${planId} realizado com sucesso (Modo Demo)!`
        });
        setUpgradingPlan(null);
        return;
      }

      // Fluxo real integrado com o Backend
      const response = await axios.post<{ url: string }>(`${apiUrl}/billing/checkout/${planId}`);
      
      // Abrir página de checkout do Stripe/Asaas
      if (response.data?.url) {
        window.open(response.data.url, '_blank');
        setMessage({
          type: 'success',
          text: 'Redirecionando para a página de faturamento segura do gateway de pagamento...'
        });
      } else {
        throw new Error('Retorno inválido do backend.');
      }
    } catch (err: any) {
      console.error(err);
      setMessage({
        type: 'error',
        text: 'Não foi possível iniciar o checkout. Verifique sua conexão ou tente novamente mais tarde.'
      });
    } finally {
      setUpgradingPlan(null);
    }
  };

  const getPlanDetails = (planId: string) => {
    switch (planId.toUpperCase()) {
      case 'STARTER':
        return { name: 'Starter', price: 'R$ 99', desc: 'Ideal para profissionais independentes e microempresas.' };
      case 'PRO':
        return { name: 'Pro', price: 'R$ 199', desc: 'Melhor opção para agências e times em crescimento acelerado.' };
      case 'ENTERPRISE':
        return { name: 'Enterprise', price: 'R$ 499', desc: 'Solução sob medida para corporações com alto volume.' };
      default:
        return { name: planId, price: 'Personalizado', desc: 'Entre em contato com o suporte.' };
    }
  };

  const planLimits = {
    STARTER: { users: 3, whatsAppInstances: 1, pipelines: 1 },
    PRO: { users: 10, whatsAppInstances: 3, pipelines: 5 },
    ENTERPRISE: { users: 9999, whatsAppInstances: 9999, pipelines: 9999 },
  };

  const currentLimits = planLimits[sub.planId.toUpperCase() as keyof typeof planLimits] || planLimits.STARTER;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white space-y-4">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
        <p className="text-gray-400">Carregando seus dados de faturamento e limites...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Zap className="h-8 w-8 text-blue-500" />
            Planos & Faturamento
          </h1>
          <p className="text-gray-400 mt-1">Gerencie sua assinatura, visualize limites de consumo e faça upgrades.</p>
        </div>

        {isDemoMode && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-2 rounded-xl text-sm flex items-center gap-2 animate-pulse">
            <AlertTriangle className="h-4 w-4" />
            Modo de Demonstração Ativo
          </div>
        )}
      </div>

      {/* Mensagens de feedback */}
      {message && (
        <div className={`p-4 rounded-xl border animate-in slide-in-from-top duration-300 ${
          message.type === 'success' 
            ? 'bg-green-500/10 border-green-500/20 text-green-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <ShieldCheck className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            <span className="font-medium text-sm">{message.text}</span>
          </div>
        </div>
      )}

      {/* Grid: Assinatura Atual & Consumo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card Assinatura Atual */}
        <Card className="glass-dark border-white/5 bg-gradient-to-br from-black/60 to-blue-950/20">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-white text-xl">Assinatura Atual</CardTitle>
                <CardDescription className="text-gray-500">Detalhes do plano contratado</CardDescription>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                sub.status === 'ACTIVE' 
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {sub.status === 'ACTIVE' ? 'Ativo' : 'Atrasado / Suspenso'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Plano Atual</p>
              <h3 className="text-2xl font-black text-white mt-1 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                PulseERP {getPlanDetails(sub.planId).name}
              </h3>
              <p className="text-sm text-gray-400 mt-2">{getPlanDetails(sub.planId).desc}</p>
            </div>

            <div className="flex items-baseline gap-2 pt-2 border-t border-white/5">
              <span className="text-3xl font-black text-white">{getPlanDetails(sub.planId).price}</span>
              <span className="text-gray-500 text-sm">/ mês</span>
            </div>

            {sub.currentPeriodEnd && (
              <div className="flex items-center gap-2 text-sm text-gray-400 pt-4 border-t border-white/5">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span>Renovação automática: {new Date(sub.currentPeriodEnd).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Consumo de Limites do Plano (2 Cards de largura no desktop) */}
        <Card className="glass-dark border-white/5 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white text-xl">Uso dos Recursos</CardTitle>
            <CardDescription className="text-gray-500">Seus limites estáticos baseados no plano {getPlanDetails(sub.planId).name}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Usuários */}
            <LimitProgress 
              title="Usuários Ativos"
              current={usage.users}
              limit={currentLimits.users}
              icon={Users}
              color="from-blue-500 to-indigo-500"
              colorGlow="rgba(59, 130, 246, 0.4)"
            />

            {/* WhatsApp */}
            <LimitProgress 
              title="Conexões WhatsApp"
              current={usage.whatsAppInstances}
              limit={currentLimits.whatsAppInstances}
              icon={MessageSquare}
              color="from-emerald-500 to-teal-500"
              colorGlow="rgba(16, 185, 129, 0.4)"
            />

            {/* Pipelines */}
            <LimitProgress 
              title="Pipelines de Venda"
              current={usage.pipelines}
              limit={currentLimits.pipelines}
              icon={Kanban}
              color="from-purple-500 to-pink-500"
              colorGlow="rgba(168, 85, 247, 0.4)"
            />

          </CardContent>
        </Card>
      </div>

      {/* Tabela de Planos de Próxima Geração */}
      <div className="space-y-6 pt-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
            Escolha o Plano Perfeito para Escalar
          </h2>
          <p className="text-gray-400 text-sm">Atualize seu plano para desbloquear novas integrações do WhatsApp, mais usuários no seu time de suporte e automações robóticas.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          
          {/* Plano STARTER */}
          <PricingCard 
            title="Starter"
            price="R$ 99"
            desc="Melhor para profissionais liberais, corretores e micro-empresários começarem a operar em canais digitais."
            features={[
              'Até 3 Usuários do painel',
              '1 Instância de WhatsApp (Meta API)',
              '1 Funil de Negócios (Pipeline)',
              'Relatórios Básicos de Venda',
              'Suporte via Email'
            ]}
            isActive={sub.planId.toUpperCase() === 'STARTER'}
            onSelect={() => handleUpgrade('STARTER')}
            loading={upgradingPlan === 'STARTER'}
          />

          {/* Plano PRO */}
          <PricingCard 
            title="Pro"
            price="R$ 199"
            desc="Para agências de marketing, corretoras com múltiplos agentes de venda e empresas em pleno crescimento."
            features={[
              'Até 10 Usuários do painel',
              'Até 3 Instâncias de WhatsApp',
              'Até 5 Funis de Negócios',
              'Automações e Eventos em tempo real',
              'Relatórios Avançados de Conversão',
              'Suporte Prioritário por Chat/WhatsApp'
            ]}
            isRecommended={true}
            isActive={sub.planId.toUpperCase() === 'PRO'}
            onSelect={() => handleUpgrade('PRO')}
            loading={upgradingPlan === 'PRO'}
          />

          {/* Plano ENTERPRISE */}
          <PricingCard 
            title="Enterprise"
            price="R$ 499"
            desc="Ideal para grandes operações White-Label, franquias e empresas que necessitam de isolamento pesado e recursos infinitos."
            features={[
              'Usuários ILIMITADOS',
              'WhatsApp ILIMITADO',
              'Pipelines ILIMITADOS',
              'Opção White-Label (sua marca)',
              'Servidor Dedicado e Redis isolado',
              'Suporte 24/7 com Gerente de Contas'
            ]}
            isActive={sub.planId.toUpperCase() === 'ENTERPRISE'}
            onSelect={() => handleUpgrade('ENTERPRISE')}
            loading={upgradingPlan === 'ENTERPRISE'}
          />

        </div>
      </div>
    </div>
  );
}

/* Subcomponente: Widget de Progresso dos Limites */
function LimitProgress({ title, current, limit, icon: Icon, color, colorGlow }: any) {
  const isUnlimited = limit >= 999;
  const percent = isUnlimited ? 0 : Math.min(100, Math.round((current / limit) * 100));
  
  return (
    <div className="p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300 relative overflow-hidden group">
      {/* Glow Effect */}
      <div 
        className="absolute -top-12 -right-12 w-24 h-24 rounded-full blur-2xl transition-opacity duration-300 opacity-20 group-hover:opacity-40"
        style={{ backgroundColor: colorGlow }}
      />

      <div className="flex justify-between items-start">
        <span className="text-gray-400 text-xs font-semibold uppercase">{title}</span>
        <div className={`p-2 rounded-lg bg-gradient-to-r ${color} text-white`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-3xl font-black text-white">
            {current}
          </span>
          <span className="text-gray-500 text-xs">
            de {isUnlimited ? '∞' : limit} disponíveis
          </span>
        </div>

        {!isUnlimited ? (
          <div className="space-y-1.5 pt-2">
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-1000 ease-out`}
                style={{ 
                  width: `${percent}%`,
                  boxShadow: `0 0 10px ${colorGlow}` 
                }} 
              />
            </div>
            <div className="flex justify-end text-[10px] text-gray-500 font-medium">
              {percent}% de uso
            </div>
          </div>
        ) : (
          <div className="pt-3 flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
            <Check className="h-3.5 w-3.5" />
            Recurso Ilimitado
          </div>
        )}
      </div>
    </div>
  );
}

/* Subcomponente: Pricing Plan Card */
function PricingCard({ title, price, desc, features, isRecommended, isActive, onSelect, loading }: any) {
  return (
    <Card className={`relative flex flex-col h-full bg-[#0d0d0d] transition-all duration-500 hover:-translate-y-2 group border-white/5 ${
      isRecommended 
        ? 'ring-2 ring-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)] bg-gradient-to-b from-[#111] to-[#0d0d0d] hover:border-blue-500/25' 
        : 'hover:border-white/10 shadow-xl'
    } ${
      isActive ? 'border-emerald-500/30 ring-1 ring-emerald-500/20' : ''
    }`}>
      {/* Recommended Tag */}
      {isRecommended && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.6)]">
          Recomendado
        </span>
      )}

      {/* Active Tag */}
      {isActive && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.6)]">
          Plano Contratado
        </span>
      )}

      <CardHeader className="pt-8 text-center pb-4">
        <h3 className="text-xl font-bold text-white group-hover:scale-105 transition-transform duration-300">{title}</h3>
        <p className="text-xs text-gray-500 mt-2 min-h-[40px] leading-relaxed">{desc}</p>
        <div className="flex items-baseline justify-center gap-1 mt-4">
          <span className="text-4xl font-extrabold text-white">{price}</span>
          <span className="text-gray-500 text-sm">/ mês</span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between pt-4 border-t border-white/5 space-y-6">
        <ul className="space-y-3.5">
          {features.map((feature: string, idx: number) => (
            <li key={idx} className="flex items-start gap-3 text-xs text-gray-400">
              <div className={`p-0.5 rounded-full mt-0.5 ${isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                <Check className="h-3 w-3" />
              </div>
              <span className="leading-normal">{feature}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={onSelect}
          disabled={isActive || loading}
          className={`w-full py-3.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${
            isActive
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
              : isRecommended
                ? 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                : 'bg-white/5 hover:bg-white/10 text-white border border-white/5 hover:border-white/10'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <span>Processando...</span>
            </>
          ) : isActive ? (
            <span>Plano Atual</span>
          ) : (
            <>
              <span>Contratar Plano</span>
              <ArrowUpRight className="h-4 w-4" />
            </>
          )}
        </button>
      </CardContent>
    </Card>
  );
}
