'use client';

import { useDroppable } from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import { MoreHorizontal, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Helper de cor por índice da coluna para dar um toque sutil
const getStageColor = (index: number) => {
  const colors = [
    'bg-blue-500', 
    'bg-amber-500', 
    'bg-purple-500', 
    'bg-emerald-500', 
    'bg-zinc-500'
  ];
  return colors[index % colors.length];
};

export function KanbanColumn({ stage, index = 0 }: { stage: any, index?: number }) {
  const { setNodeRef } = useDroppable({
    id: stage.id,
  });

  const dealIds = stage.deals.map((d: any) => d.id);

  return (
    <div className="w-[280px] flex flex-col h-full relative group shrink-0">
      
      {/* Header Flat estilo KommoCRM */}
      <div className="pb-3 flex items-center justify-between mb-2 z-10 sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          {/* Ponto indicador de cor do funil */}
          <div className={`size-2 rounded-full ${getStageColor(index)}`} />
          <h3 className="font-bold text-zinc-300 text-[11px] uppercase tracking-widest">{stage.name}</h3>
          <span className="text-zinc-500 text-[10px] font-semibold ml-1">
            {stage.deals.length}
          </span>
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-md transition-colors cursor-pointer">
            <Plus className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-md transition-colors cursor-pointer">
            <MoreHorizontal className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Área de Drop (Swimlane Invisível) */}
      <div 
        ref={setNodeRef}
        className="flex-1 space-y-2.5 overflow-y-auto custom-scrollbar z-10 px-0.5 pb-4"
      >
        <SortableContext items={dealIds} strategy={verticalListSortingStrategy}>
          {stage.deals.map((deal: any) => (
            <KanbanCard key={deal.id} deal={deal} />
          ))}
        </SortableContext>
        
        {stage.deals.length === 0 && (
          <div className="h-20 border border-dashed border-[#27272a] rounded-[8px] flex items-center justify-center text-zinc-600 text-[11px] font-medium bg-[#18181b]/30 transition-all hover:bg-[#18181b]/50">
            Solte negócios aqui
          </div>
        )}
      </div>
    </div>
  );
}
