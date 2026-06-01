'use client';

import React, { useState, useEffect } from 'react';
import { Search, Puzzle, Star, Zap, MessageCircle, Phone, CreditCard, Box, Settings, CheckCircle2, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { saveIntegration, getIntegrations } from '@/actions/integrations';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

// Atualizado com Meta Oficial e TikTok
const MOCK_INTEGRATIONS = [
  { id: 'meta', name: 'Meta Oficial (WhatsApp & Instagram)', category: 'messages', icon: 'https://cdn.simpleicons.org/meta/0668E1', author: 'Meta Oficial', desc: 'Conecte a API Oficial do WhatsApp Cloud e Instagram Graph.', status: 'available' },
  { id: 'tiktok', name: 'TikTok for Business', category: 'messages', icon: 'https://cdn.simpleicons.org/tiktok/white', author: 'TikTok', desc: 'Receba e responda DMs do TikTok pelo CRM.', status: 'available' },
  { id: 'messenger', name: 'Facebook Messenger', category: 'messages', icon: 'https://cdn.simpleicons.org/messenger/00B2FF', author: 'Meta', desc: 'Centralize as mensagens da sua página.', status: 'available' },
  { id: 'telegram', name: 'Telegram', category: 'messages', icon: 'https://cdn.simpleicons.org/telegram/26A5E4', author: 'Telegram', desc: 'Integração direta com bots do Telegram.', status: 'available' },
  
  { id: 'n8n', name: 'n8n Webhook', category: 'automation', icon: 'https://cdn.simpleicons.org/n8n/FF6D5A', author: 'Core', desc: 'Envie todos os eventos do CRM para o seu n8n.', status: 'available' },
  { id: 'openai', name: 'OpenAI (Salesbot)', category: 'automation', icon: 'https://cdn.simpleicons.org/openai/white', author: 'Pulse AI', desc: 'Cérebro de Inteligência Artificial para qualificação.', status: 'available' },
  { id: 'zapier', name: 'Zapier', category: 'automation', icon: 'https://cdn.simpleicons.org/zapier/FF4F00', author: 'Zapier Inc', desc: 'Conecte com mais de 5.000 aplicativos.', status: 'available' },
  { id: 'make', name: 'Make', category: 'automation', icon: 'https://cdn.simpleicons.org/make/white', author: 'Make', desc: 'Plataforma visual de integração.', status: 'available' },

  { id: 'stripe', name: 'Stripe', category: 'payments', icon: 'https://cdn.simpleicons.org/stripe/635BFF', author: 'Stripe', desc: 'Gere links de pagamento direto no chat.', status: 'available' },
  { id: 'mercadopago', name: 'Mercado Pago', category: 'payments', icon: 'https://cdn.simpleicons.org/mercadopago/009EE3', author: 'Mercado Livre', desc: 'Cobranças via Pix e Cartão.', status: 'available' },
  { id: 'asaas', name: 'Asaas', category: 'payments', icon: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Asaas_logo.svg', author: 'Asaas', desc: 'Emissão de boletos e Pix automatizada.', status: 'available' },

  { id: 'calendar', name: 'Google Calendar', category: 'tools', icon: 'https://cdn.simpleicons.org/googlecalendar/4285F4', author: 'Google', desc: 'Sincronize as tarefas do CRM com sua agenda.', status: 'available' },
  { id: 'mailchimp', name: 'Mailchimp', category: 'tools', icon: 'https://cdn.simpleicons.org/mailchimp/FFE01B', author: 'Intuit', desc: 'Envio de e-mail marketing para Leads.', status: 'available' },
  { id: 'rdstation', name: 'RD Station', category: 'tools', icon: 'https://asset.brandfetch.io/id_m-E-7kC/idUaKkM-d8.svg', author: 'Resultados Digitais', desc: 'Importe leads de landing pages.', status: 'available' },
];

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
  const [apiKey, setApiKey] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  
  // Custom Configs
  const [metaPhoneId, setMetaPhoneId] = useState('');
  const [metaVerifyToken, setMetaVerifyToken] = useState('');
  const [tiktokAppId, setTiktokAppId] = useState('');
  const [tiktokAppSecret, setTiktokAppSecret] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  // DB State
  const [installedApps, setInstalledApps] = useState<any[]>([]);

  useEffect(() => {
    getIntegrations().then(data => setInstalledApps(data));
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
    if (selectedApp.id === 'meta') {
      configObj = { phoneId: metaPhoneId, verifyToken: metaVerifyToken };
    } else if (selectedApp.id === 'tiktok') {
      configObj = { appId: tiktokAppId, appSecret: tiktokAppSecret };
    }

    await saveIntegration(
      selectedApp.id, 
      apiKey, 
      webhookUrl, 
      Object.keys(configObj).length > 0 ? JSON.stringify(configObj) : undefined
    );

    setInstalledApps(await getIntegrations());
    setIsSaving(false);
    setSelectedApp(null);
    setApiKey('');
    setWebhookUrl('');
  };

  const getActiveIntegrationConfig = (appId: string) => {
    return installedApps.find(i => i.provider === appId);
  };

  const openModal = (app: any) => {
    const config = getActiveIntegrationConfig(app.id);
    if (config) {
      setApiKey(config.apiKey || '');
      setWebhookUrl(config.webhookUrl || '');
      
      const parsedConfig = config.config ? JSON.parse(config.config) : {};
      if (app.id === 'meta') {
        setMetaPhoneId(parsedConfig.phoneId || '');
        setMetaVerifyToken(parsedConfig.verifyToken || '');
      } else if (app.id === 'tiktok') {
        setTiktokAppId(parsedConfig.appId || '');
        setTiktokAppSecret(parsedConfig.appSecret || '');
      }
    } else {
      setApiKey('');
      setWebhookUrl('');
      setMetaPhoneId('');
      setMetaVerifyToken('');
      setTiktokAppId('');
      setTiktokAppSecret('');
    }
    setSelectedApp(app);
  };

  return (
    <div className="p-8 h-full bg-[#0a0a0a] overflow-auto relative">
      <div className="max-w-7xl mx-auto">
        
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
               <img src="https://upload.wikimedia.org/wikipedia/commons/2/22/Meta_Inc._logo.svg" alt="Meta" className="w-full h-full object-contain" />
             </div>
             <div className="w-20 h-20 bg-[#1a1a1a] rounded-2xl p-4 shadow-2xl z-20 border border-zinc-800">
               <img src="https://n8n.io/favicon.ico" alt="n8n" className="w-full h-full object-contain" />
             </div>
             <div className="w-16 h-16 bg-white rounded-2xl p-3 shadow-2xl rotate-[10deg] border border-zinc-200/20">
               <img src="https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg" alt="TikTok" className="w-full h-full object-contain" />
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
                <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center p-2.5">
                  <img src={app.icon} alt={app.name} className="w-full h-full object-contain" />
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
                <p className="text-[11px] font-medium text-blue-400 uppercase tracking-wider mb-2">Por {app.author}</p>
                <p className="text-sm text-zinc-500 line-clamp-2">{app.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#262626]">
                <button 
                  className={cn(
                    "w-full py-2 rounded-lg text-sm font-bold transition-colors",
                    app.status === 'installed' 
                      ? "bg-[#262626] text-zinc-300 hover:bg-[#333]" 
                      : "bg-blue-600/10 text-blue-500 hover:bg-blue-600/20"
                  )}
                >
                  {app.status === 'installed' ? 'Configurar' : '+ Instalar'}
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>

      {/* Modal de Configuração */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-[#262626] flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-xl p-2 border border-white/10 flex-shrink-0">
                  <img src={selectedApp.icon} alt={selectedApp.name} className="w-full h-full object-contain" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight">{selectedApp.name}</h2>
                  <p className="text-xs text-blue-400 font-medium">Integração Oficial</p>
                </div>
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <p className="text-sm text-zinc-400 mb-6">{selectedApp.desc}</p>

              {/* RENDER FOR META */}
              {selectedApp.id === 'meta' && (
                <>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-4">
                    <p className="text-xs text-blue-400 font-medium">
                      O seu Webhook de recebimento no Portal da Meta deve ser configurado como: <br/>
                      <strong className="text-blue-300 break-all">https://crm-erp-nextgen.vercel.app/api/webhooks/meta</strong>
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">System User Access Token Permanente (Meta)</label>
                    <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="EAAG..." className="w-full bg-[#0a0a0a] border border-[#333333] rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">ID do Número de Telefone (WhatsApp)</label>
                    <input type="text" value={metaPhoneId} onChange={(e) => setMetaPhoneId(e.target.value)} placeholder="Ex: 1122334455" className="w-full bg-[#0a0a0a] border border-[#333333] rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Token de Verificação (Webhook Verify Token)</label>
                    <input type="text" value={metaVerifyToken} onChange={(e) => setMetaVerifyToken(e.target.value)} placeholder="Uma senha sua (ex: nexus2024)" className="w-full bg-[#0a0a0a] border border-[#333333] rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50" />
                  </div>
                </>
              )}

              {/* RENDER FOR TIKTOK */}
              {selectedApp.id === 'tiktok' && (
                <>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">TikTok Access Token</label>
                    <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Token de acesso do TikTok" className="w-full bg-[#0a0a0a] border border-[#333333] rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">App ID</label>
                    <input type="text" value={tiktokAppId} onChange={(e) => setTiktokAppId(e.target.value)} placeholder="TikTok App ID" className="w-full bg-[#0a0a0a] border border-[#333333] rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">App Secret</label>
                    <input type="password" value={tiktokAppSecret} onChange={(e) => setTiktokAppSecret(e.target.value)} placeholder="TikTok App Secret" className="w-full bg-[#0a0a0a] border border-[#333333] rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50" />
                  </div>
                </>
              )}

              {/* RENDER FOR OTHERS */}
              {selectedApp.id !== 'meta' && selectedApp.id !== 'tiktok' && (
                <>
                  {(selectedApp.id === 'n8n' || selectedApp.id === 'stripe') && (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Webhook URL / API URL</label>
                      <input 
                        type="text" 
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://sua-url-aqui.com/webhook"
                        className="w-full bg-[#0a0a0a] border border-[#333333] rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                  )}

                  {selectedApp.id !== 'n8n' && (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Token / API Key</label>
                      <input 
                        type="password" 
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk_test_..."
                        className="w-full bg-[#0a0a0a] border border-[#333333] rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                  )}

                  {/* Fake state para apps que não tem nada pronto no backend ainda para não quebrar a ilusão */}
                  {selectedApp.id !== 'n8n' && selectedApp.id !== 'openai' && (
                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3 text-amber-500 text-sm">
                      <Zap className="size-5 flex-shrink-0" />
                      <p>Essa ferramenta no momento só pode ser ativada via <strong>n8n Webhook</strong>. Por favor, instale o n8n primeiro.</p>
                    </div>
                  )}
                </>
              )}

            </div>

            <div className="p-6 border-t border-[#262626] bg-[#0f0f0f] flex justify-end gap-3">
              <button 
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveIntegration}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Salvar Conexão'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
