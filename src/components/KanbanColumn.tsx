'use client';

import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DealCard } from './DealCard';

interface ColumnProps {
  stage: string;
  title: string;
  deals: any[];
  onDealClick: (id: string) => void;
}

export function Column({ stage, title, deals, onDealClick }: ColumnProps) {
  const dealIds = useMemo(() => deals.map(d => d.id), [deals]);

  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    data: {
      type: 'Column',
      stage,
    },
  });

  const totalValue = deals.reduce((acc, curr) => acc + (curr.value || 0), 0);

  return (
    <div className="flex flex-col bg-[#141414]/80 backdrop-blur-md border border-[#262626] rounded-xl w-[320px] min-w-[320px] shrink-0 h-full overflow-hidden transition-colors">
      <div className="p-4 border-b border-[#262626] flex flex-col gap-1 bg-[#1a1a1a]">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm text-zinc-200">{title}</h3>
          <span className="bg-[#262626] text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{deals.length}</span>
        </div>
        <span className="text-[11px] font-medium text-emerald-500">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
      </div>

      <div 
        ref={setNodeRef} 
        className={`flex-1 p-3 overflow-y-auto custom-scrollbar flex flex-col gap-3 transition-colors ${isOver ? 'bg-white/[0.02]' : ''}`}
      >
        <SortableContext items={dealIds} strategy={verticalListSortingStrategy}>
          {deals.map(deal => (
            <DealCard key={deal.id} deal={deal} onClick={() => onDealClick(deal.id)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
