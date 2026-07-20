'use client';

import React, { useState } from 'react';
import { 
  Columns, List as ListIcon, Search, MoreHorizontal, RefreshCw, Plus,
  ChevronLeft, ChevronRight, Settings, Clock, Download, X
} from 'lucide-react';
import { createTask } from '../actions/calendar';

type Task = {
  id: string;
  title: string;
  type: string;
  dueDate: Date;
  deal?: { title: string } | null;
};

export default function CalendarClient({ initialTasks }: { initialTasks: Task[] }) {
  const [viewTimeframe, setViewTimeframe] = useState<'dia' | 'semana' | 'mes'>('semana');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fake current week (Monday 25 to Friday 29, May 2026)
  const daysOfWeek = [
    { name: 'Seg', date: '25 Mai. 2026', dayIndex: 1 },
    { name: 'Ter', date: '26', dayIndex: 2 },
    { name: 'Qua', date: '27', dayIndex: 3 },
    { name: 'Qui', date: '28', dayIndex: 4 },
    { name: 'Sex', date: '29', dayIndex: 5 }
  ];

  const hours = Array.from({ length: 24 }, (_, i) => i);

  async function handleCreateTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    await createTask(formData);
    setIsSubmitting(false);
    setIsNewEventModalOpen(false);
  }

  // Get tasks for a specific day and hour
  const getTasksForSlot = (dayIndex: number, hour: number) => {
    return initialTasks.filter(task => {
      const date = new Date(task.dueDate);
      return date.getDay() === dayIndex && date.getHours() === hour;
    });
  };

  const getTaskColor = (type: string) => {
    switch (type) {
      case 'MEETING': return 'bg-purple-500 border-purple-400 text-purple-100';
      case 'CALL': return 'bg-blue-500 border-blue-400 text-blue-100';
      default: return 'bg-zinc-600 border-zinc-500 text-zinc-100';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-zinc-200 overflow-hidden relative">
      
      {/* Top Header / Navbar */}
      <div className="h-[60px] border-b border-[#222] bg-[#111] flex items-center justify-between px-3 md:px-6 gap-3 shrink-0 z-30 overflow-x-auto custom-scrollbar">

        {/* Left Side: View Toggles & Timeframe */}
        <div className="flex items-center gap-3 md:gap-6 shrink-0">
          <div className="flex items-center gap-1 bg-[#1a1a1a] p-1 rounded-lg border border-[#333]">
            <button className="p-1.5 rounded transition-colors bg-[#333] text-white shadow-sm"><Columns className="size-[15px]" /></button>
            <button className="p-1.5 rounded transition-colors text-zinc-500 hover:text-zinc-300"><ListIcon className="size-[15px]" /></button>
          </div>

          <div className="flex items-center text-[11px] font-bold text-zinc-500 tracking-wider">
            <button onClick={() => setViewTimeframe('dia')} className={`px-3 py-1 rounded transition-colors ${viewTimeframe === 'dia' ? 'text-zinc-200' : 'hover:text-zinc-300'}`}>DIA</button>
            <button onClick={() => setViewTimeframe('semana')} className={`px-3 py-1 rounded transition-colors ${viewTimeframe === 'semana' ? 'text-zinc-200' : 'hover:text-zinc-300'}`}>SEMANA</button>
            <button onClick={() => setViewTimeframe('mes')} className={`px-3 py-1 rounded transition-colors ${viewTimeframe === 'mes' ? 'text-zinc-200' : 'hover:text-zinc-300'}`}>MÊS</button>
          </div>

          <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#333] hover:border-[#444] transition-colors rounded-lg h-9 px-3 cursor-pointer">
             <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-[11px] font-bold px-2 py-0.5 rounded whitespace-nowrap">Meus eventos</span>
             <span className="text-[13px] text-zinc-500">Novo filtro</span>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2 md:gap-4 relative shrink-0">
          <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className={`p-2 rounded transition-colors ${isDropdownOpen ? 'text-white bg-[#222]' : 'text-zinc-400 hover:text-white hover:bg-[#1a1a1a]'}`}>
            <MoreHorizontal className="size-5" />
          </button>

          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
              <div className="absolute top-[calc(100%+8px)] right-[250px] w-[260px] bg-[#141414]/90 backdrop-blur-md border border-[#333] rounded-xl shadow-2xl shadow-black/50 z-50 flex flex-col p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                 <button className="flex items-center gap-3 w-full text-left px-3 py-2 text-[13px] text-zinc-300 hover:text-white hover:bg-[#222] rounded-lg transition-colors group">
                    <Settings className="size-4 text-zinc-500 group-hover:text-blue-400" /> Configurações de agendamento
                 </button>
                 <button className="flex items-center gap-3 w-full text-left px-3 py-2 text-[13px] text-zinc-300 hover:text-white hover:bg-[#222] rounded-lg transition-colors group">
                    <Clock className="size-4 text-zinc-500 group-hover:text-purple-400" /> Gerenciar tipos de eventos
                 </button>
                 <div className="h-px bg-[#222] my-1" />
                 <button className="flex items-center gap-3 w-full text-left px-3 py-2 text-[13px] text-zinc-300 hover:text-white hover:bg-[#222] rounded-lg transition-colors group">
                    <Download className="size-4 text-zinc-500 group-hover:text-green-400" /> Exportar
                 </button>
              </div>
            </>
          )}

          <button className="h-8 px-3 md:px-4 flex items-center gap-2 rounded bg-white/5 hover:bg-white/10 border border-[#333] text-zinc-300 text-[12px] font-bold transition-all group shrink-0">
            <RefreshCw className="size-3.5 text-zinc-400 group-hover:text-white group-hover:rotate-180 transition-all duration-500" /> <span className="hidden sm:inline">SINCRONIZAR</span>
          </button>

          <button onClick={() => setIsNewEventModalOpen(true)} className="h-8 px-3 md:px-4 flex items-center gap-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[12px] font-bold shadow-lg shadow-blue-600/20 transition-all shrink-0">
            <Plus className="size-4" /> <span className="hidden sm:inline">NOVO EVENTO</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a] relative">
        <div className="flex border-b border-[#222] bg-[#111] shrink-0">
          <div className="w-[60px] border-r border-[#222] flex items-center justify-center">
            <div className="flex items-center gap-1">
              <button className="p-1 hover:bg-[#222] rounded text-zinc-500 hover:text-zinc-300"><ChevronLeft className="size-4" /></button>
              <button className="p-1 hover:bg-[#222] rounded text-zinc-500 hover:text-zinc-300"><ChevronRight className="size-4" /></button>
            </div>
          </div>
          <div className="flex-1 flex">
            {daysOfWeek.map((day, i) => (
              <div key={i} className={`flex-1 flex flex-col items-center justify-center py-3 border-r border-[#222] ${i === 0 ? 'bg-[#1a1a1a]/50' : ''}`}>
                <span className={`text-[13px] ${i === 0 ? 'text-zinc-200 font-bold' : 'text-zinc-500'}`}>{day.name} {day.date}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex border-b border-[#222] shrink-0 min-h-[40px]">
          <div className="w-[60px] border-r border-[#222] flex items-center justify-center">
            <span className="text-[10px] text-zinc-600">Dia todo</span>
          </div>
          <div className="flex-1 flex">
            {daysOfWeek.map((_, i) => (
              <div key={i} className={`flex-1 border-r border-[#222] ${i === 0 ? 'bg-[#1a1a1a]/30' : ''}`} />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="absolute top-[18.5rem] left-[60px] right-0 h-px bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] z-10 pointer-events-none flex items-center">
             <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)] absolute -left-1" />
          </div>

          <div className="relative">
            {hours.map((hour) => (
              <div key={hour} className="flex h-16 group relative">
                <div className="w-[60px] border-r border-[#222] flex justify-center -mt-2">
                  <span className="text-[11px] text-zinc-600 group-hover:text-zinc-400 transition-colors">{hour.toString().padStart(2, '0')}:00</span>
                </div>
                <div className="flex-1 flex">
                  {daysOfWeek.map((day) => {
                    const slotTasks = getTasksForSlot(day.dayIndex, hour);
                    return (
                      <div key={day.dayIndex} className={`flex-1 border-r border-b border-[#222] border-opacity-50 hover:bg-[#141414] transition-colors relative p-1 ${day.dayIndex === 1 ? 'bg-[#1a1a1a]/20' : ''}`}>
                        {slotTasks.map(task => (
                          <div key={task.id} className={`w-full rounded border p-1.5 shadow-md ${getTaskColor(task.type)} flex flex-col justify-center`}>
                            <span className="text-[11px] font-bold truncate leading-tight">{task.title}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="absolute bottom-6 right-6 px-4 py-2 bg-[#1a1a1a] border border-[#333] hover:border-[#555] rounded-lg text-[13px] font-bold text-zinc-300 shadow-xl transition-all hover:bg-[#222]">
          Hoje
        </button>
      </div>

      {/* New Event Modal */}
      {isNewEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsNewEventModalOpen(false)} />
          <div className="relative w-full max-w-[400px] bg-[#111] border border-[#333] rounded-xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[16px] font-bold text-white flex items-center gap-2">
                <Plus className="size-5 text-blue-500" /> Novo Evento
              </h2>
              <button onClick={() => setIsNewEventModalOpen(false)} className="text-zinc-500 hover:text-white"><X className="size-5" /></button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-zinc-500 uppercase mb-1">Título do Evento</label>
                <input required name="title" type="text" placeholder="Ex: Reunião de Fechamento" className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-zinc-500 uppercase mb-1">Tipo</label>
                  <select name="type" className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-blue-500 appearance-none">
                    <option value="MEETING">Reunião (Roxo)</option>
                    <option value="CALL">Ligação (Azul)</option>
                    <option value="TASK">Tarefa (Cinza)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-zinc-500 uppercase mb-1">Data e Hora</label>
                  <input required name="dueDate" type="datetime-local" defaultValue="2026-05-25T14:00" className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-blue-500" style={{ colorScheme: 'dark' }} />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsNewEventModalOpen(false)} className="px-4 py-2 rounded-lg text-[13px] font-bold text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                <button disabled={isSubmitting} type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2">
                  {isSubmitting ? <RefreshCw className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  {isSubmitting ? 'Salvando...' : 'Salvar Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
