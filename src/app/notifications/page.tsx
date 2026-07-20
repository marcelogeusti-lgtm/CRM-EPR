'use client';

import React, { useEffect, useState } from 'react';
import { Bell, UserPlus, MessageCircle, AlarmClock, Loader2 } from 'lucide-react';
import { getNotifications, type NotificationItem } from '@/actions/notifications';
import { withRetry } from '@/lib/withRetry';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

const ICONS = {
  NEW_LEAD: { icon: UserPlus, color: 'text-blue-400 bg-blue-500/10' },
  NEW_MESSAGE: { icon: MessageCircle, color: 'text-emerald-400 bg-emerald-500/10' },
  TASK_DUE: { icon: AlarmClock, color: 'text-amber-400 bg-amber-500/10' },
} as const;

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    withRetry(() => getNotifications())
      .then(data => setItems(data))
      .catch(err => {
        console.error(err);
        setError('Não foi possível carregar as notificações. Tente recarregar a página.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="h-full bg-[#0a0a0a] text-white overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Bell className="size-7 text-indigo-400" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notificações</h1>
            <p className="text-zinc-500 text-sm">Leads novos, mensagens recebidas e tarefas vencendo nos últimos 14 dias.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-zinc-600" />
          </div>
        ) : error ? null : items.length === 0 ? (
          <p className="text-sm text-zinc-600 text-center py-12">Nenhuma novidade por aqui.</p>
        ) : (
          <div className="space-y-2">
            {items.map(item => {
              const { icon: Icon, color } = ICONS[item.type];
              const content = (
                <div className="flex items-start gap-3 bg-[#141414] border border-[#262626] rounded-lg p-4 hover:border-[#333] transition-colors">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-200">{item.title}</p>
                    <p className="text-sm text-zinc-500 truncate">{item.description}</p>
                  </div>
                  <span className="text-[11px] text-zinc-600 shrink-0">
                    {formatDistanceToNow(new Date(item.date), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              );
              return item.dealId ? (
                <Link key={item.id} href="/inbox" prefetch={false}>{content}</Link>
              ) : (
                <div key={item.id}>{content}</div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
