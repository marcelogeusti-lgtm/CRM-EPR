'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
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
  Bot,
  Circle,
  MessageSquare,
  CornerUpLeft,
  X,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/system/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function InboxPage() {
  const { user, tenant } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [agents, setAgents] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: boolean }>({});
  const [replyingTo, setReplyingTo] = useState<any>(null);
  
  // Novos estados da IA Operacional
  const [suggesting, setSuggesting] = useState(false);
  const [conversationSummary, setConversationSummary] = useState<string>('');
  const [summarizing, setSummarizing] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Estados do PulseAI Autopilot
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiModel, setAiModel] = useState('gemini');
  const [aiApiKey, setAiApiKey] = useState('');
  const [saving, setSaving] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // 1. Conexão Socket.io & Listeners de Eventos
  useEffect(() => {
    if (!tenant?.id || !user?.id) return;

    // Estabelecer conexão WebSocket com o backend
    const socket = io(apiUrl, {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket conectado:', socket.id);
      // Entrar na sala do tenant e reportar presença online
      socket.emit('joinTenant', { tenantId: tenant.id, userId: user.id });
    });

    // Ouvir novos updates de presença
    socket.on('presenceUpdate', (data: { userId: string; isOnline: boolean; lastActiveAt: string }) => {
      setAgents((prev) => 
        prev.map((agent) => 
          agent.id === data.userId 
            ? { ...agent, isOnline: data.isOnline, lastActiveAt: data.lastActiveAt }
            : agent
        )
      );
    });

    // Ouvir status de digitação de outros atendentes
    socket.on('typingStatus', (data: { contactId: string; userId: string; isTyping: boolean }) => {
      if (data.userId !== user.id) {
        setTypingUsers((prev) => ({
          ...prev,
          [`${data.contactId}_${data.userId}`]: data.isTyping,
        }));
      }
    });

    // Ouvir novas mensagens em tempo real
    socket.on('newMessage', (msg: any) => {
      // Se a mensagem pertence à conversa atualmente selecionada, adiciona na lista
      if (selectedChat && msg.conversationId === selectedChat.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        // Envia confirmação de leitura automática
        socket.emit('markAsRead', { tenantId: tenant.id, conversationId: selectedChat.id, userId: user.id });
      }

      // Atualiza a conversa na barra lateral
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === msg.conversationId);
        if (index === -1) return prev;

        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          unreadCount: selectedChat?.id === msg.conversationId ? 0 : updated[index].unreadCount + (msg.direction === 'INBOUND' ? 1 : 0),
        };

        // Reordena conversas colocando a mais recente no topo
        return updated.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
      });
    });

    // Ouvir reações a mensagens em tempo real
    socket.on('messageReactionUpdate', (data: { messageId: string; reactions: any[] }) => {
      setMessages((prev) => 
        prev.map((m) => 
          m.id === data.messageId 
            ? { ...m, metadata: { ...(m.metadata || {}), reactions: data.reactions } }
            : m
        )
      );
    });

    // Ouvir confirmações de leitura
    socket.on('conversationRead', (data: { conversationId: string }) => {
      setConversations((prev) => 
        prev.map((c) => 
          c.id === data.conversationId 
            ? { ...c, unreadCount: 0 }
            : c
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [tenant?.id, user?.id, selectedChat?.id]);

  // 2. Carregar dados via API REST (Conversas e Agentes)
  useEffect(() => {
    const loadInboxData = async () => {
      if (!tenant?.id) return;
      try {
        const [convRes, agentRes] = await Promise.all([
          axios.get(`${apiUrl}/chat/conversations`),
          axios.get(`${apiUrl}/chat/agents`),
        ]);
        setConversations(convRes.data);
        setAgents(agentRes.data);
      } catch (err) {
        console.error('Erro ao carregar dados do inbox:', err);
        toast.error('Erro ao carregar conversas em tempo real.');
      }
    };

    loadInboxData();
  }, [tenant?.id]);

  // Limpa o resumo de conversa sempre que seleciona um novo chat
  useEffect(() => {
    setConversationSummary('');
  }, [selectedChat]);

  // 3. Carregar mensagens de um chat selecionado
  useEffect(() => {
    if (!selectedChat) return;

    const loadMessages = async () => {
      try {
        const response = await axios.get(`${apiUrl}/chat/conversations/${selectedChat.id}/messages`);
        setMessages(response.data);

        // Limpa o indicador de unread localmente
        setConversations((prev) => 
          prev.map((c) => c.id === selectedChat.id ? { ...c, unreadCount: 0 } : c)
        );

        // Avisa os outros atendentes via socket que visualizamos a conversa
        if (socketRef.current) {
          socketRef.current.emit('markAsRead', {
            tenantId: tenant?.id,
            conversationId: selectedChat.id,
            userId: user?.id,
          });
        }
      } catch (err) {
        console.error('Erro ao carregar mensagens:', err);
        toast.error('Erro ao recuperar histórico do chat.');
      }
    };

    loadMessages();
  }, [selectedChat, tenant?.id, user?.id]);

  // Rolar para o final da lista de mensagens
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingUsers]);

  // 4. Carregar configurações de IA
  useEffect(() => {
    const fetchAiSettings = async () => {
      if (!tenant?.id) return;
      try {
        const response = await axios.get(`${apiUrl}/tenant/ai-settings`);
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
  }, [tenant?.id]);

  // 5. Salvar configurações de IA
  const handleSaveAiSettings = async () => {
    setSaving(true);
    const settingsPayload = { aiEnabled, aiPrompt, aiModel, aiApiKey };
    try {
      await axios.post(`${apiUrl}/tenant/ai-settings`, settingsPayload);
      localStorage.setItem('pulse_ai_settings', JSON.stringify(settingsPayload));
      toast.success('Configurações do PulseAI salvas com sucesso!');
    } catch (err) {
      localStorage.setItem('pulse_ai_settings', JSON.stringify(settingsPayload));
      toast.success('Salvo localmente com sucesso!');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyPreset = (type: string) => {
    let prompt = '';
    if (type === 'barbearia') {
      prompt = `Você é o assistente virtual da Barbearia Pulse. Seja extremamente descontraído e simpático.\nObjetivos:\n1. Oferecer nossos serviços principais (Corte: R$45, Barba: R$35).\n2. Agendar horários comercialmente hoje ou amanhã.`;
    } else if (type === 'mecanica') {
      prompt = `Você é o assistente virtual inteligente da Oficina AutoPulse. Seja profissional, técnico e atencioso.\nObjetivos:\n1. Coletar o modelo e ano do carro.\n2. Agendar uma avaliação física gratuita.`;
    } else if (type === 'imobiliaria') {
      prompt = `Você é o consultor imobiliário da Pulse Imóveis. Seja educado e focado.\nObjetivos:\n1. Entender se o lead deseja comprar ou alugar.\n2. Coletar faixa de orçamento.`;
    } else if (type === 'clinica') {
      prompt = `Você é o assistente de saúde inteligente da Clínica PulseMédica.\nObjetivos:\n1. Identificar especialidade médica e convênio.`;
    }
    setAiPrompt(prompt);
  };

  // 6. Enviar Mensagem (REST + WebSockets integrado)
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    const messageContent = newMessage;
    setNewMessage('');

    // Prepara metadados da mensagem (ex: citação / reply)
    const msgMetadata: any = {};
    if (replyingTo) {
      msgMetadata.quotedMessage = {
        id: replyingTo.id,
        content: replyingTo.content,
        senderName: replyingTo.direction === 'OUTBOUND' ? 'Você' : selectedChat.contact.name,
      };
      setReplyingTo(null);
    }

    try {
      // Envia via REST API (que persiste, avisa sockets e despacha canal)
      const response = await axios.post(`${apiUrl}/chat/conversations/${selectedChat.id}/messages`, {
        content: messageContent,
        metadata: msgMetadata,
      });

      // Atualiza mensagens localmente de imediato
      setMessages((prev) => {
        if (prev.some((m) => m.id === response.data.id)) return prev;
        return [...prev, response.data];
      });
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      toast.error('Erro ao disparar mensagem.');
    }
  };

  // 7. Disparar Reação a uma Mensagem
  const handleReact = (messageId: string, emoji: string) => {
    if (socketRef.current && tenant?.id && user?.id) {
      socketRef.current.emit('messageReaction', {
        tenantId: tenant.id,
        messageId,
        emoji,
        userId: user.id,
      });
    }
  };

  // 8. Evento Digitando...
  const handleInputChange = (val: string) => {
    setNewMessage(val);

    if (socketRef.current && tenant?.id && user?.id && selectedChat) {
      // Dispara que está digitando
      socketRef.current.emit('typing', {
        tenantId: tenant.id,
        contactId: selectedChat.contactId,
        isTyping: true,
        userId: user.id,
      });

      // Debounce para parar de digitar após 2 segundos sem input
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current && selectedChat) {
          socketRef.current.emit('typing', {
            tenantId: tenant.id,
            contactId: selectedChat.contactId,
            isTyping: false,
            userId: user.id,
          });
        }
      }, 2000);
    }
  };

  // 9. Copiloto de IA: Sugerir Resposta Contextualizada
  const handleSuggestReply = async () => {
    if (!selectedChat) return;
    setSuggesting(true);
    try {
      const response = await axios.post(`${apiUrl}/chat/conversations/${selectedChat.id}/suggest-reply`);
      if (response.data?.suggestion) {
        setNewMessage(response.data.suggestion);
        toast.success('Resposta contextualizada sugerida pelo Copiloto!');
      } else {
        toast.error('Não foi possível gerar uma resposta inteligente no momento.');
      }
    } catch (err) {
      console.error('Erro ao gerar sugestão de resposta:', err);
      toast.error('Erro de conexão ao gerar resposta sugerida.');
    } finally {
      setSuggesting(false);
    }
  };

  // 10. Resumo de Conversas no Clique
  const handleGenerateSummary = async () => {
    if (!selectedChat) return;
    setSummarizing(true);
    try {
      const response = await axios.post(`${apiUrl}/chat/conversations/${selectedChat.id}/summarize`);
      if (response.data?.summary) {
        setConversationSummary(response.data.summary);
        toast.success('Sumário analítico gerado pela IA com sucesso!');
      } else {
        toast.error('Falha ao consolidar o histórico.');
      }
    } catch (err) {
      console.error('Erro ao consolidar resumo:', err);
      toast.error('Erro ao acionar o barramento de sumários.');
    } finally {
      setSummarizing(false);
    }
  };

  // Coleta se existe algum usuário ativamente digitando nesta conversa
  const getTypingIndicatorText = () => {
    if (!selectedChat) return null;
    const typingList = Object.entries(typingUsers)
      .filter(([key, isTyping]) => key.startsWith(selectedChat.contactId) && isTyping);

    if (typingList.length === 0) return null;

    if (typingList.length === 1) {
      const agentId = typingList[0][0].split('_')[1];
      const agent = agents.find((a) => a.id === agentId);
      return `${agent?.name || 'Um atendente'} está digitando...`;
    }

    return 'Múltiplos atendentes estão digitando...';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      <PageHeader 
        title="Inbox Omnichannel Premium"
        description="Painel de mensagens em tempo real integrado a múltiplos canais oficiais e piloto automático de IA."
      />

      <div className="h-[calc(100vh-210px)] flex bg-zinc-900/40 backdrop-blur-md border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
        
        {/* 1. Sidebar - Chats & Presença */}
        <div className="w-80 border-r border-zinc-800/50 flex flex-col bg-zinc-900/60">
          {/* Header de Busca */}
          <div className="p-4 border-b border-zinc-800/50 bg-zinc-900/40">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-zinc-500" />
              <input 
                placeholder="Buscar conversas..." 
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl pl-9 pr-3 h-9 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner" 
              />
            </div>
          </div>

          <ScrollArea className="flex-1 bg-transparent">
            <div className="divide-y divide-zinc-100">
              {conversations.length > 0 ? (
                conversations.map((chat) => (
                  <div 
                    key={chat.id}
                    onClick={() => {
                      setSelectedChat(chat);
                      setReplyingTo(null);
                    }}
                    className={cn(
                      "p-4 flex gap-3 cursor-pointer transition-colors border-l-4",
                      selectedChat?.id === chat.id 
                        ? "bg-zinc-800/80 border-l-blue-500 shadow-inner" 
                        : "hover:bg-zinc-800/40 border-l-transparent"
                    )}
                  >
                    <Avatar className="h-10 w-10 border border-zinc-700">
                      <AvatarFallback className="bg-zinc-800 text-zinc-300 font-bold text-sm">
                        {chat.contact.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={cn("text-xs truncate", selectedChat?.id === chat.id ? "font-bold text-zinc-100" : "font-semibold text-zinc-300")}>
                          {chat.contact.name}
                        </h4>
                        <span className="text-[10px] text-zinc-500">
                          {new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-[11px] text-zinc-400 truncate leading-relaxed">
                          {chat.lastMessageDirection === 'OUTBOUND' && <span className="font-semibold text-zinc-500">Você: </span>}
                          {chat.lastMessage}
                        </p>
                        {chat.unreadCount > 0 && (
                          <Badge className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] h-4 min-w-4 px-1 flex items-center justify-center rounded-full border-none shadow-[0_0_10px_rgba(37,99,235,0.5)]">
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-zinc-500">Nenhuma conversa encontrada.</div>
              )}
            </div>
          </ScrollArea>

          {/* Seção inferior mostrando agentes online/offline da empresa */}
          <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/40">
            <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2.5">Presença na Organização</h5>
            <div className="space-y-2 max-h-24 overflow-y-auto custom-scrollbar">
              {agents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 text-zinc-300 font-medium">
                    <div className="relative">
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full border border-zinc-800",
                        agent.isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-zinc-600"
                      )} />
                    </div>
                    <span>{agent.name} {agent.id === user?.id && <span className="text-[9px] text-zinc-500">(Você)</span>}</span>
                  </div>
                  <span className="text-[9px] text-zinc-500">
                    {agent.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Chat Principal */}
        {selectedChat ? (
          <div className="flex-1 flex flex-col bg-zinc-950/40">
            
            {/* Header do Chat Selecionado */}
            <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/40 backdrop-blur-sm z-10">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-zinc-700">
                  <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs font-bold shadow-inner">
                    {selectedChat.contact.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-xs font-bold text-zinc-100 leading-none">{selectedChat.contact.name}</h4>
                  <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1.5 mt-1.5">
                    <Circle className="size-2 fill-emerald-500 text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] rounded-full" /> Atendimento Ativo
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                
                {/* Autopiloto toggle button */}
                <button 
                  onClick={() => setShowAiSettings(!showAiSettings)}
                  className={cn(
                    "rounded-xl border px-3 h-9 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer",
                    aiEnabled 
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" 
                      : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800"
                  )}
                >
                  <Sparkles className="size-3.5 text-blue-500" />
                  <span>Autopiloto: {aiEnabled ? 'Ativo' : 'Manual'}</span>
                </button>

                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl size-9">
                  <Phone className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl size-9">
                  <MoreVertical className="size-4" />
                </Button>
              </div>
            </div>

            {/* Balões de Mensagem */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
              {messages.map((msg) => {
                const isOutbound = msg.direction === 'OUTBOUND';
                const hasReactions = msg.metadata?.reactions && msg.metadata.reactions.length > 0;
                const quoted = msg.metadata?.quotedMessage;

                return (
                  <div 
                    key={msg.id}
                    className={cn(
                      "flex w-full group relative mb-2",
                      isOutbound ? "justify-end" : "justify-start"
                    )}
                  >
                    {/* Barra de Reação Rápida (Exibida no hover) */}
                    <div className={cn(
                      "absolute -top-7 hidden group-hover:flex items-center bg-zinc-800/90 backdrop-blur-sm border border-zinc-700 rounded-full px-2 py-1 shadow-lg gap-1.5 z-20 transition-all duration-200",
                      isOutbound ? "right-2" : "left-2"
                    )}>
                      {['👍', '❤️', '🔥', '😂'].map((emoji) => (
                        <button 
                          key={emoji}
                          onClick={() => handleReact(msg.id, emoji)}
                          className="hover:scale-130 transition-transform cursor-pointer text-xs p-0.5"
                        >
                          {emoji}
                        </button>
                      ))}
                      <div className="w-px h-3 bg-zinc-600 mx-0.5" />
                      <button 
                        onClick={() => setReplyingTo(msg)}
                        className="text-[10px] text-zinc-400 font-bold hover:text-blue-400 flex items-center gap-0.5 cursor-pointer px-1"
                      >
                        <CornerUpLeft className="size-3" /> Responder
                      </button>
                    </div>

                    <div className="max-w-[70%] relative flex flex-col">
                      {/* Exibição da Mensagem Citada / Respondida */}
                      {quoted && (
                        <div className={cn(
                          "px-3 py-1.5 rounded-t-xl text-[11px] bg-zinc-800/60 border-l-4 border-blue-500 text-zinc-300 truncate mb-[-4px] opacity-85",
                          isOutbound ? "self-end" : "self-start"
                        )}>
                          <span className="font-semibold text-zinc-400 block text-[9px] uppercase">{quoted.senderName}</span>
                          {quoted.content}
                        </div>
                      )}

                      <div className={cn(
                        "p-3.5 rounded-2xl text-sm leading-relaxed relative",
                        isOutbound 
                          ? "bg-blue-600 text-white rounded-tr-none shadow-[0_4px_15px_rgba(37,99,235,0.2)]" 
                          : "bg-zinc-800/80 backdrop-blur-md text-zinc-200 border border-zinc-700/50 rounded-tl-none shadow-sm"
                      )}>
                        {msg.content}

                        {/* Visualização das reações sob o balão */}
                        {hasReactions && (
                          <div className={cn(
                            "absolute flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-full py-0.5 px-1.5 shadow-sm text-[10px] bottom-[-10px] z-10",
                            isOutbound ? "right-3" : "left-3"
                          )}>
                            {msg.metadata.reactions.map((r: any, idx: number) => (
                              <span key={idx} title={`Reagido por atendente`} className="select-none">
                                {r.emoji}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="text-[9px] mt-1.5 text-right opacity-60 flex items-center justify-end gap-1.5 select-none">
                          {msg.metadata?.aiGenerated && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 text-[8px] h-4 px-1.5 rounded-full font-bold select-none tracking-wide">
                              PulseAI
                            </Badge>
                          )}
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Indicador de Digitando... */}
              {getTypingIndicatorText() && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-xs text-zinc-400 font-medium italic mt-2"
                >
                  <Circle className="size-2 fill-zinc-300 text-zinc-300 animate-pulse" />
                  <span>{getTypingIndicatorText()}</span>
                </motion.div>
              )}
            </div>

            {/* Input e Ações */}
            <div className="p-4 bg-zinc-900/60 backdrop-blur-md border-t border-zinc-800/50 flex flex-col gap-2">
              
              {/* Banner de Mensagem Citada */}
              {replyingTo && (
                <div className="flex items-center justify-between bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-2 text-xs">
                  <div className="flex items-center gap-2 text-zinc-300 truncate">
                    <CornerUpLeft className="size-3.5 text-blue-500 shrink-0" />
                    <span>Respondendo a <strong className="text-zinc-100">{replyingTo.direction === 'OUTBOUND' ? 'Você' : selectedChat.contact.name}</strong>: <em className="italic">{replyingTo.content}</em></span>
                  </div>
                  <button 
                    onClick={() => setReplyingTo(null)}
                    className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 rounded-lg cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 bg-zinc-800/40 p-1.5 rounded-xl border border-zinc-700/80 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500/50 transition-all">
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded-lg size-9">
                  <Paperclip className="size-4" />
                </Button>
                <input 
                  placeholder="Digite sua mensagem..." 
                  className="border-none bg-transparent text-zinc-100 focus:outline-none placeholder:text-zinc-500 text-sm flex-1 ml-2"
                  value={newMessage}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                
                {/* Botão Copiloto IA (Sugerir Resposta) */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleSuggestReply}
                  disabled={suggesting}
                  className="text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg size-9 cursor-pointer"
                  title="Sugerir Resposta via Copiloto de IA"
                >
                  <Sparkles className={cn("size-4 text-blue-500", suggesting && "animate-spin")} />
                </Button>

                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded-lg size-9">
                  <Smile className="size-4" />
                </Button>
                <button 
                  className="bg-blue-600 hover:bg-blue-500 h-9 w-9 p-0 rounded-lg flex items-center justify-center transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)] text-white cursor-pointer"
                  onClick={handleSend}
                >
                  <Send className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 space-y-4 bg-zinc-950/40">
            <div className="size-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-1 text-zinc-400 shadow-sm">
              <Bot className="size-6 text-zinc-500" />
            </div>
            <p className="text-sm font-semibold text-zinc-300">Selecione uma conversa para começar</p>
            <p className="text-xs text-zinc-500 max-w-xs text-center leading-relaxed">Clique em algum contato na barra lateral para iniciar a qualificação manual ou ative o piloto automático de IA.</p>
          </div>
        )}

        {/* 3. Barra Lateral de Configurações de IA */}
        {selectedChat && (
          showAiSettings ? (
            <div className="w-80 border-l border-zinc-800/50 bg-zinc-900/60 backdrop-blur-md p-5 hidden lg:flex flex-col animate-in slide-in-from-right duration-300 overflow-y-auto">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-zinc-800/50">
                <div className="flex items-center gap-2 text-zinc-100 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="size-4 text-blue-500" />
                  <span>PulseAI Autopilot</span>
                </div>
                <button 
                  onClick={() => setShowAiSettings(false)}
                  className="text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Voltar
                </button>
              </div>

              <div className="space-y-5 text-left">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-800/40 border border-zinc-700/80 shadow-sm">
                  <div>
                    <span className="text-xs font-bold text-zinc-100 block">Ativar IA</span>
                    <span className="text-[10px] text-zinc-400 leading-normal block mt-0.5">Responder automaticamente</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={aiEnabled}
                    onChange={(e) => setAiEnabled(e.target.checked)}
                    className="w-8 h-4 rounded-full bg-zinc-700 checked:bg-blue-600 cursor-pointer appearance-none relative before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:transition-all checked:before:translate-x-4 border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5">Modelo de IA</label>
                  <select 
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full bg-zinc-800/40 border border-zinc-700/80 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm cursor-pointer"
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
                    className="w-full bg-zinc-800/40 border border-zinc-700/80 rounded-xl p-2.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-2">Templates de Qualificação</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button 
                      onClick={() => handleApplyPreset('barbearia')}
                      className="p-2.5 rounded-xl bg-zinc-800/40 border border-zinc-700/80 text-[10px] text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 transition-all text-left flex flex-col gap-0.5 cursor-pointer"
                    >
                      <span className="font-bold text-zinc-100">💆 Barbearia</span>
                      <span className="text-[8px] text-zinc-500">Agendar cortes</span>
                    </button>
                    <button 
                      onClick={() => handleApplyPreset('mecanica')}
                      className="p-2.5 rounded-xl bg-zinc-800/40 border border-zinc-700/80 text-[10px] text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 transition-all text-left flex flex-col gap-0.5 cursor-pointer"
                    >
                      <span className="font-bold text-zinc-100">🚗 Oficina</span>
                      <span className="text-[8px] text-zinc-500">Revisões mecânicas</span>
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
                    className="w-full bg-zinc-800/40 border border-zinc-700/80 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-zinc-500 leading-relaxed resize-none shadow-sm"
                  />
                </div>

                <button 
                  onClick={handleSaveAiSettings}
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-11 text-xs font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)] mt-2 transition-colors border-none cursor-pointer flex items-center justify-center"
                >
                  {saving ? 'Gravando...' : 'Salvar Configurações'}
                </button>
              </div>
            </div>
          ) : (
            <div className="w-72 border-l border-zinc-800/50 bg-zinc-900/60 backdrop-blur-md p-6 hidden lg:flex flex-col animate-in slide-in-from-right duration-300 overflow-y-auto">
              
              {/* Avatar e Perfil */}
              <div className="flex flex-col items-center mb-6">
                <Avatar className="h-16 w-16 mb-4 border border-zinc-700 shadow-sm">
                  <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xl font-bold">
                    {selectedChat.contact.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-base font-bold text-zinc-100">{selectedChat.contact.name}</h3>
                <Badge className="mt-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 text-[10px] font-bold py-0.5 px-2 rounded-full">
                  Lead Qualificado
                </Badge>
              </div>

              {/* 3.1 Resumo Dinâmico via IA */}
              <div className="p-4 rounded-xl bg-zinc-800/40 border border-zinc-700/80 text-left mb-6 shadow-sm">
                <div className="flex items-center gap-1.5 text-zinc-200 font-bold text-[11px] uppercase tracking-wider mb-2.5">
                  <Sparkles className="size-3.5 text-blue-500" />
                  <span>Resumo via PulseAI</span>
                </div>
                {conversationSummary ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-zinc-400 leading-relaxed whitespace-pre-line font-medium">{conversationSummary}</p>
                    <button 
                      onClick={handleGenerateSummary}
                      disabled={summarizing}
                      className="text-[9px] font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 mt-2.5 cursor-pointer"
                    >
                      {summarizing ? 'Atualizando...' : 'Recalcular Resumo'}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-[10px] text-zinc-500 mb-2.5">Nenhum resumo gerado para este chat.</p>
                    <Button 
                      onClick={handleGenerateSummary}
                      disabled={summarizing}
                      className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-[10px] font-bold h-7 rounded-lg shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {summarizing ? (
                        <>
                          <Sparkles className="size-3 text-blue-500 animate-spin" />
                          <span>Gerando resumo...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-3 text-blue-500" />
                          <span>Gerar Resumo via IA</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Informações Gerais */}
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-3">Informações de Contato</p>
                  <div className="space-y-3 text-left">
                    <div className="flex items-center gap-3 text-xs text-zinc-300">
                      <Phone className="size-4 text-zinc-500 shrink-0" />
                      {selectedChat.contact.phone}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-300">
                      <Mail className="size-4 text-zinc-500 shrink-0" />
                      {selectedChat.contact.email || `${selectedChat.contact.name.toLowerCase().replace(/\s+/g, '')}@exemplo.com`}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-800/50">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-3">Ações de Vendas</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="text-xs bg-transparent border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 h-auto py-2.5 rounded-xl cursor-pointer">Criar Pedido</Button>
                    <Button variant="outline" className="text-xs bg-transparent border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 h-auto py-2.5 rounded-xl cursor-pointer">Novo Negócio</Button>
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
