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
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

  // Carregar configurações de IA ao inicializar
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
        // Fallback robusto para demonstração offline
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

  // Salvar configurações no backend / local
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
      alert('Configurações do PulseAI salvas com sucesso no servidor!');
    } catch (err) {
      localStorage.setItem('pulse_ai_settings', JSON.stringify(settingsPayload));
      alert('Salvo no modo de demonstração local offline! O robô funcionará com base nessas configurações.');
    } finally {
      setSaving(false);
    }
  };

  // Carregar prompts customizados prontos (Presets)
  const handleApplyPreset = (type: string) => {
    let prompt = '';
    if (type === 'barbearia') {
      prompt = `Você é o assistente virtual da Barbearia Pulse. Seja extremamente descontraído e simpático.
Objetivos:
1. Oferecer nossos serviços principais (Corte de Cabelo: R$45, Barba Premium: R$35, Combo: R$70).
2. Agendar horários. Ofereça opções à tarde hoje ou amanhã de manhã.
3. Obter o nome do cliente de forma leve.`;
    } else if (type === 'mecanica') {
      prompt = `Você é o assistente virtual inteligente da Oficina AutoPulse. Seja profissional, técnico e atencioso.
Objetivos:
1. Coletar o modelo e ano do carro do cliente.
2. Identificar se o problema é barulho, vazamento, revisão ou peças.
3. Agendar uma avaliação física gratuita rápida na oficina de segunda a sexta, das 8h às 18h.`;
    } else if (type === 'imobiliaria') {
      prompt = `Você é o consultor imobiliário inteligente da Pulse Imóveis. Seja formal, educado e focado em negócios.
Objetivos:
1. Entender se o lead deseja COMPRAR ou ALUGAR.
2. Coletar a faixa de orçamento do cliente (ex: até R$ 3.000/mês para aluguel ou até R$ 500 mil para compra).
3. Coletar o número de quartos e a região ideal de preferência.`;
    } else if (type === 'clinica') {
      prompt = `Você é o assistente de saúde inteligente da Clínica PulseMédica. Seja extremamente empático, ético e calmo.
Objetivos:
1. Confirmar se o atendimento é por plano de saúde (convênio) ou consulta particular.
2. Identificar a especialidade médica desejada (Clínico geral, Pediatria, Odonto ou Cardiologia).
3. Verificar a preferência de período (Manhã ou Tarde) para agendar o especialista.`;
    }
    setAiPrompt(prompt);
  };

  // Mock data for initial UI
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
    <div className="h-[calc(100vh-140px)] flex glass-dark border-white/5 rounded-2xl overflow-hidden">
      {/* 1. Sidebar - Chats List */}
      <div className="w-80 border-r border-white/5 flex flex-col">
        <div className="p-4 border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <Input placeholder="Buscar conversas..." className="pl-9 h-9 bg-white/5 border-white/10 text-white text-sm" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {conversations.map((chat) => (
            <div 
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={cn(
                "p-4 flex gap-3 cursor-pointer transition-colors border-l-2",
                selectedChat?.id === chat.id ? "bg-blue-600/10 border-blue-600" : "hover:bg-white/5 border-transparent"
              )}
            >
              <Avatar className="h-12 w-12 border border-white/10">
                <AvatarFallback className="bg-blue-600/20 text-blue-400 font-bold">
                  {chat.contact.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-semibold text-white truncate">{chat.contact.name}</h4>
                  <span className="text-[10px] text-gray-500">{chat.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                  {chat.unread > 0 && (
                    <Badge className="bg-blue-600 text-[10px] h-4 w-4 p-0 flex items-center justify-center rounded-full">
                      {chat.unread}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* 2. Main Chat Area */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col bg-black/20">
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-white/10">
                <AvatarFallback className="bg-blue-600/20 text-blue-400">
                  {selectedChat.contact.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold text-white leading-none">{selectedChat.contact.name}</h4>
                <span className="text-xs text-green-500 flex items-center gap-1 mt-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Online
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Botão PulseAI Glow */}
              <Button 
                variant="outline" 
                onClick={() => setShowAiSettings(!showAiSettings)}
                className={cn(
                  "rounded-full border border-blue-500/30 bg-blue-500/5 text-blue-400 hover:bg-blue-500/20 gap-2 flex items-center h-9 px-4 text-xs font-semibold shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all",
                  aiEnabled && "border-green-500/30 bg-green-500/5 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.15)] hover:bg-green-500/20"
                )}
              >
                <Sparkles className={cn("h-3.5 w-3.5", aiEnabled && "animate-pulse")} />
                <span>PulseAI: {aiEnabled ? 'Ativo' : 'Desligado'}</span>
                {aiEnabled && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                )}
              </Button>

              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <MoreVertical className="h-4 w-4" />
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
                  "max-w-[70%] p-3 rounded-2xl text-sm",
                  msg.direction === 'OUTBOUND' 
                    ? "bg-blue-600 text-white rounded-tr-none shadow-[0_4px_12px_rgba(37,99,235,0.2)]" 
                    : "bg-white/5 text-gray-200 border border-white/10 rounded-tl-none"
                )}>
                  {msg.content}
                  <div className="text-[10px] mt-1 text-right opacity-60 flex items-center justify-end gap-1.5">
                    {msg.metadata?.aiGenerated && (
                      <Badge className="bg-green-500/30 text-green-300 hover:bg-green-500/30 text-[8px] h-3 px-1 rounded flex items-center gap-0.5 border-none font-bold select-none tracking-wide">
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
          <div className="p-4 bg-[#0a0a0a] border-t border-white/5">
            <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-white">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input 
                placeholder="Digite sua mensagem..." 
                className="border-none bg-transparent text-white focus-visible:ring-0 placeholder:text-gray-600"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-white">
                <Smile className="h-5 w-5" />
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 h-10 w-10 p-0 rounded-lg"
                onClick={handleSend}
              >
                <Send className="h-4 w-4 text-white" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-4">
          <div className="p-6 bg-white/5 rounded-full">
            <MessageSquare className="h-12 w-12 text-gray-700" />
          </div>
          <p className="text-lg font-medium">Selecione uma conversa para começar</p>
        </div>
      )}

      {/* 3. Details Sidebar (Optional but recommended) */}
      {selectedChat && (
        showAiSettings ? (
          <div className="w-80 border-l border-white/5 bg-[#0b0b0c] p-5 hidden lg:flex flex-col animate-in slide-in-from-right duration-300 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                <Sparkles className="h-4 w-4 text-blue-400" />
                <span>Configurar PulseAI</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAiSettings(false)}
                className="text-gray-500 hover:text-white h-7 px-2"
              >
                Voltar
              </Button>
            </div>

            {/* AI Control Body */}
            <div className="space-y-5 text-left">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <span className="text-xs font-semibold text-white block">Autopiloto de IA</span>
                  <span className="text-[10px] text-gray-500">Responder leads automaticamente</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={aiEnabled}
                  onChange={(e) => setAiEnabled(e.target.checked)}
                  className="w-8 h-4 rounded-full bg-gray-600 checked:bg-green-500 cursor-pointer appearance-none relative before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:transition-all checked:before:translate-x-4 border border-white/10"
                />
              </div>

              {/* Model Selector */}
              <div>
                <label className="text-[10px] uppercase font-semibold text-gray-500 block mb-1.5">Motor de IA</label>
                <select 
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="gemini" className="bg-[#0a0a0a]">Google Gemini 1.5 Flash</option>
                  <option value="openai" className="bg-[#0a0a0a]">OpenAI GPT-4o Mini</option>
                </select>
              </div>

              {/* API Key */}
              <div>
                <label className="text-[10px] uppercase font-semibold text-gray-500 block mb-1.5">Chave de API (Opcional)</label>
                <Input 
                  type="password"
                  value={aiApiKey}
                  onChange={(e) => setAiApiKey(e.target.value)}
                  placeholder="sk-... (Deixe vazio para o NLP de demonstração)"
                  className="w-full bg-white/5 border-white/10 text-xs h-8 text-white focus-visible:ring-blue-500"
                />
              </div>

              {/* Preset Persona Quick Select */}
              <div>
                <label className="text-[10px] uppercase font-semibold text-gray-500 block mb-2">Carregar Templates Rápidos</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button 
                    onClick={() => handleApplyPreset('barbearia')}
                    className="p-2 rounded-lg bg-white/5 border border-white/5 text-[10px] text-gray-300 hover:bg-blue-600/10 hover:border-blue-500/30 transition-all text-left flex flex-col gap-0.5"
                  >
                    <span>💇 Barbearia</span>
                    <span className="text-[8px] text-gray-500">Agendar cortes</span>
                  </button>
                  <button 
                    onClick={() => handleApplyPreset('mecanica')}
                    className="p-2 rounded-lg bg-white/5 border border-white/5 text-[10px] text-gray-300 hover:bg-blue-600/10 hover:border-blue-500/30 transition-all text-left flex flex-col gap-0.5"
                  >
                    <span>🚗 Oficina</span>
                    <span className="text-[8px] text-gray-500">Revisões e peças</span>
                  </button>
                  <button 
                    onClick={() => handleApplyPreset('imobiliaria')}
                    className="p-2 rounded-lg bg-white/5 border border-white/5 text-[10px] text-gray-300 hover:bg-blue-600/10 hover:border-blue-500/30 transition-all text-left flex flex-col gap-0.5"
                  >
                    <span>🏡 Imobiliária</span>
                    <span className="text-[8px] text-gray-500">Aluguel e compra</span>
                  </button>
                  <button 
                    onClick={() => handleApplyPreset('clinica')}
                    className="p-2 rounded-lg bg-white/5 border border-white/5 text-[10px] text-gray-300 hover:bg-blue-600/10 hover:border-blue-500/30 transition-all text-left flex flex-col gap-0.5"
                  >
                    <span>🦷 Clínica</span>
                    <span className="text-[8px] text-gray-500">Odonto e consultas</span>
                  </button>
                </div>
              </div>

              {/* Prompt Persona Textarea */}
              <div>
                <label className="text-[10px] uppercase font-semibold text-gray-500 block mb-1.5">Instruções / Persona do Robô</label>
                <textarea 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={6}
                  placeholder="Escreva como o robô deve responder os seus clientes..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-gray-600 leading-relaxed font-sans resize-none"
                />
              </div>

              {/* Save Button */}
              <Button 
                onClick={handleSaveAiSettings}
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-9 text-xs font-semibold shadow-[0_4px_12px_rgba(37,99,235,0.3)] mt-2 border-none"
              >
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-72 border-l border-white/5 bg-[#0a0a0a] p-6 hidden lg:flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex flex-col items-center mb-8">
              <Avatar className="h-20 w-20 mb-4 border-2 border-blue-600/20">
                <AvatarFallback className="bg-blue-600/20 text-blue-400 text-2xl font-bold">
                  {selectedChat.contact.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-bold text-white">{selectedChat.contact.name}</h3>
              <Badge variant="outline" className="mt-2 bg-blue-500/10 text-blue-400 border-none">Lead Qualificado</Badge>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Informações</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <Phone className="h-4 w-4 text-gray-500" />
                    {selectedChat.contact.phone}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <Mail className="h-4 w-4 text-gray-500" />
                    marcelo@exemplo.com
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Ações Rápidas</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="text-xs border-white/10 text-white h-auto py-3">Criar Pedido</Button>
                  <Button variant="outline" className="text-xs border-white/10 text-white h-auto py-3">Novo Deal</Button>
                </div>
              </div>
            </div>
          </div>
        )
      )}
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
