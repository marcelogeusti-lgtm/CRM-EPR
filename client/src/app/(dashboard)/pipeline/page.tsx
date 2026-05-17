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
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, MoreHorizontal } from 'lucide-react';
import { KanbanColumn } from '@/components/kanban/KanbanColumn';
import { KanbanCard } from '@/components/kanban/KanbanCard';

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
      } finally {
        setIsLoading(false);
      }
    };
    fetchPipelines();
  }, []);

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Find the deal being dragged
    for (const stage of activePipeline.stages) {
      const deal = stage.deals.find((d: any) => d.id === active.id);
      if (deal) {
        setActiveDeal(deal);
        break;
      }
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    // Logic for moving between columns would go here for smoother UX
    // For now, we'll handle the actual move in onDragEnd to simplify
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveDeal(null);

    if (!over) return;

    const dealId = active.id as string;
    const overId = over.id as string;

    // Find the target stage
    let targetStageId = overId;
    
    // If we dropped over a card, find its stage
    const droppedOverCard = activePipeline.stages.some((s: any) => s.deals.some((d: any) => d.id === overId));
    if (droppedOverCard) {
      targetStageId = activePipeline.stages.find((s: any) => s.deals.some((d: any) => d.id === overId)).id;
    }

    // Update local state first for optimistic UI
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

    // API call to persist the move
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/pipelines/deals/${dealId}/stage`, {
        stageId: targetStageId
      });
    } catch (error) {
      console.error('Failed to update deal stage:', error);
      // Rollback would go here
    }
  };

  if (isLoading) return <div className="text-white p-8">Carregando funil de vendas...</div>;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{activePipeline?.name || 'Pipeline de Vendas'}</h1>
          <p className="text-gray-400 mt-1">Gerencie seus negócios e acompanhe o progresso das vendas.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <Input placeholder="Buscar negócios..." className="pl-9 h-10 w-64 bg-white/5 border-white/10 text-white" />
          </div>
          <Button variant="outline" className="border-white/10 text-white">
            <Filter className="h-4 w-4 mr-2" /> Filtros
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
            <Plus className="h-4 w-4 mr-2" /> Novo Negócio
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-6 h-full min-w-max">
            {activePipeline?.stages.map((stage: any) => (
              <KanbanColumn key={stage.id} stage={stage} />
            ))}
          </div>

          <DragOverlay dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: '0.5',
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
      </div>
    </div>
  );
}
