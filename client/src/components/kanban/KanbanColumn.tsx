'use client';

import { useDroppable } from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import { MoreHorizontal, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function KanbanColumn({ stage }: { stage: any }) {
  const { setNodeRef } = useDroppable({
    id: stage.id,
  });

  const dealIds = stage.deals.map((d: any) => d.id);

  return (
    <div className="w-[300px] flex flex-col h-full bg-zinc-900/40 backdrop-blur-md border border-zinc-800 rounded-2xl overflow-hidden shadow-lg relative group">
      
      {/* Glow Superior da Coluna baseado na quantidade de deals */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-600/50 via-purple-500/50 to-blue-600/50 opacity-50 group-hover:opacity-100 transition-opacity" />

      {/* Header da Coluna */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-800/50 bg-zinc-900/60 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-zinc-100 text-xs uppercase tracking-wider">{stage.name}</h3>
          <span className="bg-zinc-800/80 text-zinc-300 text-[10px] px-2 py-0.5 rounded-full border border-zinc-700/50 font-bold shadow-inner">
            {stage.deals.length}
          </span>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors">
            <Plus className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors">
            <MoreHorizontal className="size-4" />
          </Button>
        </div>
      </div>

      {/* Área de Drop de Cards */}
      <div 
        ref={setNodeRef}
        className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar z-10"
      >
        <SortableContext items={dealIds} strategy={verticalListSortingStrategy}>
          {stage.deals.map((deal: any) => (
            <KanbanCard key={deal.id} deal={deal} />
          ))}
        </SortableContext>
        
        {stage.deals.length === 0 && (
          <div className="h-28 border border-dashed border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 text-xs italic bg-zinc-900/20 backdrop-blur-sm transition-all hover:bg-zinc-800/30">
            Solte negócios aqui
          </div>
        )}
      </div>
    </div>
  );
}
