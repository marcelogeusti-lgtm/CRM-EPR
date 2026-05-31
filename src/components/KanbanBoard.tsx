'use client';

import React, { useState } from 'react';
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
  DragEndEvent
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column } from './KanbanColumn';
import { DealCard } from './DealCard';
import { updateDealStage } from '@/actions/pipeline';
import { LeadInboxPanel } from './LeadInboxPanel'; // O "Split Screen" Kommo

export const STAGES = ['NEW', 'IN_PROGRESS', 'PROPOSAL', 'WON', 'LOST'];

const STAGE_NAMES: Record<string, string> = {
  'NEW': 'Novos Leads',
  'IN_PROGRESS': 'Em Conversação',
  'PROPOSAL': 'Proposta Enviada',
  'WON': 'Fechado (Ganho)',
  'LOST': 'Perdido'
};

export function KanbanBoard({ initialDeals }: { initialDeals: any[] }) {
  const [deals, setDeals] = useState(initialDeals);
  const [activeDeal, setActiveDeal] = useState<any | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null); // Para o Split Screen

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const getDealsByStage = (stage: string) => deals.filter(d => d.stage === stage);

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const deal = deals.find(d => d.id === active.id);
    setActiveDeal(deal || null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveDeal = active.data.current?.type === 'Deal';
    const isOverDeal = over.data.current?.type === 'Deal';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveDeal) return;

    // Dropping a deal over another deal
    if (isOverDeal) {
      const activeIndex = deals.findIndex(t => t.id === activeId);
      const overIndex = deals.findIndex(t => t.id === overId);

      if (deals[activeIndex].stage !== deals[overIndex].stage) {
        setDeals((items) => {
          const newItems = [...items];
          newItems[activeIndex].stage = deals[overIndex].stage;
          return arrayMove(newItems, activeIndex, overIndex);
        });
      } else {
        setDeals(items => arrayMove(items, activeIndex, overIndex));
      }
    }

    // Dropping a deal over an empty column
    if (isOverColumn) {
      const activeIndex = deals.findIndex(t => t.id === activeId);
      setDeals((items) => {
        const newItems = [...items];
        newItems[activeIndex].stage = overId as string;
        return arrayMove(newItems, activeIndex, activeIndex);
      });
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const deal = deals.find(d => d.id === activeId);
    
    if (deal) {
      // O estado visual já foi atualizado no DragOver
      // Agora salvamos no banco de dados via Server Action
      await updateDealStage(activeId, deal.stage);
    }
  }

  const selectedDeal = deals.find(d => d.id === selectedDealId);

  return (
    <div className="flex h-full w-full">
      {/* Container do Kanban */}
      <div className={`flex-1 flex gap-4 overflow-x-auto pb-4 transition-all duration-300 ${selectedDealId ? 'w-2/3 pr-4' : 'w-full'}`}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {STAGES.map(stage => (
            <Column key={stage} stage={stage} title={STAGE_NAMES[stage]} deals={getDealsByStage(stage)} onDealClick={setSelectedDealId} />
          ))}

          <DragOverlay>
            {activeDeal ? <DealCard deal={activeDeal} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Split Screen Kommo View (Painel Direito) */}
      {selectedDealId && selectedDeal && (
        <LeadInboxPanel deal={selectedDeal} onClose={() => setSelectedDealId(null)} />
      )}
    </div>
  );
}
