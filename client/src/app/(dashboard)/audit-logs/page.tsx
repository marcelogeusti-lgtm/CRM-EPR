'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Activity, ShieldAlert, LogIn, Database, User as UserIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // mock for now
    setLogs([
      { id: '1', action: 'CREATE', entity: 'Deal', entityId: 'abc', user: { name: 'João Silva', email: 'joao@2formes.com' }, createdAt: new Date() },
      { id: '2', action: 'UPDATE', entity: 'WorkOrder', entityId: 'xyz', user: { name: 'Maria Souza', email: 'maria@2formes.com' }, createdAt: new Date(Date.now() - 3600000) },
      { id: '3', action: 'LOGIN', entity: 'Auth', entityId: null, user: { name: 'João Silva', email: 'joao@2formes.com' }, createdAt: new Date(Date.now() - 7200000) },
      { id: '4', action: 'DELETE', entity: 'Contact', entityId: '123', user: { name: 'Admin', email: 'admin@2formes.com' }, createdAt: new Date(Date.now() - 86400000) },
    ]);
    setIsLoading(false);
  }, []);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <Database className="w-4 h-4 text-green-400" />;
      case 'UPDATE': return <Activity className="w-4 h-4 text-blue-400" />;
      case 'DELETE': return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'LOGIN': return <LogIn className="w-4 h-4 text-yellow-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Auditoria de Acesso</h1>
          <p className="text-gray-400 mt-1">Acompanhe todas as ações realizadas pelos funcionários no sistema.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <Input placeholder="Buscar logs..." className="pl-9 h-10 w-64 bg-white/5 border-white/10 text-white" />
        </div>
      </div>

      <Card className="bg-[#111] border-white/5 shadow-2xl p-6">
        <div className="space-y-4">
          {logs.map((log: any) => (
            <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl bg-[#1a1a1a] border border-white/5 hover:border-white/10 transition-colors">
              <div className="mt-1 bg-white/5 p-2 rounded-lg border border-white/5">
                {getActionIcon(log.action)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <p className="text-sm text-gray-300">
                    <span className="font-semibold text-white">{log.user.name}</span> realizou uma ação de <Badge variant="outline" className="bg-white/5 border-white/10 text-xs py-0 mx-1">{log.action}</Badge>
                    em <span className="text-blue-400 font-mono text-xs">{log.entity}</span>
                  </p>
                  <span className="text-xs text-gray-500">{format(new Date(log.createdAt), "dd/MM HH:mm")}</span>
                </div>
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                  <UserIcon className="w-3 h-3" /> {log.user.email}
                  {log.entityId && (
                    <>
                      <span>•</span>
                      <span className="font-mono">ID: {log.entityId}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
