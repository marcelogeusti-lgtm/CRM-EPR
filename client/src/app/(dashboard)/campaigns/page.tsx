'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Megaphone,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Play,
  X,
  ChevronRight,
  TrendingUp,
  Users,
  AlertCircle,
  Loader2,
  Ban
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/system/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function CampaignsPage() {
  const { tenant, user } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchContact, setSearchContact] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [campaignName, setCampaignName] = useState('');
  const [campaignMessage, setCampaignMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);

  // Estados de Websockets / Progresso ao vivo
  const [liveProgress, setLiveProgress] = useState<{ [key: string]: { sent: number; total: number; status: string } }>({});
  const socketRef = useRef<Socket | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // 1. Carregar Campanhas e Contatos
  useEffect(() => {
    const loadCampaignData = async () => {
      if (!tenant?.id) return;
      try {
        const [campRes, contRes] = await Promise.all([
          axios.get(`${apiUrl}/campaigns`),
          axios.get(`${apiUrl}/contacts`),
        ]);
        setCampaigns(campRes.data);
        setContacts(contRes.data);
      } catch (err: any) {
        console.error('Erro ao carregar dados:', err);
        // Fallback local se o banco der timeout
        toast.error('Erro ao conectar com o banco de dados. Modo de visualização offline.');
        setCampaigns([]);
        setContacts([
          { id: '1', name: 'Marcelo Geusti', phone: '5511999999999', email: 'marcelo@geusti.com' },
          { id: '2', name: 'Ana Cláudia', phone: '5511988888888', email: 'ana@gmail.com' },
          { id: '3', name: 'Carlos Eduardo', phone: '5511977777777', email: 'carlos@outlook.com' }
        ]);
      }
    };

    loadCampaignData();
  }, [tenant?.id]);

  // 2. Conectar Websockets para progresso de campanhas ao vivo
  useEffect(() => {
    if (!tenant?.id) return;

    const socket = io(apiUrl, {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket conectado nas Campanhas:', socket.id);
      socket.emit('joinTenant', { tenantId: tenant.id, userId: user?.id });
    });

    // Ouvinte de progresso da fila em tempo real
    socket.on('campaignProgress', (data: { campaignId: string; status: string; sent: number; total: number; error?: string }) => {
      console.log('Progresso recebido da IA/Fila:', data);
      
      setLiveProgress((prev) => ({
        ...prev,
        [data.campaignId]: {
          sent: data.sent,
          total: data.total,
          status: data.status,
        }
      }));

      // Se a campanha finalizou, atualiza o status na tabela principal
      if (data.status === 'COMPLETED' || data.status === 'CANCELLED') {
        if (data.status === 'COMPLETED') {
          toast.success(`Campanha em massa finalizada com sucesso!`);
        } else {
          toast.error(`Campanha interrompida: ${data.error || 'Cancelada'}`);
        }
        
        // Recarrega campanhas
        axios.get(`${apiUrl}/campaigns`).then((res) => setCampaigns(res.data)).catch(() => {});
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [tenant?.id, user?.id]);

  // 3. Seleção de Contatos
  const handleSelectContact = (id: string) => {
    setSelectedContacts((prev) => 
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]
    );
  };

  const handleSelectAllContacts = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map((c) => c.id));
    }
  };

  const filteredContacts = contacts.filter((c) => 
    c.name.toLowerCase().includes(searchContact.toLowerCase()) ||
    (c.phone && c.phone.includes(searchContact))
  );

  // 4. Submeter Disparo de Nova Campanha
  const handleCreateCampaign = async () => {
    if (!campaignName.trim()) {
      return toast.error('Insira o nome da campanha.');
    }
    if (selectedContacts.length === 0) {
      return toast.error('Selecione pelo menos um contato de destino.');
    }
    if (!campaignMessage.trim()) {
      return toast.error('Insira o texto da mensagem.');
    }

    setLoading(true);
    try {
      const response = await axios.post(`${apiUrl}/campaigns`, {
        name: campaignName,
        message: campaignMessage,
        contactIds: selectedContacts,
      });

      // Adiciona localmente de imediato
      setCampaigns((prev) => [
        {
          ...response.data,
          targets: selectedContacts.map((cId) => ({
            id: Math.random().toString(),
            contact: contacts.find((c) => c.id === cId),
            status: 'PENDING'
          }))
        },
        ...prev
      ]);

      toast.success('Fila iniciada! Disparos sendo enviados em lote de forma segura.');
      
      // Limpa formulário
      setCampaignName('');
      setCampaignMessage('');
      setSelectedContacts([]);
      setShowNewCampaignModal(false);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 403) {
        toast.error('Acesso Negado: Apenas administradores e supervisores (ACL) podem disparar campanhas.');
      } else {
        toast.error('Erro ao registrar campanha em massa. Verifique sua conexão.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 5. Cancelar Campanha em Andamento
  const handleCancelCampaign = async (id: string) => {
    try {
      await axios.post(`${apiUrl}/campaigns/${id}/cancel`);
      toast.success('Disparo de campanha cancelado com sucesso.');
      setCampaigns((prev) => 
        prev.map((c) => c.id === id ? { ...c, status: 'CANCELLED' } : c)
      );
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao abortar campanha.');
    }
  };

  // Estatísticas Rápidas
  const totalCampaigns = campaigns.length;
  const totalSentTargets = campaigns.reduce((acc, c) => 
    acc + (c.targets?.filter((t: any) => t.status === 'SENT').length || 0), 0
  );
  const totalFailedTargets = campaigns.reduce((acc, c) => 
    acc + (c.targets?.filter((t: any) => t.status === 'FAILED').length || 0), 0
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      <div className="flex justify-between items-center">
        <PageHeader 
          title="Campanhas de Mensagens em Massa"
          description="Envios em lote no WhatsApp integrados à fila assíncrona com controle de latência anti-ban e permissões de cargo (ACL)."
        />
        <Button 
          onClick={() => setShowNewCampaignModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md font-bold px-4 py-2.5 flex items-center gap-2 cursor-pointer border-none"
        >
          <Plus className="size-4" />
          <span>Nova Campanha</span>
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4 text-left">
          <div className="size-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Megaphone className="size-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Campanhas Criadas</span>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalCampaigns}</h3>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4 text-left">
          <div className="size-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mensagens Entregues</span>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalSentTargets}</h3>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4 text-left">
          <div className="size-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
            <XCircle className="size-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Erros / Bloqueios</span>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalFailedTargets}</h3>
          </div>
        </div>
      </div>

      {/* Histórico e Disparos */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-left">
        <div className="p-6 border-b border-slate-200">
          <h4 className="text-sm font-bold text-slate-800">Fila de Disparos Recentes</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-700">
            <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Campanha</th>
                <th className="px-6 py-4">Mensagem Base</th>
                <th className="px-6 py-4">Alvos</th>
                <th className="px-6 py-4">Status / Progresso</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {campaigns.length > 0 ? (
                campaigns.map((camp) => {
                  const live = liveProgress[camp.id];
                  const currentStatus = live ? live.status : camp.status;
                  const total = camp.targets?.length || 0;
                  const sent = live ? live.sent : (camp.targets?.filter((t: any) => t.status === 'SENT' || t.status === 'FAILED').length || 0);
                  const progressPct = total > 0 ? Math.round((sent / total) * 100) : 0;

                  return (
                    <tr key={camp.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800 max-w-[150px] truncate">{camp.name}</td>
                      <td className="px-6 py-4 text-slate-400 max-w-[200px] truncate">{camp.message}</td>
                      <td className="px-6 py-4 font-medium">{total} contatos</td>
                      <td className="px-6 py-4">
                        <div className="space-y-2 min-w-[150px]">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <Badge className={cn(
                              "border-none hover:opacity-100",
                              currentStatus === 'COMPLETED' && "bg-emerald-50 text-emerald-700",
                              currentStatus === 'PROCESSING' && "bg-blue-50 text-blue-700 animate-pulse",
                              currentStatus === 'PENDING' && "bg-amber-50 text-amber-700",
                              currentStatus === 'CANCELLED' && "bg-slate-100 text-slate-650"
                            )}>
                              {currentStatus === 'COMPLETED' ? 'Concluída' : 
                               currentStatus === 'PROCESSING' ? 'Disparando...' : 
                               currentStatus === 'PENDING' ? 'Na Fila' : 'Cancelada'}
                            </Badge>
                            <span>{sent}/{total} ({progressPct}%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all duration-300",
                                currentStatus === 'COMPLETED' && "bg-emerald-500",
                                currentStatus === 'PROCESSING' && "bg-blue-600",
                                currentStatus === 'PENDING' && "bg-amber-400",
                                currentStatus === 'CANCELLED' && "bg-slate-300"
                              )}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(camp.createdAt).toLocaleDateString()} {new Date(camp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {currentStatus === 'PROCESSING' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleCancelCampaign(camp.id)}
                            className="text-red-500 hover:text-red-650 hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            <Ban className="size-3.5 mr-1" /> Abortar
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Nenhuma campanha registrada no momento.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Deslizante de Nova Campanha */}
      <AnimatePresence>
        {showNewCampaignModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewCampaignModal(false)}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[480px] bg-white border-l border-slate-200 z-50 shadow-2xl p-6 flex flex-col text-left"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-6 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Megaphone className="size-5 text-blue-600" />
                  <h4 className="text-sm font-bold text-slate-800">Nova Campanha em Massa</h4>
                </div>
                <button 
                  onClick={() => setShowNewCampaignModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <ScrollArea className="flex-1 pr-1.5 space-y-6">
                <div className="space-y-5 pb-8">
                  {/* Nome da Campanha */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Identificação da Campanha</label>
                    <Input 
                      placeholder="Ex: Lançamento Coleção Outono / Reengajamento Leads" 
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      className="border-slate-200 rounded-xl"
                    />
                  </div>

                  {/* Seleção de Contatos Destino */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block">Lista de Destinatários ({selectedContacts.length} selecionados)</label>
                      <button 
                        onClick={handleSelectAllContacts}
                        className="text-[9px] font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        {selectedContacts.length === filteredContacts.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                      </button>
                    </div>

                    <div className="relative mb-2.5">
                      <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
                      <input 
                        placeholder="Buscar contatos..." 
                        value={searchContact}
                        onChange={(e) => setSearchContact(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 h-9 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm" 
                      />
                    </div>

                    <div className="border border-slate-200 rounded-xl max-h-40 overflow-y-auto divide-y divide-slate-150 shadow-inner bg-slate-50/20">
                      {filteredContacts.length > 0 ? (
                        filteredContacts.map((c) => (
                          <div 
                            key={c.id} 
                            onClick={() => handleSelectContact(c.id)}
                            className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
                          >
                            <div>
                              <span className="text-xs font-semibold text-slate-700 block">{c.name}</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">{c.phone || c.email}</span>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={selectedContacts.includes(c.id)}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer pointer-events-none"
                            />
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-slate-400">Nenhum contato qualificado encontrado.</div>
                      )}
                    </div>
                  </div>

                  {/* Corpo da Mensagem com Placeholders */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block">Corpo do WhatsApp</label>
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="size-2.5 text-blue-500 animate-pulse" />
                        <span>Placeholders ativos</span>
                      </span>
                    </div>

                    <textarea 
                      value={campaignMessage}
                      onChange={(e) => setCampaignMessage(e.target.value)}
                      rows={6}
                      placeholder="Olá {name}! Vi que você tem interesse no nosso serviço de barbearia..."
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400 leading-relaxed resize-none shadow-sm"
                    />

                    {/* Dica do Placeholder */}
                    <div className="mt-2.5 p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 flex gap-2.5">
                      <AlertCircle className="size-4 text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-blue-600 leading-relaxed font-medium">
                        Adicione a tag <strong>{`{name}`}</strong> em qualquer local da sua mensagem para substituí-la automaticamente pelo nome do destinatário (ex: <em>Olá Marcelo Geusti!</em>).
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="pt-4 border-t border-slate-200 flex-shrink-0 flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowNewCampaignModal(false)}
                  className="flex-1 rounded-xl h-11 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateCampaign}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 text-xs font-bold shadow-md cursor-pointer border-none flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Agendando...</span>
                    </>
                  ) : (
                    <>
                      <Play className="size-3.5" />
                      <span>Iniciar Disparos</span>
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
