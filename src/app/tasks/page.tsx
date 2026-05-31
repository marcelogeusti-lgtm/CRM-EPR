import React from 'react';
import { getPendingTasks } from '@/actions/tasks';
import { Calendar, CheckSquare, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default async function TasksPage() {
  const tasks = await getPendingTasks();

  return (
    <div className="p-8 h-full bg-[#0a0a0a] overflow-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Calendar className="size-6 text-rose-500" />
          Gestão de Tarefas
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Sua agenda de acompanhamentos e compromissos com leads.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna 1: Atrasadas */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="size-5 text-red-500" />
            <h2 className="font-bold text-zinc-200">Atrasadas</h2>
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">0</span>
          </div>
          <div className="p-8 border border-dashed border-[#262626] rounded-xl flex items-center justify-center text-zinc-600 text-sm">
            Nenhuma tarefa atrasada!
          </div>
        </div>

        {/* Coluna 2: Hoje */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="size-5 text-amber-500" />
            <h2 className="font-bold text-zinc-200">Para Hoje</h2>
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">{tasks.length}</span>
          </div>
          
          {tasks.length === 0 ? (
            <div className="p-8 border border-dashed border-[#262626] rounded-xl flex items-center justify-center text-zinc-600 text-sm">
              Sua agenda está livre hoje.
            </div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="bg-[#141414] border border-[#262626] p-4 rounded-xl shadow-sm hover:border-rose-500/50 transition-colors cursor-pointer relative group">
                <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="w-6 h-6 rounded border border-zinc-600 flex items-center justify-center hover:bg-emerald-500/20 hover:border-emerald-500 hover:text-emerald-400 text-zinc-500 transition-colors">
                    <CheckSquare className="size-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Tarefa</span>
                  <span className="text-[10px] text-zinc-500">{format(new Date(task.createdAt), "dd 'de' MMM, HH:mm", { locale: ptBR })}</span>
                </div>
                <p className="text-sm text-zinc-200 mb-3 font-medium pr-8">{task.content}</p>
                <div className="flex items-center gap-2 pt-3 border-t border-[#262626]">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">
                    {(task as any).deal?.contact?.name?.charAt(0) || 'C'}
                  </div>
                  <span className="text-xs text-zinc-400 truncate max-w-[200px]">
                    Ligado a: <strong className="text-zinc-300">{(task as any).deal?.contact?.name}</strong>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Coluna 3: Futuras */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="size-5 text-blue-500" />
            <h2 className="font-bold text-zinc-200">Futuras</h2>
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">0</span>
          </div>
          <div className="p-8 border border-dashed border-[#262626] rounded-xl flex items-center justify-center text-zinc-600 text-sm">
            Nenhuma tarefa agendada.
          </div>
        </div>

      </div>
    </div>
  );
}
