'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Search, 
  MoreVertical, 
  Send, 
  Paperclip, 
  Smile, 
  User, 
  Phone, 
  Mail, 
  Info,
  ChevronLeft,
  Sparkles,
  SlidersHorizontal,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/system/PageHeader';
import { motion } from 'framer-motion';

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Estados do PulseAI Autopilot
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiModel, setAiModel] = useState('gemini');
  const [aiApiKey, setAiApiKey] = useState('');
  const [saving, setSaving] = useState(false);

  // Carregar configurações de IA
  useEffect(() => {
    const fetchAiSettings = async () => {
      try {
        const tenantId = localStorage.getItem('tenantId') || '1';
        const token = localStorage.getItem('token') || '';
        const response = await axios.get('http://localhost:3001/tenant/ai-settings', {
          headers: {
            'x-tenant-id': tenantId,
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.data) {
          setAiEnabled(response.data.aiEnabled);
          setAiPrompt(response.data.aiPrompt);
          setAiModel(response.data.aiModel);
          setAiApiKey(response.data.aiApiKey);
        }
      } catch (err) {
        const localSettings = localStorage.getItem('pulse_ai_settings');
        if (localSettings) {
          const parsed = JSON.parse(localSettings);
          setAiEnabled(parsed.aiEnabled);
          setAiPrompt(parsed.aiPrompt);
          setAiModel(parsed.aiModel);
          setAiApiKey(parsed.aiApiKey);
        } else {
          setAiPrompt("Você é o atendente inteligente da nossa empresa. Nosso objetivo é qualificar leads no WhatsApp e agendar um horário com nossa equipe comercial. Seja gentil e prestativo.");
        }
      }
    };
    fetchAiSettings();
  }, []);

  const handleSaveAiSettings = async () => {
    setSaving(true);
    const settingsPayload = { aiEnabled, aiPrompt, aiModel, aiApiKey };
    try {
      const tenantId = localStorage.getItem('tenantId') || '1';
      const token = localStorage.getItem('token') || '';
      await axios.post('http://localhost:3001/tenant/ai-settings', settingsPayload, {
        headers: {
          'x-tenant-id': tenantId,
          'Authorization': `Bearer ${token}`
        }
      });
      localStorage.setItem('pulse_ai_settings', JSON.stringify(settingsPayload));
      alert('Configurações do PulseAI salvas com sucesso!');
    } catch (err) {
      localStorage.setItem('pulse_ai_settings', JSON.stringify(settingsPayload));
      alert('Salvo localmente com sucesso!');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyPreset = (type: string) => {
    let prompt = '';
    if (type === 'barbearia') {
      prompt = `Você é o assistente virtual da Barbearia Pulse. Seja extremamente descontraído e simpático.
Objetivos:
1. Oferecer nossos serviços principais (Corte: R$45, Barba: R$35).
2. Agendar horários comercialmente hoje ou amanhã.`;
    } else if (type === 'mecanica') {
      prompt = `Você é o assistente virtual inteligente da Oficina AutoPulse. Seja profissional, técnico e atencioso.
Objetivos:
1. Coletar o modelo e ano do carro.
2. Agendar uma avaliação física gratuita.`;
    } else if (type === 'imobiliaria') {
      prompt = `Você é o consultor imobiliário da Pulse Imóveis. Seja educado e focado.
Objetivos:
1. Entender se o lead deseja comprar ou alugar.
2. Coletar faixa de orçamento.`;
    } else if (type === 'clinica') {
      prompt = `Você é o assistente de saúde inteligente da Clínica PulseMédica.
Objetivos:
1. Identificar especialidade médica e convênio.`;
    }
    setAiPrompt(prompt);
  };

  useEffect(() => {
    setConversations([
      { id: '1', contact: { name: 'Marcelo Silva', phone: '+55 11 99999-9999' }, lastMessage: 'Olá, gostaria de saber sobre o plano premium.', time: '14:20', unread: 2 },
      { id: '2', contact: { name: 'Ana Costa', phone: '+55 11 88888-8888' }, lastMessage: 'Obrigada pelo retorno!', time: 'Ontem', unread: 0 },
      { id: '3', contact: { name: 'Boutique Dental', phone: '+55 11 77777-7777' }, lastMessage: 'Podemos agendar para amanhã?', time: 'Ontem', unread: 0 },
    ]);
  }, []);

  useEffect(() => {
    if (selectedChat) {
      setMessages([
        { id: '1', direction: 'INBOUND', content: 'Olá, boa tarde!', createdAt: '2026-04-25T14:00:00Z' },
        { id: '2', direction: 'OUTBOUND', content: 'Boa tarde, Marcelo! Como posso ajudar?', createdAt: '2026-04-25T14:05:00Z' },
        { id: '3', direction: 'INBOUND', content: 'Gostaria de saber mais sobre as integrações de ERP do sistema.', createdAt: '2026-04-25T14:10:00Z' },
      ]);
    }
  }, [selectedChat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const msg = {
      id: Date.now().toString(),
      direction: 'OUTBOUND',
      content: newMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages([...messages, msg]);
    setNewMessage('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* PageHeader unificado */}
      <PageHeader 
        title="Central de Mensagens"
        description="Fale em tempo real com seus contatos integrados ou ative o Autopiloto inteligente."
      />

      <div className="h-[calc(100vh-210px)] flex bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
        
        {/* 1. Sidebar - Chats List */}
        <div className="w-80 border-r border-zinc-200 flex flex-col bg-white">
          <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-zinc-400" />
              <input 
                placeholder="Buscar conversas..." 
                className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-3 h-9 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" 
              />
            </div>
          </div>
          <ScrollArea className="flex-1 bg-white">
            <div className="divide-y divide-zinc-50">
              {conversations.map((chat) => (
                <div 
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={cn(
                    "p-4 flex gap-3 cursor-pointer transition-colors border-l-4",
                    selectedChat?.id === chat.id 
                      ? "bg-zinc-50 border-l-blue-600" 
                      : "hover:bg-zinc-50/50 border-l-transparent"
                  )}
                >
                  <Avatar className="h-10 w-10 border border-zinc-200">
                    <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-sm">
                      {chat.contact.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={cn("text-xs truncate text-zinc-800", selectedChat?.id === chat.id ? "font-bold text-zinc-950" : "font-semibold")}>
                        {chat.contact.name}
                      </h4>
                      <span className="text-[10px] text-zinc-400">{chat.time}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[11px] text-zinc-400 truncate leading-relaxed">{chat.lastMessage}</p>
                      {chat.unread > 0 && (
                        <Badge className="bg-blue-600 text-[10px] h-4 w-4 p-0 flex items-center justify-center rounded-full border-none">
                          {chat.unread}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* 2. Main Chat Area */}
        {selectedChat ? (
          <div className="flex-1 flex flex-col bg-zinc-50/30">
            
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-white shadow-sm z-10">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-zinc-200">
                  <AvatarFallback className="bg-blue-50 text-blue-600 text-xs font-bold">
                    {selectedChat.contact.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-xs font-bold text-zinc-800 leading-none">{selectedChat.contact.name}</h4>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1.5 mt-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Online
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                
                {/* Botão Autopiloto */}
                <button 
                  onClick={() => setShowAiSettings(!showAiSettings)}
                  className={cn(
                    "rounded-xl border px-3 h-9 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm",
                    aiEnabled 
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700" 
                      : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                  )}
                >
                  <Sparkles className="size-3.5 text-blue-500" />
                  <span>Autopilot: {aiEnabled ? 'Ativo' : 'Manual'}</span>
                </button>

                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-xl size-9">
                  <Phone className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-xl size-9">
                  <MoreVertical className="size-4" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={cn(
                    "flex w-full",
                    msg.direction === 'OUTBOUND' ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[70%] p-3.5 rounded-2xl text-sm leading-relaxed",
                    msg.direction === 'OUTBOUND' 
                      ? "bg-blue-600 text-white rounded-tr-none shadow-sm" 
                      : "bg-white text-zinc-800 border border-zinc-200 rounded-tl-none shadow-sm"
                  )}>
                    {msg.content}
                    <div className="text-[9px] mt-1.5 text-right opacity-60 flex items-center justify-end gap-1.5">
                      {msg.metadata?.aiGenerated && (
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-50 text-[8px] h-4 px-1.5 rounded-full border-none font-bold select-none tracking-wide">
                          PulseAI
                        </Badge>
                      )}
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-zinc-200">
              <div className="flex items-center gap-2 bg-zinc-50 p-1.5 rounded-xl border border-zinc-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 rounded-lg size-9">
                  <Paperclip className="size-4" />
                </Button>
                <input 
                  placeholder="Digite sua mensagem..." 
                  className="border-none bg-transparent text-zinc-800 focus:outline-none placeholder:text-zinc-400 text-sm flex-1 ml-2"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 rounded-lg size-9">
                  <Smile className="size-4" />
                </Button>
                <button 
                  className="bg-blue-600 hover:bg-blue-700 h-9 w-9 p-0 rounded-lg flex items-center justify-center transition-colors shadow-sm text-white"
                  onClick={handleSend}
                >
                  <Send className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 space-y-4 bg-zinc-50/20">
            <div className="size-14 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center mb-1 text-zinc-400 shadow-sm">
              <Bot className="size-6 text-zinc-400" />
            </div>
            <p className="text-sm font-semibold text-zinc-700">Selecione uma conversa para começar</p>
            <p className="text-xs text-zinc-400 max-w-xs text-center leading-relaxed">Clique em algum contato na barra lateral para iniciar a qualificação manual ou ative o piloto automático.</p>
          </div>
        )}

        {/* 3. Details / AI Settings Sidebar */}
        {selectedChat && (
          showAiSettings ? (
            <div className="w-80 border-l border-zinc-200 bg-white p-5 hidden lg:flex flex-col animate-in slide-in-from-right duration-300 overflow-y-auto">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2 text-zinc-800 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="size-4 text-blue-600" />
                  <span>PulseAI Autopilot</span>
                </div>
                <button 
                  onClick={() => setShowAiSettings(false)}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Voltar
                </button>
              </div>

              {/* Form Configs */}
              <div className="space-y-5 text-left">
                
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
                  <div>
                    <span className="text-xs font-bold text-zinc-800 block">Ativar IA</span>
                    <span className="text-[10px] text-zinc-400 leading-normal block mt-0.5">Responder automaticamente</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={aiEnabled}
                    onChange={(e) => setAiEnabled(e.target.checked)}
                    className="w-8 h-4 rounded-full bg-zinc-300 checked:bg-blue-600 cursor-pointer appearance-none relative before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:transition-all checked:before:translate-x-4 border border-zinc-300 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5">Modelo de IA</label>
                  <select 
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                  >
                    <option value="gemini">Google Gemini 1.5 Flash</option>
                    <option value="openai">OpenAI GPT-4o Mini</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5">Chave API (Opcional)</label>
                  <input 
                    type="password"
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    placeholder="sk-... ( NLP demonstrativo ativo )"
                    className="w-full bg-white border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-2">Templates de Qualificação</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button 
                      onClick={() => handleApplyPreset('barbearia')}
                      className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-[10px] text-zinc-700 hover:bg-blue-50 hover:border-blue-200 transition-all text-left flex flex-col gap-0.5"
                    >
                      <span className="font-bold text-zinc-800">💆 Barbearia</span>
                      <span className="text-[8px] text-zinc-400">Agendar cortes</span>
                    </button>
                    <button 
                      onClick={() => handleApplyPreset('mecanica')}
                      className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-[10px] text-zinc-700 hover:bg-blue-50 hover:border-blue-200 transition-all text-left flex flex-col gap-0.5"
                    >
                      <span className="font-bold text-zinc-800">🚗 Oficina</span>
                      <span className="text-[8px] text-zinc-400">Revisões mecânicas</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5">Persona / Instruções do Robô</label>
                  <textarea 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={5}
                    placeholder="Escreva como o robô deve guiar a conversa..."
                    className="w-full bg-white border border-zinc-200 rounded-xl p-3 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-zinc-400 leading-relaxed resize-none shadow-sm"
                  />
                </div>

                <button 
                  onClick={handleSaveAiSettings}
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 text-xs font-bold shadow-sm mt-2 transition-colors border-none cursor-pointer flex items-center justify-center"
                >
                  {saving ? 'Gravando...' : 'Salvar Configurações'}
                </button>
              </div>
            </div>
          ) : (
            <div className="w-72 border-l border-zinc-200 bg-white p-6 hidden lg:flex flex-col animate-in slide-in-from-right duration-300">
              <div className="flex flex-col items-center mb-8">
                <Avatar className="h-16 w-16 mb-4 border border-zinc-200">
                  <AvatarFallback className="bg-blue-50 text-blue-600 text-xl font-bold">
                    {selectedChat.contact.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-base font-bold text-zinc-900">{selectedChat.contact.name}</h3>
                <Badge className="mt-2 bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-50 text-[10px] font-bold py-0.5 px-2 rounded-full">
                  Lead Qualificado
                </Badge>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mb-3">Informações</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs text-zinc-600">
                      <Phone className="size-4 text-zinc-400" />
                      {selectedChat.contact.phone}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-600">
                      <Mail className="size-4 text-zinc-400" />
                      marcelo@exemplo.com
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-100">
                  <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mb-3">Ações Comerciais</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="text-xs border-zinc-200 hover:bg-zinc-50 text-zinc-700 h-auto py-2.5 rounded-xl">Criar Pedido</Button>
                    <Button variant="outline" className="text-xs border-zinc-200 hover:bg-zinc-50 text-zinc-700 h-auto py-2.5 rounded-xl">Novo Negócio</Button>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>

    </div>
  );
}

function MessageSquare({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
