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
    <div className="w-[300px] flex flex-col h-full bg-[#111] rounded-2xl border border-white/5 overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b border-white/5 bg-[#1a1a1a]">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">{stage.name}</h3>
          <span className="bg-white/5 text-gray-500 text-[10px] px-2 py-0.5 rounded-full border border-white/5">
            {stage.deals.length}
          </span>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-white">
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-white">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

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
          <div className="h-24 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center text-gray-600 text-xs italic">
            Solte aqui
          </div>
        )}
      </div>
    </div>
  );
}
