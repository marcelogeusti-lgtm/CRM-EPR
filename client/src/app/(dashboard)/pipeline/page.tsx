'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { KanbanColumn } from '@/components/kanban/KanbanColumn';
import { KanbanCard } from '@/components/kanban/KanbanCard';
import { PageHeader } from '@/components/system/PageHeader';
import { motion } from 'framer-motion';

export default function PipelinePage() {
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [activePipeline, setActivePipeline] = useState<any>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDeal, setActiveDeal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchPipelines = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/pipelines`);
        setPipelines(response.data);
        if (response.data.length > 0) {
          setActivePipeline(response.data[0]);
        }
      } catch (error) {
        console.error(error);
        setActivePipeline({
          name: 'Funil de Vendas Padrão',
          stages: [
            { id: '1', name: 'Lead Recebido', deals: [{ id: 'deal-1', title: 'Projeto Web - Alpha', value: 8500, contact: { name: 'João Silva' } }] },
            { id: '2', name: 'Contato Feito', deals: [] },
            { id: '3', name: 'Proposta Enviada', deals: [] },
            { id: '4', name: 'Negociação', deals: [] },
            { id: '5', name: 'Fechado (Ganho)', deals: [] }
          ]
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchPipelines();
  }, []);

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    for (const stage of activePipeline.stages) {
      const deal = stage.deals.find((d: any) => d.id === active.id);
      if (deal) {
        setActiveDeal(deal);
        break;
      }
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    // Left empty for smoother client transitions
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveDeal(null);

    if (!over) return;

    const dealId = active.id as string;
    const overId = over.id as string;

    let targetStageId = overId;
    
    const droppedOverCard = activePipeline.stages.some((s: any) => s.deals.some((d: any) => d.id === overId));
    if (droppedOverCard) {
      targetStageId = activePipeline.stages.find((s: any) => s.deals.some((d: any) => d.id === overId)).id;
    }

    const sourceStage = activePipeline.stages.find((s: any) => s.deals.some((d: any) => d.id === dealId));
    if (sourceStage.id === targetStageId) return;

    const newStages = activePipeline.stages.map((stage: any) => {
      if (stage.id === sourceStage.id) {
        return { ...stage, deals: stage.deals.filter((d: any) => d.id !== dealId) };
      }
      if (stage.id === targetStageId) {
        const deal = sourceStage.deals.find((d: any) => d.id === dealId);
        return { ...stage, deals: [...stage.deals, deal] };
      }
      return stage;
    });

    setActivePipeline({ ...activePipeline, stages: newStages });

    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/pipelines/deals/${dealId}/stage`, {
        stageId: targetStageId
      });
    } catch (error) {
      console.error('Failed to update deal stage:', error);
    }
  };

  if (isLoading) return <div className="text-zinc-500 p-8">Carregando funil de vendas...</div>;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
      
      {/* PageHeader unificado */}
      <PageHeader 
        title={activePipeline?.name || 'Pipeline de Vendas'}
        description="Gerencie seus negócios e acompanhe o progresso das suas negociações."
        actions={
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/80 rounded-lg flex items-center px-3 py-2 shadow-sm w-full md:w-64 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
                <Search className="size-[18px] text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="Buscar negócios..." 
                  className="bg-transparent border-none outline-none w-full ml-2 text-sm text-zinc-200 placeholder:text-zinc-500"
                />
              </div>
              <button className="h-11 px-4 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 rounded-xl transition-all font-medium border border-zinc-800/80 flex items-center gap-2 text-sm shadow-sm">
                <SlidersHorizontal className="size-[18px] text-zinc-400" />
                Filtros
              </button>
              <button className="h-11 px-5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center gap-2 text-sm whitespace-nowrap">
                <Plus className="size-[18px]" />
                Novo Negócio
              </button>
            </div>
          </div>
        }
      />

      {/* Grid Kanban */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex-1 overflow-x-auto pb-4 custom-scrollbar"
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-4 h-full min-w-max">
            {activePipeline?.stages.map((stage: any) => (
              <KanbanColumn key={stage.id} stage={stage} />
            ))}
          </div>

          <DragOverlay dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: '0.4',
                },
              },
            }),
          }}>
            {activeId ? (
              <div className="w-[300px]">
                <KanbanCard deal={activeDeal} isOverlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </motion.div>
    </div>
  );
}
