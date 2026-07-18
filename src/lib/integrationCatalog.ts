// Catálogo de apps do App Store (/integrations) e da aba Canais do hub de
// Automações (/automations) — fonte única, pra não duplicar a lista em dois
// lugares e correr o risco dela divergir. Só os marcados com
// `implemented: true` têm lógica real por trás (ver IMPLEMENTED_PROVIDERS em
// src/actions/integrations.ts); os demais mostram "Em breve".
export interface IntegrationOption {
  id: string;
  title: string;
  icon: string;
  desc: string;
  btnText: string;
  btnColor: string;
}

export interface IntegrationCatalogItem {
  id: string;
  name: string;
  category: 'messages' | 'automation' | 'payments' | 'tools';
  icon: string;
  bannerBg: string;
  iconColor: string;
  author: string;
  desc: string;
  status: string;
  implemented?: boolean;
  modalTitle?: string;
  modalDesc?: string;
  options?: IntegrationOption[];
}

export const MOCK_INTEGRATIONS: IntegrationCatalogItem[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    category: 'messages',
    icon: 'https://cdn.simpleicons.org/instagram/white',
    bannerBg: 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600',
    iconColor: 'text-pink-500',
    author: 'Meta Oficial',
    desc: 'Centralize e automatize as atividades do Instagram.',
    status: 'available',
    modalTitle: 'Conecte seu Instagram com a Nexus',
    modalDesc: 'Gerencie facilmente DMs, comentários e menções no story conectando sua conta do Instagram. Você pode entrar diretamente pelo Instagram ou via Facebook.',
    options: [
      {
        id: 'direct',
        title: 'Instagram',
        icon: 'https://cdn.simpleicons.org/instagram/E1306C',
        desc: 'Faça login diretamente com sua conta do Instagram',
        btnText: 'Continuar com Instagram',
        btnColor: 'bg-[#4267B2] hover:bg-[#365899]'
      },
      {
        id: 'facebook',
        title: 'Facebook',
        icon: 'https://cdn.simpleicons.org/facebook/1877F2',
        desc: 'Faça login com sua conta do Facebook vinculada ao Instagram. Além disso, use a API de Conversões da Meta para melhorar o desempenho dos seus anúncios.',
        btnText: 'Continuar com Facebook',
        btnColor: 'bg-[#4267B2] hover:bg-[#365899]'
      }
    ]
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    category: 'messages',
    icon: 'https://cdn.simpleicons.org/whatsapp/white',
    bannerBg: 'bg-[#25D366]',
    iconColor: 'text-[#25D366]',
    author: 'Meta Oficial',
    desc: 'Conecte a API Oficial do WhatsApp Cloud e converse em tempo real.',
    status: 'available',
    implemented: true,
    modalTitle: 'Conecte seu WhatsApp com a Nexus',
    modalDesc: 'Gerencie todas as mensagens do WhatsApp Oficial diretamente no CRM sem perder nenhuma venda.',
    options: [
      {
        id: 'whatsapp_cloud',
        title: 'WhatsApp Cloud API',
        icon: 'https://cdn.simpleicons.org/whatsapp/25D366',
        desc: 'Conecte usando os tokens oficiais do portal Meta for Developers.',
        btnText: 'Continuar com WhatsApp',
        btnColor: 'bg-[#25D366] hover:bg-[#128C7E]'
      },
      {
        id: 'facebook_whatsapp',
        title: 'Facebook',
        icon: 'https://cdn.simpleicons.org/facebook/1877F2',
        desc: 'Faça login com sua conta corporativa do Facebook (Requer aprovação de provedor BSP).',
        btnText: 'Continuar com Facebook',
        btnColor: 'bg-[#4267B2] hover:bg-[#365899]'
      }
    ]
  },
  { id: 'tiktok', name: 'TikTok for Business', category: 'messages', icon: 'https://cdn.simpleicons.org/tiktok/white', bannerBg: 'bg-black', iconColor: 'text-black', author: 'TikTok', desc: 'Receba e responda DMs do TikTok pelo CRM.', status: 'available' },
  { id: 'messenger', name: 'Facebook Messenger', category: 'messages', icon: 'https://cdn.simpleicons.org/messenger/00B2FF', bannerBg: 'bg-gradient-to-r from-blue-500 to-cyan-500', iconColor: 'text-blue-500', author: 'Meta', desc: 'Centralize as mensagens da sua página.', status: 'available' },
  { id: 'telegram', name: 'Telegram', category: 'messages', icon: 'https://cdn.simpleicons.org/telegram/26A5E4', bannerBg: 'bg-[#26A5E4]', iconColor: 'text-[#26A5E4]', author: 'Telegram', desc: 'Integração direta com bots do Telegram.', status: 'available' },

  { id: 'n8n', name: 'n8n Webhook', category: 'automation', icon: 'https://cdn.simpleicons.org/n8n/FF6D5A', bannerBg: 'bg-[#FF6D5A]', iconColor: 'text-[#FF6D5A]', author: 'Core', desc: 'Envie todos os eventos do CRM para o seu n8n.', status: 'available', implemented: true },
  { id: 'openai', name: 'OpenAI (Salesbot)', category: 'automation', icon: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg', bannerBg: 'bg-[#10A37F]', iconColor: 'text-[#10A37F]', author: 'Pulse AI', desc: 'Cérebro de Inteligência Artificial para qualificação.', status: 'available' },
  { id: 'zapier', name: 'Zapier', category: 'automation', icon: 'https://cdn.simpleicons.org/zapier/FF4F00', bannerBg: 'bg-[#FF4F00]', iconColor: 'text-[#FF4F00]', author: 'Zapier Inc', desc: 'Conecte com mais de 5.000 aplicativos.', status: 'available' },
  { id: 'make', name: 'Make', category: 'automation', icon: 'https://cdn.simpleicons.org/make/white', bannerBg: 'bg-[#7E3AF2]', iconColor: 'text-[#7E3AF2]', author: 'Make', desc: 'Plataforma visual de integração.', status: 'available' },

  { id: 'stripe', name: 'Stripe', category: 'payments', icon: 'https://cdn.simpleicons.org/stripe/635BFF', bannerBg: 'bg-[#635BFF]', iconColor: 'text-[#635BFF]', author: 'Stripe', desc: 'Gere links de pagamento direto no chat.', status: 'available' },
  { id: 'mercadopago', name: 'Mercado Pago', category: 'payments', icon: 'https://http2.mlstatic.com/frontend-assets/ui-navigation/5.19.5/mercadopago/logo__small@2x.png', bannerBg: 'bg-[#009EE3]', iconColor: 'text-[#009EE3]', author: 'Mercado Livre', desc: 'Cobranças via Pix e Cartão.', status: 'available' },
  { id: 'asaas', name: 'Asaas', category: 'payments', icon: 'https://avatars.githubusercontent.com/u/1089201?s=200&v=4', bannerBg: 'bg-[#002D59]', iconColor: 'text-[#002D59]', author: 'Asaas', desc: 'Emissão de boletos e Pix automatizada.', status: 'available' },

  { id: 'calendar', name: 'Google Calendar', category: 'tools', icon: 'https://cdn.simpleicons.org/googlecalendar/4285F4', bannerBg: 'bg-[#4285F4]', iconColor: 'text-[#4285F4]', author: 'Google', desc: 'Sincronize as tarefas do CRM com sua agenda.', status: 'available' },
  { id: 'mailchimp', name: 'Mailchimp', category: 'tools', icon: 'https://cdn.simpleicons.org/mailchimp/FFE01B', bannerBg: 'bg-[#FFE01B]', iconColor: 'text-black', author: 'Intuit', desc: 'Envio de e-mail marketing para Leads.', status: 'available' },
  { id: 'rdstation', name: 'RD Station', category: 'tools', icon: 'https://avatars.githubusercontent.com/u/5923171?s=200&v=4', bannerBg: 'bg-[#3E525E]', iconColor: 'text-[#3E525E]', author: 'Resultados Digitais', desc: 'Importe leads de landing pages.', status: 'available' },
];

// Subconjunto usado pela aba "Canais" do hub de Automações — só os canais
// de conversa, sem automação/pagamentos/ferramentas.
export const CHANNEL_INTEGRATIONS = MOCK_INTEGRATIONS.filter(app => app.category === 'messages');
