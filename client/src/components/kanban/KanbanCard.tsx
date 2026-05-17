'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, GripVertical } from 'lucide-react';
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
        className="h-32 bg-blue-50/50 border-2 border-dashed border-blue-200 rounded-2xl opacity-40 transition-all"
      />
    );
  }

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-white border-zinc-200 hover:border-blue-500/50 hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing group rounded-xl shadow-sm",
        isOverlay && "rotate-2 scale-105 border-blue-600 shadow-md z-50"
      )}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div 
              {...attributes} 
              {...listeners} 
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-zinc-100 rounded cursor-grab shrink-0"
            >
              <GripVertical className="size-3.5 text-zinc-400" />
            </div>
            <h4 className="font-bold text-zinc-800 text-xs leading-snug truncate">{deal.title}</h4>
          </div>
          <Avatar className="size-6 border border-zinc-200 flex-shrink-0">
            <AvatarFallback className="bg-blue-50 text-blue-600 text-[10px] font-bold">
              {deal.contact?.name?.substring(0, 2).toUpperCase() || '??'}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-50 text-[10px] py-0 px-2 rounded-full font-semibold">
            {deal.contact?.name || 'Sem Contato'}
          </Badge>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-[11px] text-zinc-400">
          <div className="flex items-center gap-1 font-bold text-blue-600">
            <DollarSign className="size-3" />
            <span>{formatCurrency(deal.value)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="size-3" />
            <span>2d atrás</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
