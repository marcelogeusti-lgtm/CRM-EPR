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
        className="h-32 bg-blue-600/5 border-2 border-dashed border-blue-600/20 rounded-xl opacity-50"
      />
    );
  }

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-[#1a1a1a] border-white/5 hover:border-blue-600/30 transition-all cursor-grab active:cursor-grabbing group",
        isOverlay && "rotate-3 scale-105 border-blue-600 shadow-[0_10px_30px_rgba(37,99,235,0.3)] z-50"
      )}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div {...attributes} {...listeners} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/5 rounded cursor-grab">
              <GripVertical className="h-4 w-4 text-gray-600" />
            </div>
            <h4 className="font-bold text-white text-sm leading-tight">{deal.title}</h4>
          </div>
          <Avatar className="h-6 w-6 border border-white/10 flex-shrink-0">
            <AvatarFallback className="bg-blue-600/20 text-blue-400 text-[10px]">
              {deal.contact?.name?.substring(0, 2).toUpperCase() || '??'}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-none text-[10px] py-0">
            {deal.contact?.name || 'Sem Contato'}
          </Badge>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-1 text-gray-500 text-[10px]">
            <DollarSign className="h-3 w-3" />
            <span className="font-bold text-blue-400">{formatCurrency(deal.value)}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500 text-[10px]">
            <Calendar className="h-3 w-3" />
            <span>2d atrás</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
