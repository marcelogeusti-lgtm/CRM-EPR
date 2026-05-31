'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface KanbanCardProps {
  deal: any;
  isOverlay?: boolean;
}

export function KanbanCard({ deal, isOverlay }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: deal.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  if (isDragging && !isOverlay) {
    return (
      <div 
        ref={setNodeRef}
        style={style}
        className="h-[104px] bg-zinc-800/20 border border-dashed border-zinc-700 rounded-[10px] opacity-50 transition-all"
      />
    );
  }

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      {...attributes} 
      {...listeners}
      className={cn(
        "bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] hover:bg-[#1f1f22] transition-colors duration-150 cursor-grab active:cursor-grabbing group rounded-[8px] shadow-sm relative overflow-hidden",
        isOverlay && "rotate-2 scale-105 border-[#52525b] shadow-xl z-50 bg-[#1f1f22]"
      )}
    >
      {/* Indicador sutil de cor no lado esquerdo do Card (padrão CRM) */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-transparent group-hover:bg-blue-500/80 transition-colors duration-200" />
      
      <CardContent className="p-3.5 pl-4 flex flex-col gap-3">
        {/* Topo: Título e Menu */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-zinc-200 text-[13px] leading-snug truncate">{deal.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-zinc-500 font-medium truncate">
                {deal.contact?.name || 'Sem Contato'}
              </span>
              {deal.contact?.name && (
                <span className="flex-shrink-0 size-1.5 rounded-full bg-emerald-500/40" />
              )}
            </div>
          </div>
          {deal.contact?.name && (
            <Avatar className="size-[22px] border border-zinc-700/50 flex-shrink-0">
              <AvatarFallback className="bg-zinc-800 text-zinc-400 text-[9px] font-bold">
                {deal.contact.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        {/* Rodapé: Valor e Data */}
        <div className="flex items-center justify-between pt-1">
          <div className="font-semibold text-[12px] text-zinc-300">
            {formatCurrency(deal.value)}
          </div>
          <div className="text-[10px] text-zinc-600 font-medium uppercase tracking-widest">
            Hoje
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
