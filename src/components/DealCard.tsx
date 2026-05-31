'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MessageCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DealCardProps {
  deal: any;
  onClick?: () => void;
}

export function DealCard({ deal, onClick }: DealCardProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: deal.id,
    data: {
      type: 'Deal',
      deal,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className="bg-[#222222] border-2 border-blue-500 rounded-xl p-4 h-[120px] opacity-40"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] hover:border-blue-500/50 rounded-xl p-4 cursor-grab active:cursor-grabbing transition-colors shadow-sm group"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-sm text-zinc-100 truncate pr-2 group-hover:text-blue-400 transition-colors">{deal.title}</h4>
      </div>
      
      <div className="text-[11px] font-medium text-zinc-400 mb-3 truncate">
        {deal.contact?.name || 'Sem contato'} • {deal.contact?.phone || 'Sem telefone'}
      </div>

      <div className="flex justify-between items-end mt-auto">
        <span className="text-xs font-bold text-emerald-400">R$ {deal.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        
        <div className="flex gap-2 text-zinc-500">
          <div className="flex items-center gap-1 text-[10px]">
            <Clock className="size-3" />
            <span>{formatDistanceToNow(new Date(deal.createdAt), { addSuffix: true, locale: ptBR })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
