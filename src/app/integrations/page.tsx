'use client';

import React, { useState, useEffect } from 'react';
import { Search, Puzzle, Star, Zap, MessageCircle, Phone, CreditCard, Box, Settings, CheckCircle2, X, Info } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { saveIntegration, getIntegrations, subscribeWhatsappWebhook, syncWhatsappProfile, registerWhatsappNumber } from '@/actions/integrations';
import type { WhatsappProfile } from '@/lib/whatsapp';
import { withRetry } from '@/lib/withRetry';
import { MOCK_INTEGRATIONS } from '@/lib/integrationCatalog';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

const CATEGORIES = [
  { id: 'all', name: 'Todas', icon: Box },
  { id: 'installed', name: 'Instaladas', icon: CheckCircle2 },
  { id: 'messages', name: 'Mensagens', icon: MessageCircle },
  { id: 'automation', name: 'Automação & IA', icon: Zap },
  { id: 'payments', name: 'Pagamentos', icon: CreditCard },
  { id: 'tools', name: 'Ferramentas', icon: Settings },
];

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [selectedApp, setSelectedApp] = useState<any>(null);
  
  // Developer Config View State (Oculto por trás dos botões bonitos)
  const [showDeveloperConfig, setShowDeveloperConfig] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  
  // Custom Configs
  const [metaPhoneId, setMetaPhoneId] = useState('');
  const [metaWabaId, setMetaWabaId] = useState('');
  const [metaVerifyToken, setMetaVerifyToken] = useState('');
  const [tiktokAppId, setTiktokAppId] = useState('');
  const [tiktokAppSecret, setTiktokAppSecret] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeMessage, setSubscribeMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [whatsappProfile, setWhatsappProfile] = useState<(WhatsappProfile & { syncedAt?: string }) | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [registerPin, setRegisterPin] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerMessage, setRegisterMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // WhatsApp agora suporta vários números (um por Agente de IA) — ver
  // docs/superpowers/specs/2026-07-21-multiplos-agentes-fase1-design.md.
  // viewingNumbers = mostrando a lista de números em vez do formulário único;
  // editingIntegrationId = qual número o formulário está editando (null =
  // criando um novo).
  const [viewingNumbers, setViewingNumbers] = useState(false);
  const [editingIntegrationId, setEditingIntegrationId] = useState<string | null>(null);

  // DB State
  const [installedApps, setInstalledApps] = useState<any[]>([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    withRetry(() => getIntegrations())
      .then(data => setInstalledApps(data))
      .catch(err => {
        console.error(err);
        setLoadError('Não foi possível carregar suas integrações. Tente recarregar a página.');
      });
  }, []);

  const appsComStatusAtualizado = MOCK_INTEGRATIONS.map(app => {
    const isInstalled = installedApps.some(installed => installed.provider === app.id);
    return { ...app, status: isInstalled ? 'installed' : 'available' };
  });

  const filteredApps = appsComStatusAtualizado.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' 
                        ? true 
                        : activeTab === 'installed' 
                          ? app.status === 'installed' 
                          : app.category === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleSaveIntegration = async () => {
    setIsSaving(true);
    let configObj: any = {};
    if (selectedApp.id === 'instagram' || selectedApp.id === 'whatsapp') {
      configObj = { metaPhoneId: metaPhoneId, verifyToken: metaVerifyToken };
      if (selectedApp.id === 'whatsapp') {
        configObj.metaWabaId = metaWabaId;
      }
    } else if (selectedApp.id === 'tiktok') {
      configObj = { appId: tiktokAppId, appSecret: tiktokAppSecret };
    }

    await saveIntegration(
      selectedApp.id,
      apiKey,
      webhookUrl,
      Object.keys(configObj).length > 0 ? JSON.stringify(configObj) : undefined,
      editingIntegrationId ?? undefined
    );

    setInstalledApps(await getIntegrations());
    setIsSaving(false);
    setShowDeveloperConfig(false);
    // WhatsApp agora é uma lista de números — volta pra lista em vez da
    // tela de opções genérica, pra ver o número recém-salvo confirmado.
    if (selectedApp.id === 'whatsapp') {
      setViewingNumbers(true);
    }
  };

  const getActiveIntegrationConfig = (appId: string) => {
    return installedApps.find(i => i.provider === appId);
  };

  const whatsappIntegrations = installedApps.filter(i => i.provider === 'whatsapp');

  const fillFormFromIntegration = (appId: string, config: any) => {
    if (config) {
      setApiKey(config.apiKey || '');
      setWebhookUrl(config.webhookUrl || '');

      const parsedConfig = config.config ? JSON.parse(config.config) : {};
      if (appId === 'instagram' || appId === 'whatsapp') {
        setMetaPhoneId(parsedConfig.metaPhoneId || '');
        setMetaWabaId(parsedConfig.metaWabaId || '');
        setMetaVerifyToken(parsedConfig.verifyToken || '');
        setWhatsappProfile(parsedConfig.profile || null);
      } else if (appId === 'tiktok') {
        setTiktokAppId(parsedConfig.appId || '');
        setTiktokAppSecret(parsedConfig.appSecret || '');
      }
    } else {
      setApiKey('');
      setWebhookUrl('');
      setMetaPhoneId('');
      setMetaWabaId('');
      setMetaVerifyToken('');
      setTiktokAppId('');
      setTiktokAppSecret('');
      setWhatsappProfile(null);
    }
    setSubscribeMessage(null);
    setSyncError('');
    setRegisterPin('');
    setRegisterMessage(null);
  };

  const openModal = (app: any) => {
    setShowDeveloperConfig(false);
    setEditingIntegrationId(null);

    if (app.id === 'whatsapp') {
      const numbers = installedApps.filter(i => i.provider === 'whatsapp');
      if (numbers.length > 0) {
        // Já tem número(s) configurado(s): mostra a lista em vez do
        // formulário único de sempre.
        setViewingNumbers(true);
        fillFormFromIntegration(app.id, null);
        setSelectedApp(app);
        return;
      }
    }
    setViewingNumbers(false);
    fillFormFromIntegration(app.id, getActiveIntegrationConfig(app.id));
    setSelectedApp(app);
  };

  // Abre o formulário de credenciais pra um número específico da lista
  // (integration = null → formulário em branco, pra adicionar um novo).
  const openWhatsappNumberConfig = (integration: any | null) => {
    setEditingIntegrationId(integration?.id ?? null);
    fillFormFromIntegration('whatsapp', integration);
    setViewingNumbers(false);
    setShowDeveloperConfig(true);
  };

  const handleRegisterNumber = async () => {
    setIsRegistering(true);
    setRegisterMessage(null);
    const result = await registerWhatsappNumber(registerPin, editingIntegrationId ?? undefined);
    setRegisterMessage(
      result.success
        ? { ok: true, text: 'Número registrado na Cloud API! Já pode enviar e receber mensagens.' }
        : { ok: false, text: result.error || 'Falha ao registrar o número.' }
    );
    setIsRegistering(false);
  };

  const handleSubscribeWebhook = async () => {
    setIsSubscribing(true);
    setSubscribeMessage(null);
    const result = await subscribeWhatsappWebhook(editingIntegrationId ?? undefined);
    setSubscribeMessage(
      result.success
        ? { ok: true, text: 'App inscrito na WABA! O recebimento de mensagens deve funcionar agora.' }
        : { ok: false, text: result.error || 'Falha ao inscrever o app na WABA.' }
    );
    setIsSubscribing(false);
  };

  const handleSyncProfile = async () => {
    setIsSyncing(true);
    setSyncError('');
    const result = await syncWhatsappProfile(editingIntegrationId ?? undefined);
    if (result.success) {
      setWhatsappProfile(result.profile || null);
    } else {
      setSyncError(result.error || 'Falha ao sincronizar com a Meta.');
    }
    setIsSyncing(false);
  };

  return (
    <div className="p-8 h-full bg-[#0a0a0a] overflow-auto relative">
      <div className="max-w-7xl mx-auto">

        {loadError && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
            {loadError}
          </div>
        )}

        {/* Header & Banner */}
        <div className="mb-10 relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/20 p-8 flex items-center justify-between">
          <div className="relative z-10 max-w-xl">
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2 flex items-center gap-2">
              <Puzzle className="size-8 text-blue-400" />
              App Store & Integrações
            </h1>
            <p className="text-blue-200/80 text-sm">
              Conecte seu CRM com as melhores ferramentas do mercado. WhatsApp, pagamentos, automações e muito mais para escalar sua operação.
            </p>
          </div>
          
          <div className="relative z-10 hidden md:flex items-center gap-4">
             <div className="w-16 h-16 bg-white rounded-2xl p-3 shadow-2xl rotate-[-10deg] border border-zinc-200/20">
               <img src="https://cdn.simpleicons.org/instagram/E1306C" alt="Instagram" className="w-full h-full object-contain" />
             </div>
             <div className="w-20 h-20 bg-[#1a1a1a] rounded-2xl p-4 shadow-2xl z-20 border border-zinc-800">
               <img src="https://cdn.simpleicons.org/whatsapp/25D366" alt="WhatsApp" className="w-full h-full object-contain" />
             </div>
             <div className="w-16 h-16 bg-white rounded-2xl p-3 shadow-2xl rotate-[10deg] border border-zinc-200/20">
               <img src="https://cdn.simpleicons.org/tiktok/black" alt="TikTok" className="w-full h-full object-contain" />
             </div>
          </div>
          
          <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full" />
        </div>

        {/* Toolbar: Busca e Filtros */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                  activeTab === cat.id 
                    ? "bg-blue-600 text-white" 
                    : "bg-[#141414] border border-[#262626] text-zinc-400 hover:text-zinc-200 hover:border-[#333]"
                )}
              >
                <cat.icon className={cn("size-4", activeTab === cat.id ? "text-white" : "text-zinc-500")} />
                {cat.name}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
            <input 
              type="text"
              placeholder="Buscar aplicativos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] rounded-full pl-10 pr-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Grid de Aplicativos */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredApps.map(app => (
            <div key={app.id} className="bg-[#141414] border border-[#262626] rounded-2xl p-5 hover:border-blue-500/30 hover:bg-[#1a1a1a] transition-all group flex flex-col h-full cursor-pointer" onClick={() => openModal(app)}>
              
              <div className="flex items-start justify-between mb-4">
                <div className={cn("w-14 h-14 border border-white/10 rounded-xl flex items-center justify-center p-2.5", app.iconColor === 'text-black' || app.id === 'instagram' ? 'bg-zinc-800' : 'bg-white/5')}>
                  <img src={app.icon} alt={app.name} className="w-full h-full object-contain" style={{ filter: app.id === 'instagram' ? '' : 'brightness(0) invert(1)' }} />
                </div>
                {app.status === 'installed' ? (
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 border border-emerald-500/20">
                    <CheckCircle2 className="size-3" />
                    INSTALADO
                  </span>
                ) : (
                   <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">
                     <Star className="size-5" />
                   </span>
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-zinc-200 text-lg mb-1">{app.name}</h3>
                <p className={cn("text-[11px] font-bold uppercase tracking-wider mb-2", app.iconColor)}>{app.author}</p>
                <p className="text-sm text-zinc-500 line-clamp-2">{app.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#262626]">
                <button
                  className={cn(
                    "w-full py-2 rounded-lg text-sm font-bold transition-colors",
                    app.status === 'installed'
                      ? "bg-[#262626] text-zinc-300 hover:bg-[#333]"
                      : app.implemented
                        ? "bg-blue-600/10 text-blue-500 hover:bg-blue-600/20"
                        : "bg-zinc-800/60 text-zinc-500"
                  )}
                >
                  {app.status === 'installed' ? 'Configurar' : app.implemented ? '+ Instalar' : 'Em breve'}
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>

      {/* Modal de instalação/configuração de app */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 lg:p-8">
          
          {/* Main Modal Container - Light Theme Premium */}
          <div className="bg-white rounded-[1rem] w-full max-w-5xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Close Button Top Right (Absolute over everything) */}
            <button 
              onClick={() => setSelectedApp(null)} 
              className="absolute top-4 right-4 z-50 bg-gray-100 hover:bg-gray-200 text-gray-500 p-2 rounded-full transition-colors"
            >
              <X className="size-5" />
            </button>

            {/* Left Panel (App Info) - Gray Background */}
            <div className="w-full md:w-[35%] bg-[#F5F6F8] p-8 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col items-center text-center">
              
              {/* Banner do app */}
              <div className={cn("w-full aspect-[4/3] rounded-xl mb-6 shadow-sm flex items-center justify-center p-8", selectedApp.bannerBg || 'bg-gray-800')}>
                <img src={selectedApp.icon} alt={selectedApp.name} className="w-24 h-24 object-contain filter brightness-0 invert" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedApp.name}</h2>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                {selectedApp.desc}
              </p>

              {/* Indicadores de status (Instalado / Desinstalar) */}
              <div className="flex gap-4 w-full border-t border-gray-200 pt-6">
                {installedApps.some(i => i.provider === selectedApp.id) ? (
                  <>
                    <button className="flex-1 border border-emerald-500 text-emerald-600 bg-emerald-50 py-2 rounded-md font-medium text-sm transition-colors">
                      Instalado
                    </button>
                    <button className="flex-1 text-gray-400 hover:text-red-500 font-medium text-sm transition-colors">
                      Desinstalar
                    </button>
                  </>
                ) : (
                  <button className="w-full text-gray-400 font-medium text-sm text-center">
                    Ainda não instalado
                  </button>
                )}
              </div>
            </div>

            {/* Right Panel (Actions & Connect) - White Background */}
            <div className="w-full md:w-[65%] bg-white p-8 md:p-12 flex flex-col">

              {!selectedApp.implemented ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4">
                    <Info className="size-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Em breve</h3>
                  <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
                    A integração com {selectedApp.name} ainda não está disponível. Hoje o WhatsApp Cloud API e o webhook do n8n são os canais totalmente funcionais no CRM.
                  </p>
                </div>
              ) : selectedApp.id === 'whatsapp' && viewingNumbers ? (
                /* Lista de números de WhatsApp já configurados — cada um pode
                   ter seu próprio Agente de IA (ver /salesbot). */
                <div className="h-full flex flex-col">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Seus números de WhatsApp</h3>
                  <p className="text-gray-500 text-sm mb-8">
                    Cada número pode ter seu próprio Agente de IA, com persona e scripts diferentes.
                  </p>

                  <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1 mb-6">
                    {whatsappIntegrations.map(integration => {
                      const parsed = integration.config ? JSON.parse(integration.config) : {};
                      const profile = parsed.profile;
                      return (
                        <div key={integration.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                          {profile?.profilePictureUrl ? (
                            <img src={profile.profilePictureUrl} alt="Foto do perfil" className="w-12 h-12 rounded-full object-cover border border-gray-200 shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                              <Phone className="size-5" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {profile?.verifiedName || 'Número sem nome'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {profile?.displayPhoneNumber || (integration.apiKey ? 'Aguardando sincronização' : 'Configuração incompleta')}
                            </p>
                          </div>
                          {integration.isActive && profile?.codeVerificationStatus && (
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-1 rounded-md shrink-0",
                              profile.codeVerificationStatus === 'VERIFIED'
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            )}>
                              {profile.codeVerificationStatus === 'VERIFIED' ? 'ATIVO' : profile.codeVerificationStatus}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => openWhatsappNumberConfig(integration)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-xs font-bold transition-colors shrink-0"
                          >
                            Configurar
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => openWhatsappNumberConfig(null)}
                    className="w-full border-2 border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl py-4 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    + Adicionar número
                  </button>
                </div>
              ) : !showDeveloperConfig ? (
                <>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {selectedApp.modalTitle || `Conecte seu ${selectedApp.name} com a Nexus`}
                  </h3>
                  <p className="text-gray-500 text-sm mb-10 leading-relaxed">
                    {selectedApp.modalDesc || `Integre a sua plataforma do ${selectedApp.name} para sincronizar os dados automaticamente e escalar sua operação.`}
                  </p>

                  {/* Opções de conexão */}
                  {selectedApp.options ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-auto">
                      {selectedApp.options.map((opt: any) => (
                        <div key={opt.id} className="border border-gray-200 hover:border-gray-300 rounded-xl p-6 transition-all hover:shadow-lg flex flex-col h-full bg-white group cursor-pointer" onClick={() => setShowDeveloperConfig(true)}>
                          
                          <div className="flex items-center gap-3 mb-4">
                            <img src={opt.icon} alt={opt.title} className="w-6 h-6 object-contain" />
                            <h4 className="font-bold text-gray-900">{opt.title}</h4>
                          </div>
                          
                          <p className="text-xs text-gray-500 flex-1 leading-relaxed mb-6">
                            {opt.desc}
                          </p>

                          <button className={cn("w-full py-2.5 rounded text-white font-medium text-sm transition-opacity opacity-90 group-hover:opacity-100", opt.btnColor)}>
                            {opt.btnText}
                          </button>
                          
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-10 mb-auto hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setShowDeveloperConfig(true)}>
                       <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                         <Zap className="size-8" />
                       </div>
                       <h4 className="font-bold text-gray-900 mb-2">Conexão via API ou Token</h4>
                       <p className="text-gray-500 text-sm text-center max-w-sm">
                         Para integrar essa ferramenta, clique aqui para inserir os seus Tokens de Acesso.
                       </p>
                    </div>
                  )}

                  <div className="mt-12 pt-6 border-t border-gray-100 flex items-center gap-2 text-gray-400 text-xs">
                    <Info className="size-4" />
                    <span>Ao conectar, você concorda com os Termos de Uso de API de Terceiros da Nexus.</span>
                  </div>
                </>
              ) : (
                /* Developer Config View (Technical Tokens) */
                <div className="animate-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                  <div
                    className="flex items-center gap-3 mb-8 cursor-pointer text-gray-500 hover:text-gray-900 transition-colors w-fit"
                    onClick={() => {
                      setShowDeveloperConfig(false);
                      if (selectedApp.id === 'whatsapp' && whatsappIntegrations.length > 0) {
                        setViewingNumbers(true);
                      }
                    }}
                  >
                    <div className="p-1.5 bg-gray-100 rounded-md">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </div>
                    <span className="font-medium text-sm">{selectedApp.id === 'whatsapp' && whatsappIntegrations.length > 0 ? 'Voltar para Números' : 'Voltar para Opções'}</span>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Credenciais de Desenvolvedor</h3>
                  <p className="text-gray-500 text-sm mb-8">Insira as chaves oficiais para estabelecer a conexão.</p>

                  <div className="space-y-5 overflow-y-auto pr-2 custom-scrollbar flex-1 mb-6">
                    {/* META / WHATSAPP / INSTAGRAM FIELDS */}
                    {(selectedApp.id === 'instagram' || selectedApp.id === 'whatsapp') && (
                      <>
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mb-2">
                          <p className="text-xs text-blue-800 font-medium leading-relaxed">
                            O seu Webhook no Portal Meta for Developers deve ser configurado como: <br/>
                            <strong className="text-blue-900 break-all select-all block mt-1">https://crm-erp-nextgen.vercel.app/api/webhooks/meta</strong>
                          </p>
                        </div>

                        {selectedApp.id === 'whatsapp' && !!editingIntegrationId && (
                          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                            <div className="flex items-center gap-3 mb-3">
                              {whatsappProfile?.profilePictureUrl ? (
                                <img src={whatsappProfile.profilePictureUrl} alt="Foto do perfil" className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                                  <Phone className="size-5" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">
                                  {whatsappProfile?.verifiedName || 'Ainda não sincronizado'}
                                </p>
                                {whatsappProfile?.displayPhoneNumber && (
                                  <p className="text-xs text-gray-500">{whatsappProfile.displayPhoneNumber}</p>
                                )}
                              </div>
                              {whatsappProfile?.codeVerificationStatus && (
                                <span className={cn(
                                  "text-[10px] font-bold px-2 py-1 rounded-md shrink-0",
                                  whatsappProfile.codeVerificationStatus === 'VERIFIED'
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-100 text-amber-700"
                                )}>
                                  {whatsappProfile.codeVerificationStatus === 'VERIFIED' ? 'ATIVO' : whatsappProfile.codeVerificationStatus}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={handleSyncProfile}
                                disabled={isSyncing}
                                className="bg-white border border-gray-300 hover:border-gray-400 disabled:opacity-50 text-gray-700 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                              >
                                {isSyncing ? 'Sincronizando...' : 'Sincronizar com a Meta'}
                              </button>
                              {whatsappProfile?.syncedAt && (
                                <span className="text-[11px] text-gray-400">
                                  Última sync: {new Date(whatsappProfile.syncedAt).toLocaleString('pt-BR')}
                                </span>
                              )}
                            </div>
                            {syncError && <p className="text-xs font-medium text-red-600 mt-2">{syncError}</p>}
                          </div>
                        )}

                        <div>
                          <label className="text-xs font-bold text-gray-700 mb-2 block">System User Access Token Permanente (Meta)</label>
                          <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="EAAG..." className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-700 mb-2 block">ID do Número de Telefone (Apenas para WhatsApp)</label>
                          <input type="text" value={metaPhoneId} onChange={(e) => setMetaPhoneId(e.target.value)} placeholder="Ex: 1122334455" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                        </div>

                        {selectedApp.id === 'whatsapp' && !!editingIntegrationId && (
                          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                            <p className="text-xs text-indigo-800 font-medium leading-relaxed mb-3">
                              Registre o número na Cloud API com um PIN de verificação em duas etapas (6 dígitos). Sem isso, um número real (fora do sandbox) não envia nem recebe mensagens pela API — se o número nunca teve PIN, o valor digitado aqui vira o PIN dele.
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={registerPin}
                                onChange={(e) => setRegisterPin(e.target.value.replace(/\D/g, ''))}
                                placeholder="PIN de 6 dígitos"
                                className="bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-40"
                              />
                              <button
                                type="button"
                                onClick={handleRegisterNumber}
                                disabled={isRegistering || registerPin.length !== 6}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                              >
                                {isRegistering ? 'Registrando...' : 'Registrar número'}
                              </button>
                            </div>
                            {registerMessage && (
                              <p className={`text-xs font-medium mt-2 ${registerMessage.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                                {registerMessage.text}
                              </p>
                            )}
                          </div>
                        )}

                        {selectedApp.id === 'whatsapp' && (
                          <div>
                            <label className="text-xs font-bold text-gray-700 mb-2 block">ID da Conta do WhatsApp Business (WABA ID)</label>
                            <input type="text" value={metaWabaId} onChange={(e) => setMetaWabaId(e.target.value)} placeholder="Ex: 987654321098765" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                            <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
                              Encontre em Meta for Developers → seu App → WhatsApp → Configuração da API, campo &quot;ID da conta do WhatsApp Business&quot;. Necessário para números reais (fora do sandbox) receberem mensagens.
                            </p>
                          </div>
                        )}
                        <div>
                          <label className="text-xs font-bold text-gray-700 mb-2 block">Token de Verificação (Webhook Verify Token)</label>
                          <input type="text" value={metaVerifyToken} onChange={(e) => setMetaVerifyToken(e.target.value)} placeholder="Sua senha para a Meta (ex: nexus2026)" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                        </div>
                        {selectedApp.id === 'whatsapp' && !!editingIntegrationId && (
                          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                            <p className="text-xs text-amber-800 font-medium leading-relaxed mb-3">
                              Salvou o Token e o WABA ID? Clique abaixo para ativar o recebimento de mensagens deste número (passo obrigatório da Meta para números reais/produção).
                            </p>
                            <button
                              type="button"
                              onClick={handleSubscribeWebhook}
                              disabled={isSubscribing}
                              className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                            >
                              {isSubscribing ? 'Inscrevendo...' : 'Ativar recebimento de mensagens'}
                            </button>
                            {subscribeMessage && (
                              <p className={`text-xs font-medium mt-2 ${subscribeMessage.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                                {subscribeMessage.text}
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* TIKTOK FIELDS */}
                    {selectedApp.id === 'tiktok' && (
                      <>
                        <div>
                          <label className="text-xs font-bold text-gray-700 mb-2 block">TikTok Access Token</label>
                          <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Token de acesso do TikTok" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-700 mb-2 block">App ID</label>
                          <input type="text" value={tiktokAppId} onChange={(e) => setTiktokAppId(e.target.value)} placeholder="TikTok App ID" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-700 mb-2 block">App Secret</label>
                          <input type="password" value={tiktokAppSecret} onChange={(e) => setTiktokAppSecret(e.target.value)} placeholder="TikTok App Secret" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                        </div>
                      </>
                    )}

                    {/* OTHERS */}
                    {selectedApp.id !== 'instagram' && selectedApp.id !== 'whatsapp' && selectedApp.id !== 'tiktok' && (
                      <>
                        {(selectedApp.id === 'n8n' || selectedApp.id === 'stripe') && (
                          <div>
                            <label className="text-xs font-bold text-gray-700 mb-2 block">Webhook URL / API URL</label>
                            <input type="text" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://sua-url-aqui.com/webhook" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                          </div>
                        )}
                        {selectedApp.id !== 'n8n' && (
                          <div>
                            <label className="text-xs font-bold text-gray-700 mb-2 block">Token / API Key</label>
                            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk_test_..." className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-auto">
                    <button 
                      onClick={() => setShowDeveloperConfig(false)}
                      className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSaveIntegration}
                      disabled={isSaving}
                      className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-8 py-2.5 rounded-lg font-bold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                      {isSaving ? 'Conectando...' : 'Salvar Chaves'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
