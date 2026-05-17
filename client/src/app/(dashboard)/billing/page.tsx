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
import { PageHeader } from '@/components/system/PageHeader';
import { ProgressMetric } from '@/components/system/ProgressMetric';
import { motion } from 'framer-motion';

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
        const subResponse = await axios.get<SubscriptionData>(`${apiUrl}/billing/subscription`);
        setSub(subResponse.data);
        setUsage({
          users: 2,
          whatsAppInstances: 1,
          pipelines: 1,
        });
        setIsDemoMode(false);
      } catch (error) {
        setIsDemoMode(true);
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
        await new Promise((resolve) => setTimeout(resolve, 1200));
        setSub({
          status: 'ACTIVE',
          planId: planId,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
        if (planId === 'PRO') {
          setUsage(prev => ({ ...prev, users: 3, pipelines: 2 }));
        } else if (planId === 'ENTERPRISE') {
          setUsage(prev => ({ ...prev, users: 4, whatsAppInstances: 2 }));
        }
        setMessage({
          type: 'success',
          text: `Upgrade para o plano ${planId} realizado com sucesso (Simulação de Checkout)!`
        });
        setUpgradingPlan(null);
        return;
      }

      const response = await axios.post<{ url: string }>(`${apiUrl}/billing/checkout/${planId}`);
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
        text: 'Não foi possível iniciar o checkout. Verifique a chave ou o servidor de cobrança.'
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-500 space-y-4">
        <Loader2 className="size-10 text-blue-500 animate-spin" />
        <p className="text-zinc-400">Carregando seus dados de faturamento e limites...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-16">
      
      {/* PageHeader com Alerta de Demo se aplicável */}
      <PageHeader 
        title="Planos & Faturamento"
        description="Gerencie sua assinatura, visualize limites de consumo e realize upgrades."
        actions={
          isDemoMode && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm">
              <AlertTriangle className="size-4 text-amber-500" />
              Modo de Simulação Ativo
            </div>
          )
        }
      />

      {/* Mensagens de Feedback */}
      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border ${
            message.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            {message.type === 'success' ? <ShieldCheck className="size-5 text-emerald-500" /> : <AlertTriangle className="size-5 text-red-500" />}
            <span>{message.text}</span>
          </div>
        </motion.div>
      )}

      {/* Assinatura Atual & Recursos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Assinatura Atual Card */}
        <Card className="border-zinc-200 bg-white rounded-2xl shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-zinc-900 text-lg">Assinatura Atual</CardTitle>
                <CardDescription className="text-zinc-500">Contrato sob compliance</CardDescription>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                sub.status === 'ACTIVE' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                  : 'bg-red-50 text-red-700 border-red-100'
              }`}>
                {sub.status === 'ACTIVE' ? 'Ativo' : 'Pendente'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Plano Ativo</p>
              <h3 className="text-2xl font-black text-zinc-900 mt-1">
                Pulse {getPlanDetails(sub.planId).name}
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{getPlanDetails(sub.planId).desc}</p>
            </div>

            <div className="flex items-baseline gap-1 pt-4 border-t border-zinc-100">
              <span className="text-3xl font-extrabold text-zinc-900">{getPlanDetails(sub.planId).price}</span>
              <span className="text-zinc-500 text-xs">/ mês</span>
            </div>

            {sub.currentPeriodEnd && (
              <div className="flex items-center gap-2 text-xs text-zinc-500 pt-4 border-t border-zinc-100">
                <Calendar className="size-4 text-blue-500" />
                <span>Renovação: {new Date(sub.currentPeriodEnd).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recursos Limites Card */}
        <Card className="border-zinc-200 bg-white rounded-2xl shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-zinc-900 text-lg">Uso dos Recursos</CardTitle>
            <CardDescription className="text-zinc-500">Métricas operacionais de consumo do seu plano.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-5 bg-zinc-50 border border-zinc-200/60 rounded-xl">
              <ProgressMetric 
                label="Usuários Ativos"
                value={Math.round((usage.users / currentLimits.users) * 100)}
                info={`${usage.users}/${currentLimits.users >= 999 ? '∞' : currentLimits.users}`}
                icon={Users}
              />
            </div>

            <div className="p-5 bg-zinc-50 border border-zinc-200/60 rounded-xl">
              <ProgressMetric 
                label="WhatsApp"
                value={Math.round((usage.whatsAppInstances / currentLimits.whatsAppInstances) * 100)}
                info={`${usage.whatsAppInstances}/${currentLimits.whatsAppInstances >= 999 ? '∞' : currentLimits.whatsAppInstances}`}
                icon={MessageSquare}
              />
            </div>

            <div className="p-5 bg-zinc-50 border border-zinc-200/60 rounded-xl">
              <ProgressMetric 
                label="Pipelines"
                value={Math.round((usage.pipelines / currentLimits.pipelines) * 100)}
                info={`${usage.pipelines}/${currentLimits.pipelines >= 999 ? '∞' : currentLimits.pipelines}`}
                icon={Kanban}
              />
            </div>

          </CardContent>
        </Card>
      </div>

      {/* Tabela de Preços Kirvano Style */}
      <div className="space-y-6 pt-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-zinc-900 flex items-center justify-center gap-2">
            <Sparkles className="size-5 text-blue-600" />
            Escolha o Plano Perfeito para Escalar
          </h2>
          <p className="text-zinc-500 text-sm">Atualize seu plano para desbloquear novas conexões do WhatsApp, mais funis e robôs automáticos.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          
          {/* Starter */}
          <PricingCard 
            title="Starter"
            price="R$ 99"
            desc="Melhor para profissionais liberais, corretores e micro-empresários operarem."
            features={[
              'Até 3 Usuários ativos',
              '1 Instância de WhatsApp',
              '1 Funil de Negócios (Pipeline)',
              'Relatórios Básicos',
              'Suporte via Email'
            ]}
            isActive={sub.planId.toUpperCase() === 'STARTER'}
            onSelect={() => handleUpgrade('STARTER')}
            loading={upgradingPlan === 'STARTER'}
          />

          {/* Pro */}
          <PricingCard 
            title="Pro"
            price="R$ 199"
            desc="Para agências com múltiplos agentes de venda e empresas em crescimento."
            features={[
              'Até 10 Usuários ativos',
              'Até 3 Instâncias de WhatsApp',
              'Até 5 Funis de Negócios',
              'Automações e Fluxos de IA',
              'Relatórios IA Avançados',
              'Suporte Prioritário por Chat'
            ]}
            isRecommended={true}
            isActive={sub.planId.toUpperCase() === 'PRO'}
            onSelect={() => handleUpgrade('PRO')}
            loading={upgradingPlan === 'PRO'}
          />

          {/* Enterprise */}
          <PricingCard 
            title="Enterprise"
            price="R$ 499"
            desc="Soluções corporativas escaláveis com volume ilimitado."
            features={[
              'Usuários ILIMITADOS',
              'WhatsApp ILIMITADO',
              'Pipelines ILIMITADOS',
              'Servidor e Banco dedicados',
              'Relatórios de Auditoria',
              'Suporte 24/7 de Conta'
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

/* PricingCard local formatado */
function PricingCard({ title, price, desc, features, isRecommended, isActive, onSelect, loading }: any) {
  return (
    <Card className={`relative flex flex-col h-full bg-white transition-all duration-300 hover:-translate-y-1 shadow-sm border ${
      isActive 
        ? 'border-emerald-500 ring-1 ring-emerald-500/20' 
        : isRecommended 
          ? 'border-blue-600 ring-1 ring-blue-600/10 shadow-md' 
          : 'border-zinc-200'
    }`}>
      {isRecommended && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full shadow-sm">
          Recomendado
        </span>
      )}

      {isActive && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full shadow-sm">
          Plano Atual
        </span>
      )}

      <CardHeader className="pt-8 text-center pb-4">
        <h3 className="text-xl font-bold text-zinc-900">{title}</h3>
        <p className="text-xs text-zinc-500 mt-2 min-h-[40px] leading-relaxed">{desc}</p>
        <div className="flex items-baseline justify-center gap-1 mt-4">
          <span className="text-4xl font-extrabold text-zinc-900">{price}</span>
          <span className="text-zinc-500 text-xs">/ mês</span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between pt-4 border-t border-zinc-100 space-y-6">
        <ul className="space-y-3.5">
          {features.map((feature: string, idx: number) => (
            <li key={idx} className="flex items-start gap-3 text-xs text-zinc-600">
              <div className={`p-0.5 rounded-full mt-0.5 ${isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                <Check className="size-3" />
              </div>
              <span className="leading-normal">{feature}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={onSelect}
          disabled={isActive || loading}
          className={`w-full py-3 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${
            isActive
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 cursor-default font-semibold'
              : isRecommended
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                : 'bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 shadow-sm'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin text-zinc-400" />
              <span>Processando...</span>
            </>
          ) : isActive ? (
            <span>Plano Contratado</span>
          ) : (
            <>
              <span>Contratar Plano</span>
              <ArrowUpRight className="size-4" />
            </>
          )}
        </button>
      </CardContent>
    </Card>
  );
}
