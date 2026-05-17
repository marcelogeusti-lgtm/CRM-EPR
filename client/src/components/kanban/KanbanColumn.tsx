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
    <div className="w-[300px] flex flex-col h-full bg-zinc-50 border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
      
      {/* Header da Coluna */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-100 bg-white">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-zinc-800 text-xs uppercase tracking-wider">{stage.name}</h3>
          <span className="bg-zinc-100 text-zinc-500 text-[10px] px-2 py-0.5 rounded-full border border-zinc-200 font-bold">
            {stage.deals.length}
          </span>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg">
            <Plus className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg">
            <MoreHorizontal className="size-4" />
          </Button>
        </div>
      </div>

      {/* Área de Drop de Cards */}
      <div 
        ref={setNodeRef}
        className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar"
      >
        <SortableContext items={dealIds} strategy={verticalListSortingStrategy}>
          {stage.deals.map((deal: any) => (
            <KanbanCard key={deal.id} deal={deal} />
          ))}
        </SortableContext>
        
        {stage.deals.length === 0 && (
          <div className="h-28 border border-dashed border-zinc-200 rounded-2xl flex items-center justify-center text-zinc-400 text-xs italic bg-white/40">
            Solte negócios aqui
          </div>
        )}
      </div>
    </div>
  );
}
