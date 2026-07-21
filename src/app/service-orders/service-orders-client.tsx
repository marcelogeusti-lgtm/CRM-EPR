'use client';

import React, { useMemo, useState } from 'react';
import { Wrench, Users, Plus, X, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { createServiceOrder, updateServiceOrderStatus, updateServiceOrder, getServiceOrderHistory } from '@/actions/serviceOrders';
import { createEmployee, toggleEmployeeActive } from '@/actions/employees';

interface Contact {
  id: string;
  name: string;
  phone: string | null;
}

interface Employee {
  id: string;
  name: string;
  phone: string | null;
  specialty: string | null;
  isActive: boolean;
}

interface ServiceOrder {
  id: string;
  number: number;
  title: string;
  description: string | null;
  status: string;
  value: number;
  paymentStatus: string;
  paymentMethod: string | null;
  scheduledAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  contact: { id: string; name: string; phone: string | null } | null;
  employee: { id: string; name: string } | null;
}

const STATUS_COLUMNS = [
  { id: 'ABERTA', label: 'Aberta' },
  { id: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { id: 'CONCLUIDA', label: 'Concluída' },
  { id: 'CANCELADA', label: 'Cancelada' },
];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

type Tab = 'ordens' | 'tecnicos';

export function ServiceOrdersClient({
  initialOrders,
  initialEmployees,
  contacts,
  currentUserRole,
}: {
  initialOrders: ServiceOrder[];
  initialEmployees: Employee[];
  contacts: Contact[];
  currentUserRole: string;
}) {
  const [tab, setTab] = useState<Tab>('ordens');
  const [orders, setOrders] = useState(initialOrders);
  const [employees, setEmployees] = useState(initialEmployees);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reopenTarget, setReopenTarget] = useState<{ orderId: string; newStatus: string } | null>(null);
  const [historyByOrder, setHistoryByOrder] = useState<Record<string, Awaited<ReturnType<typeof getServiceOrderHistory>> | undefined>>({});
  const [openHistoryId, setOpenHistoryId] = useState<string | null>(null);

  const columns = useMemo(
    () => STATUS_COLUMNS.map(col => ({ ...col, orders: orders.filter(o => o.status === col.id) })),
    [orders]
  );

  async function handleStatusChange(id: string, status: string) {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    const previousStatus = order.status;
    const isReopeningFromConcluida = previousStatus === 'CONCLUIDA' && status !== 'CONCLUIDA';

    if (isReopeningFromConcluida) {
      if (currentUserRole !== 'ADMIN') {
        alert('Só administradores podem reabrir uma Ordem de Serviço concluída.');
        return;
      }
      setReopenTarget({ orderId: id, newStatus: status });
      return;
    }

    setOrders(prev => prev.map(o => (o.id === id ? { ...o, status } : o)));
    const result = await updateServiceOrderStatus(id, status);
    if (!result.success) {
      setOrders(prev => prev.map(o => (o.id === id ? { ...o, status: previousStatus } : o)));
      alert(result.error || 'Falha ao mudar o status.');
      return;
    }
    invalidateHistory(id);
  }

  async function confirmReopen(reason: string) {
    if (!reopenTarget) return;
    const { orderId, newStatus } = reopenTarget;
    const order = orders.find(o => o.id === orderId);
    const previousStatus = order?.status;
    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o)));
    setReopenTarget(null);
    const result = await updateServiceOrderStatus(orderId, newStatus, reason);
    if (!result.success) {
      if (previousStatus !== undefined) {
        setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: previousStatus } : o)));
      }
      alert(result.error || 'Falha ao reabrir a Ordem de Serviço.');
      return;
    }
    invalidateHistory(orderId);
  }

  function invalidateHistory(orderId: string) {
    setHistoryByOrder(prev => {
      const next = { ...prev };
      delete next[orderId];
      return next;
    });
  }

  async function toggleHistory(orderId: string) {
    if (openHistoryId === orderId) {
      setOpenHistoryId(null);
      return;
    }
    setOpenHistoryId(orderId);
    if (!historyByOrder[orderId]) {
      const history = await getServiceOrderHistory(orderId);
      setHistoryByOrder(prev => ({ ...prev, [orderId]: history }));
    }
  }

  async function handleEmployeeAssign(id: string, employeeId: string) {
    const order = orders.find(o => o.id === id);
    const previousEmployee = order?.employee ?? null;
    const employee = employees.find(e => e.id === employeeId) || null;
    setOrders(prev =>
      prev.map(o => (o.id === id ? { ...o, employee: employee ? { id: employee.id, name: employee.name } : null } : o))
    );
    const result = await updateServiceOrder(id, { employeeId: employeeId || null });
    if (!result.success) {
      setOrders(prev => prev.map(o => (o.id === id ? { ...o, employee: previousEmployee } : o)));
      alert(result.error || 'Falha ao atribuir técnico.');
      return;
    }
    invalidateHistory(id);
  }

  async function handlePaymentStatusChange(id: string, paymentStatus: string) {
    const order = orders.find(o => o.id === id);
    const previousPaymentStatus = order?.paymentStatus;
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, paymentStatus } : o)));
    const result = await updateServiceOrder(id, { paymentStatus });
    if (!result.success) {
      if (previousPaymentStatus !== undefined) {
        setOrders(prev => prev.map(o => (o.id === id ? { ...o, paymentStatus: previousPaymentStatus } : o)));
      }
      alert(result.error || 'Falha ao atualizar status de pagamento.');
      return;
    }
    invalidateHistory(id);
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white">
      <div className="px-4 md:px-8 py-4 md:py-6 border-b border-[#222]">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Ordens de Serviço</h1>
          {tab === 'ordens' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="self-start sm:self-auto bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="size-4" /> Nova Ordem de Serviço
            </button>
          )}
        </div>
        <div className="flex gap-6">
          <button
            onClick={() => setTab('ordens')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              tab === 'ordens' ? 'text-blue-400 border-blue-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
          >
            <Wrench className="size-4" /> Ordens
          </button>
          <button
            onClick={() => setTab('tecnicos')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              tab === 'tecnicos' ? 'text-blue-400 border-blue-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
          >
            <Users className="size-4" /> Técnicos
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-8">
        {tab === 'ordens' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {columns.map(col => (
              <div key={col.id} className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{col.label}</h3>
                  <span className="text-xs text-zinc-600">{col.orders.length}</span>
                </div>
                <div className="flex flex-col gap-3">
                  {col.orders.map(order => (
                    <div key={order.id} className="bg-[#141414] border border-[#262626] rounded-xl p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-zinc-500">OS #{order.number}</span>
                        <span className="text-sm font-bold text-emerald-400">{formatCurrency(order.value)}</span>
                      </div>
                      <h4 className="font-semibold text-zinc-200 text-sm mb-1">{order.title}</h4>
                      {order.contact && (
                        <p className="text-xs text-zinc-500 mb-3 flex items-center gap-1">
                          <Phone className="size-3" /> {order.contact.name}
                        </p>
                      )}

                      <div className="space-y-2 pt-3 border-t border-[#262626]">
                        <select
                          value={order.status}
                          onChange={e => handleStatusChange(order.id, e.target.value)}
                          className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500/50"
                        >
                          {STATUS_COLUMNS.map(s => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                        </select>

                        <select
                          value={order.employee?.id || ''}
                          onChange={e => handleEmployeeAssign(order.id, e.target.value)}
                          className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500/50"
                        >
                          <option value="">Sem técnico atribuído</option>
                          {employees.filter(e => e.isActive).map(e => (
                            <option key={e.id} value={e.id}>{e.name}</option>
                          ))}
                        </select>

                        <select
                          value={order.paymentStatus}
                          onChange={e => handlePaymentStatusChange(order.id, e.target.value)}
                          className={`w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none ${
                            order.paymentStatus === 'PAGO'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : order.paymentStatus === 'PARCIAL'
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                : 'bg-zinc-800/50 border-[#262626] text-zinc-400'
                          }`}
                        >
                          <option value="PENDENTE">Pagamento Pendente</option>
                          <option value="PARCIAL">Pagamento Parcial</option>
                          <option value="PAGO">Pago</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => toggleHistory(order.id)}
                          className="text-[11px] text-zinc-500 hover:text-zinc-300 font-medium"
                        >
                          {openHistoryId === order.id ? 'Ocultar histórico' : 'Ver histórico'}
                        </button>

                        {openHistoryId === order.id && (
                          <div className="space-y-1 pt-1 border-t border-[#262626]">
                            {historyByOrder[order.id] === undefined ? (
                              <p className="text-[11px] text-zinc-600">Carregando...</p>
                            ) : historyByOrder[order.id]!.length === 0 ? (
                              <p className="text-[11px] text-zinc-600">Nenhuma mudança registrada ainda.</p>
                            ) : (
                              historyByOrder[order.id]!.map(h => (
                                <p key={h.id} className="text-[11px] text-zinc-500">
                                  <span className="text-zinc-600">[{format(new Date(h.createdAt), 'dd/MM HH:mm')}]</span>{' '}
                                  <span className="text-zinc-300">{h.user.name}</span>
                                  {h.field === 'STATUS'
                                    ? ` mudou de "${h.fromValue}" para "${h.toValue}"`
                                    : h.field === 'PAYMENT'
                                      ? ` mudou pagamento de "${h.fromValue}" para "${h.toValue}"`
                                      : ` trocou o responsável de "${h.fromValue || 'ninguém'}" para "${h.toValue || 'ninguém'}"`}
                                  {h.reason && ` — motivo: ${h.reason}`}
                                </p>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {col.orders.length === 0 && (
                    <div className="text-xs text-zinc-600 text-center py-6 border border-dashed border-[#262626] rounded-xl">
                      Nenhuma OS aqui
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmployeesTab
            employees={employees}
            onCreated={employee => setEmployees(prev => [...prev, employee].sort((a, b) => a.name.localeCompare(b.name)))}
            onToggle={(id, active) => setEmployees(prev => prev.map(e => (e.id === id ? { ...e, isActive: active } : e)))}
          />
        )}
      </div>

      {isModalOpen && (
        <NewServiceOrderModal
          contacts={contacts}
          employees={employees.filter(e => e.isActive)}
          onClose={() => setIsModalOpen(false)}
          onCreated={order => {
            setOrders(prev => [order, ...prev]);
            setIsModalOpen(false);
          }}
        />
      )}

      {reopenTarget && (
        <ReopenReasonModal
          onConfirm={confirmReopen}
          onClose={() => setReopenTarget(null)}
        />
      )}
    </div>
  );
}

function NewServiceOrderModal({
  contacts,
  employees,
  onClose,
  onCreated,
}: {
  contacts: Contact[];
  employees: Employee[];
  onClose: () => void;
  onCreated: (order: ServiceOrder) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [contactId, setContactId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    const result = await createServiceOrder({
      title,
      description,
      value: parseFloat(value) || 0,
      contactId: contactId || undefined,
      employeeId: employeeId || undefined,
      scheduledAt: scheduledAt || undefined,
    });

    setIsSaving(false);

    if (!result.success || !result.data) {
      setError(result.error || 'Não foi possível criar a Ordem de Serviço.');
      return;
    }

    const selectedContact = contacts.find(c => c.id === contactId) || null;
    const selectedEmployee = employees.find(e => e.id === employeeId) || null;

    onCreated({
      ...result.data,
      contact: selectedContact,
      employee: selectedEmployee ? { id: selectedEmployee.id, name: selectedEmployee.name } : null,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#141414] border border-[#262626] rounded-xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors">
          <X className="size-5" />
        </button>
        <h2 className="text-lg font-bold text-zinc-100 mb-6">Nova Ordem de Serviço</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-400 mb-2 block">Título *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500/50"
              placeholder="Ex: Troca de vidro temperado — Janela sala"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-400 mb-2 block">Descrição</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full h-20 bg-[#0a0a0a] border border-[#262626] rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500/50 resize-none"
              placeholder="Medidas, especificações, observações..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-400 mb-2 block">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                value={value}
                onChange={e => setValue(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500/50"
                placeholder="0,00"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-400 mb-2 block">Data agendada</label>
              <input
                type="date"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-400 mb-2 block">Cliente</label>
            <select
              value={contactId}
              onChange={e => setContactId(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500/50"
            >
              <option value="">Sem cliente vinculado</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-400 mb-2 block">Técnico responsável</label>
            <select
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500/50"
            >
              <option value="">A definir</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name}{e.specialty ? ` — ${e.specialty}` : ''}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Criando...' : 'Criar Ordem de Serviço'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReopenReasonModal({ onConfirm, onClose }: { onConfirm: (reason: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-zinc-100 mb-2">Reabrir Ordem de Serviço</h3>
        <p className="text-xs text-zinc-500 mb-4">
          Essa OS já está marcada como Concluída. Informe o motivo da reabertura — isso fica registrado no histórico.
        </p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Ex.: cliente pediu ajuste no valor"
          className="w-full h-20 bg-[#0a0a0a] border border-[#262626] rounded-lg p-2 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50 resize-none mb-4"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200">
            Cancelar
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            className="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium"
          >
            Confirmar reabertura
          </button>
        </div>
      </div>
    </div>
  );
}

function EmployeesTab({
  employees,
  onCreated,
  onToggle,
}: {
  employees: Employee[];
  onCreated: (employee: Employee) => void;
  onToggle: (id: string, active: boolean) => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    const result = await createEmployee({ name, phone, specialty });
    setIsSaving(false);

    if (!result.success || !result.data) {
      setError(result.error || 'Não foi possível cadastrar o técnico.');
      return;
    }

    onCreated(result.data);
    setName('');
    setPhone('');
    setSpecialty('');
  }

  async function handleToggle(id: string, current: boolean) {
    onToggle(id, !current);
    await toggleEmployeeActive(id, !current);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <form onSubmit={handleSubmit} className="bg-[#141414] border border-[#262626] rounded-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="text-xs font-bold text-zinc-400 mb-2 block">Nome *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-zinc-400 mb-2 block">Telefone</label>
          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs font-bold text-zinc-400 mb-2 block">Especialidade</label>
            <input
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
              placeholder="Ex: Instalador"
              className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shrink-0"
          >
            {isSaving ? '...' : '+ Adicionar'}
          </button>
        </div>
        {error && <p className="text-sm text-red-400 md:col-span-3">{error}</p>}
      </form>

      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#1a1a1a] text-zinc-400 font-medium border-b border-[#222]">
            <tr>
              <th className="px-6 py-4">Nome</th>
              <th className="px-6 py-4">Telefone</th>
              <th className="px-6 py-4">Especialidade</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222]">
            {employees.map(employee => (
              <tr key={employee.id} className="hover:bg-[#161616] transition-colors">
                <td className="px-6 py-4 font-medium text-zinc-200">{employee.name}</td>
                <td className="px-6 py-4 text-zinc-400">{employee.phone || '-'}</td>
                <td className="px-6 py-4 text-zinc-400">{employee.specialty || '-'}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggle(employee.id, employee.isActive)}
                    className={`text-xs font-bold px-2 py-1 rounded-md border transition-colors ${
                      employee.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-zinc-800/50 text-zinc-500 border-[#262626]'
                    }`}
                  >
                    {employee.isActive ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                  Nenhum técnico cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
