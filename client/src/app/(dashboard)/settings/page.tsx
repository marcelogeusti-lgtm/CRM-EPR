'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { PageHeader } from '@/components/system/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Settings2, 
  Smartphone, 
  Shield, 
  Key, 
  QrCode, 
  RefreshCw, 
  CheckCircle, 
  Wifi, 
  Database,
  Plus,
  Trash2,
  Lock,
  Sparkles,
  Link2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Instance {
  id: string;
  name: string;
  phoneNumber: string;
  connectionType: 'OFFICIAL' | 'UNOFFICIAL';
  waBusinessId?: string;
  accessToken?: string;
  unofficialUrl?: string;
  unofficialToken?: string;
  qrCode?: string;
  isActive: boolean;
}

export default function SettingsPage() {
  const { tenant } = useAuth();
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'general'>('whatsapp');
  const [instances, setInstances] = useState<Instance[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [connectionType, setConnectionType] = useState<'OFFICIAL' | 'UNOFFICIAL'>('OFFICIAL');
  
  // Official specific
  const [waBusinessId, setWaBusinessId] = useState('');
  const [accessToken, setAccessToken] = useState('');

  // Unofficial specific
  const [unofficialUrl, setUnofficialUrl] = useState('https://evolution.pulseerp.com');
  const [unofficialToken, setUnofficialToken] = useState('');
  const [generatingQr, setGeneratingQr] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);

  useEffect(() => {
    if (tenant?.id) {
      fetchInstances();
      fetchAuditLogs();
    }
  }, [tenant?.id]);

  const fetchInstances = async () => {
    if (!tenant?.id) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await axios.get(`${apiUrl}/whatsapp/instances`, {
        headers: { 'x-tenant-id': tenant.id }
      });
      setInstances(res.data);
    } catch (err) {
      toast.error('Erro ao carregar instâncias de WhatsApp');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    if (!tenant?.id) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await axios.get(`${apiUrl}/audit-logs`, {
        headers: { 'x-tenant-id': tenant.id }
      });
      setAuditLogs(res.data);
    } catch (err) {
      console.error('Erro ao carregar logs de auditoria:', err);
    }
  };

  const handleCreateInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant?.id) return;
    
    if (!name.trim() || !phoneNumber.trim()) {
      toast.error('Preencha os dados principais da conexão');
      return;
    }

    if (connectionType === 'OFFICIAL' && (!waBusinessId.trim() || !accessToken.trim())) {
      toast.error('Preencha as credenciais da Meta Cloud API');
      return;
    }

    if (connectionType === 'UNOFFICIAL' && !unofficialToken.trim()) {
      toast.error('Preencha a chave de autenticação (API Key) da Evolution API');
      return;
    }

    setGeneratingQr(true);
    const toastId = toast.loading('Gerando credenciais da instância...');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const payload = {
        name,
        phoneNumber,
        connectionType,
        waBusinessId: connectionType === 'OFFICIAL' ? waBusinessId : undefined,
        accessToken: connectionType === 'OFFICIAL' ? accessToken : undefined,
        unofficialUrl: connectionType === 'UNOFFICIAL' ? unofficialUrl : undefined,
        unofficialToken: connectionType === 'UNOFFICIAL' ? unofficialToken : undefined,
      };

      const res = await axios.post(`${apiUrl}/whatsapp/instances`, payload, {
        headers: { 'x-tenant-id': tenant.id }
      });

      toast.dismiss(toastId);
      
      setInstances([...instances, res.data]);
      setQrCodeData(connectionType === 'UNOFFICIAL' ? 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=PulseERPHybridEvolutionQRCodeScanSuccess' : null);
      
      toast.success(connectionType === 'OFFICIAL' ? 'Conexão criada com sucesso!' : 'Instância criada! Escaneie o QR Code abaixo.');
      
      // Reset form fields
      setName('');
      setPhoneNumber('');
      setWaBusinessId('');
      setAccessToken('');

      // Refresh Audit Logs
      fetchAuditLogs();
    } catch (err: any) {
      toast.dismiss(toastId);
      const errorMessage = err.response?.data?.message || 'Erro ao criar canal do WhatsApp';
      toast.error(errorMessage);
    } finally {
      setGeneratingQr(false);
    }
  };

  const handleDeleteInstance = async (id: string) => {
    if (!tenant?.id) return;
    if (!confirm('Deseja desconectar este número?')) return;

    const toastId = toast.loading('Desconectando WhatsApp...');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      await axios.delete(`${apiUrl}/whatsapp/instances/${id}`, {
        headers: { 'x-tenant-id': tenant.id }
      });
      toast.dismiss(toastId);
      setInstances(instances.filter(item => item.id !== id));
      toast.success('WhatsApp desconectado com sucesso');
      fetchAuditLogs();
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error('Erro ao desconectar WhatsApp');
    }
  };

  const handleSimulateScan = () => {
    if (!qrCodeData) return;
    toast.loading('Processando leitura do QR Code...');
    setTimeout(() => {
      toast.dismiss();
      setScanned(true);
      setQrCodeData(null);
      toast.success('WhatsApp Não-Oficial conectado com sucesso!');
      fetchAuditLogs();
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <PageHeader 
        title="Configurações & Integrações"
        description="Gerencie os canais de atendimento da sua empresa e conecte novos números oficiais ou híbridos."
      />

      {/* Tabs Layout */}
      <div className="flex gap-2 border-b border-zinc-200 pb-px">
        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 relative -bottom-[2px] flex items-center gap-2 ${
            activeTab === 'whatsapp' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-zinc-400 hover:text-zinc-700'
          }`}
        >
          <Smartphone className="size-4" /> Conexão WhatsApp
        </button>
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 relative -bottom-[2px] flex items-center gap-2 ${
            activeTab === 'general' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-zinc-400 hover:text-zinc-700'
          }`}
        >
          <Settings2 className="size-4" /> Configurações do Workspace
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'whatsapp' ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Form Cadastro */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-base font-bold text-zinc-800 mb-1 flex items-center gap-1.5">
                    <Plus className="size-5 text-blue-600" /> Nova Conexão Híbrida
                  </h3>
                  <p className="text-xs text-zinc-400 mb-6">Escolha o modo ideal para a maturidade de sua empresa.</p>

                  <form onSubmit={handleCreateInstance} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Nome do Canal</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-white border border-zinc-200 rounded-xl px-4 h-11 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          placeholder="Ex: Comercial SP"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Número de Telefone</label>
                        <input
                          type="text"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full bg-white border border-zinc-200 rounded-xl px-4 h-11 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          placeholder="Ex: 5511999998888"
                        />
                      </div>
                    </div>

                    {/* Selector de Conexão Híbrida */}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Provedor e Modalidade</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setConnectionType('OFFICIAL')}
                          className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between h-28 ${
                            connectionType === 'OFFICIAL'
                              ? 'border-blue-600 bg-blue-50/20 shadow-sm ring-1 ring-blue-600'
                              : 'border-zinc-200 bg-white hover:border-zinc-300'
                          }`}
                        >
                          <div className="flex justify-between items-start w-full">
                            <span className="text-xs font-bold text-zinc-800">Meta Cloud API (Oficial)</span>
                            <Shield className={`size-4 ${connectionType === 'OFFICIAL' ? 'text-blue-600' : 'text-zinc-400'}`} />
                          </div>
                          <span className="text-[10px] text-zinc-400 leading-relaxed">Nativo da Meta. Taxa zero de bloqueios, faturamento oficial estável e alta performance de escala.</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setConnectionType('UNOFFICIAL')}
                          className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between h-28 ${
                            connectionType === 'UNOFFICIAL'
                              ? 'border-blue-600 bg-blue-50/20 shadow-sm ring-1 ring-blue-600'
                              : 'border-zinc-200 bg-white hover:border-zinc-300'
                          }`}
                        >
                          <div className="flex justify-between items-start w-full">
                            <span className="text-xs font-bold text-zinc-800">Evolution/Baileys (Não-Oficial)</span>
                            <QrCode className={`size-4 ${connectionType === 'UNOFFICIAL' ? 'text-blue-600' : 'text-zinc-400'}`} />
                          </div>
                          <span className="text-[10px] text-zinc-400 leading-relaxed">Conexão rápida por QR-Code. Sem burocracia, ideal para pequenas operações com setup imediato.</span>
                        </button>
                      </div>
                    </div>

                    {/* Campos Oficiais */}
                    {connectionType === 'OFFICIAL' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4 border-t border-zinc-100 pt-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">ID da Conta Comercial (WABA ID)</label>
                            <input
                              type="text"
                              value={waBusinessId}
                              onChange={(e) => setWaBusinessId(e.target.value)}
                              className="w-full bg-white border border-zinc-200 rounded-xl px-4 h-11 text-xs text-zinc-800 focus:outline-none"
                              placeholder="Inserir ID numérico"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Token de Acesso Permanente</label>
                            <input
                              type="text"
                              value={accessToken}
                              onChange={(e) => setAccessToken(e.target.value)}
                              className="w-full bg-white border border-zinc-200 rounded-xl px-4 h-11 text-xs text-zinc-800 focus:outline-none"
                              placeholder="Inserir Token da Meta"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Campos Não-Oficiais (QR Code Evolution) */}
                    {connectionType === 'UNOFFICIAL' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4 border-t border-zinc-100 pt-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Servidor Evolution API URL</label>
                            <input
                              type="text"
                              value={unofficialUrl}
                              onChange={(e) => setUnofficialUrl(e.target.value)}
                              className="w-full bg-white border border-zinc-200 rounded-xl px-4 h-11 text-xs text-zinc-800 focus:outline-none"
                              placeholder="https://api-evolution.seuhost.com"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Chave Global da API (API Key)</label>
                            <input
                              type="password"
                              value={unofficialToken}
                              onChange={(e) => setUnofficialToken(e.target.value)}
                              className="w-full bg-white border border-zinc-200 rounded-xl px-4 h-11 text-xs text-zinc-800 focus:outline-none"
                              placeholder="API Key do seu servidor"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={generatingQr}
                        className="px-5 h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl text-xs transition-colors shadow-sm flex items-center gap-1.5"
                      >
                        {generatingQr ? 'Conectando...' : connectionType === 'OFFICIAL' ? 'Salvar Conexão' : 'Gerar QR Code'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Exibição QR Code Gerado */}
                {qrCodeData && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-8"
                  >
                    {/* QR Code Container com Leitor animado */}
                    <div className="relative border-4 border-zinc-950 p-4 rounded-2xl bg-white shadow-lg overflow-hidden shrink-0 group">
                      {/* Linha animada de Scanner */}
                      <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500 animate-bounce blur-xs" />
                      <img
                        src={qrCodeData}
                        alt="Escanear WhatsApp"
                        className="size-48"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Aguardando Leitura</span>
                      </div>
                      <h4 className="text-base font-bold text-zinc-800">Conecte o seu WhatsApp Não-Oficial</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
                        Abra o seu celular, vá em <strong>Aparelhos Conectados &gt; Conectar Aparelho</strong> e aponte a câmera para o código ao lado.
                      </p>
                      <button
                        onClick={handleSimulateScan}
                        className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-100 text-[10px] rounded-xl transition-all uppercase tracking-wider flex items-center gap-1.5"
                      >
                        <Wifi className="size-3.5" /> Simular Scan com Celular
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Lista de Canais Conectados */}
                <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-zinc-800">Canais Ativos</h3>
                    <span className="px-2.5 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-bold rounded-full">
                      {instances.length} conectado(s)
                    </span>
                  </div>

                  <div className="divide-y divide-zinc-100">
                    {instances.map(inst => (
                      <div key={inst.id} className="p-6 flex items-center justify-between hover:bg-zinc-50/20 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="size-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                            <Smartphone className="size-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-zinc-800">{inst.name}</span>
                              <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full border ${
                                inst.connectionType === 'OFFICIAL' 
                                  ? 'bg-blue-50 text-blue-600 border-blue-100' 
                                  : 'bg-orange-50 text-orange-600 border-orange-100'
                              }`}>
                                {inst.connectionType === 'OFFICIAL' ? 'OFICIAL' : 'NÃO-OFICIAL (QR)'}
                              </span>
                            </div>
                            <div className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1.5">
                              <span>+{inst.phoneNumber}</span>
                              {inst.waBusinessId && (
                                <>
                                  <span className="text-zinc-300">•</span>
                                  <span>WABA ID: {inst.waBusinessId}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 py-1 px-3 rounded-full">
                            <span className="size-1.5 rounded-full bg-emerald-500" /> Conectado
                          </div>
                          <button
                            onClick={() => handleDeleteInstance(inst.id)}
                            className="p-2 bg-white hover:bg-red-50 text-red-600 rounded-xl transition-all border border-zinc-200 hover:border-red-100 shadow-sm"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-6"
              >
                <div>
                  <h3 className="text-base font-bold text-zinc-800 mb-1">Dados Corporativos</h3>
                  <p className="text-xs text-zinc-400">Configure as preferências gerais da sua organização.</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Nome da Empresa</label>
                      <input
                        type="text"
                        defaultValue="PulseERP Matriz"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 h-11 text-xs text-zinc-700 cursor-not-allowed focus:outline-none"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Identificador do Workspace (Slug)</label>
                      <input
                        type="text"
                        defaultValue="pulseerp-matriz"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 h-11 text-xs text-zinc-700 cursor-not-allowed focus:outline-none"
                        disabled
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50/30 border border-blue-100/50 rounded-xl flex gap-3">
                    <Sparkles className="size-5 text-blue-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-zinc-800">Plano PRO Ativo</h4>
                      <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                        Sua organização possui suporte omnichannel multi-tenant ativado com limite estendido de conexões não-oficiais.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Audit Logs Section */}
                <div className="border-t border-zinc-100 pt-6 mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-800">Logs de Auditoria de Segurança</h4>
                      <p className="text-[10px] text-zinc-400">Linha do tempo em tempo real de ações críticas executadas.</p>
                    </div>
                    <button 
                      onClick={fetchAuditLogs}
                      className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-600 border border-zinc-200 transition-all shadow-xs"
                      title="Atualizar Logs"
                    >
                      <RefreshCw className="size-3.5 animate-spin-hover" />
                    </button>
                  </div>

                  {auditLogs.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50 text-zinc-400 text-xs">
                      Nenhum registro de auditoria encontrado para este workspace.
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="flex gap-3 text-xs border-b border-zinc-50 pb-3 last:border-b-0">
                          <div className="shrink-0 mt-0.5">
                            {log.action.includes('login') ? (
                              <span className="size-6 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold text-[9px]">LG</span>
                            ) : log.action.includes('deal') ? (
                              <span className="size-6 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-[9px]">DL</span>
                            ) : (
                              <span className="size-6 rounded-full bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center font-bold text-[9px]">SYS</span>
                            )}
                          </div>
                          <div className="space-y-1 flex-1">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-zinc-800 uppercase tracking-wide text-[9px]">
                                {log.action}
                              </span>
                              <span className="text-[9px] text-zinc-400">
                                {new Date(log.createdAt).toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <p className="text-zinc-500 text-[10px] leading-relaxed">{log.details}</p>
                            {(log.ip || log.userAgent) && (
                              <div className="flex items-center gap-2 text-[8px] text-zinc-400 bg-zinc-50 border border-zinc-100/50 py-0.5 px-2 rounded-md w-fit">
                                {log.ip && <span>IP: {log.ip}</span>}
                                {log.ip && log.userAgent && <span>•</span>}
                                {log.userAgent && <span className="truncate max-w-[150px]">{log.userAgent}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Sidebar Info Card */}
        <div className="space-y-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-white shadow-lg space-y-4 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute right-[-20%] bottom-[-20%] size-44 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest">
              <Lock className="size-3.5" /> Segurança Omnichannel
            </div>
            
            <h4 className="text-sm font-bold">Por que o PulseERP é Híbrido?</h4>
            
            <div className="space-y-3.5 pt-2">
              <div className="flex gap-2">
                <span className="size-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  <strong>Economia Garantida:</strong> Reduza custos abusivos de mensagens transacionais usando o módulo Não-Oficial para lembretes e pós-vendas rápidos.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="size-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  <strong>Zero Burocracia:</strong> Conecte no modo não-oficial via QR Code imediatamente sem precisar de autorização da Meta para começar.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="size-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  <strong>Alta Performance:</strong> Combine os dois mundos e garanta redundância total para a operação de suporte.
                </p>
              </div>
            </div>

            <div className="border-t border-zinc-800/80 pt-4 flex justify-between items-center text-[10px] text-zinc-500">
              <span>Provedores: Meta & Evolution</span>
              <Link2 className="size-3.5 text-zinc-600" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
