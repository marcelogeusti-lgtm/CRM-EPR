import React from 'react';
import { Bot, Zap, Plus } from 'lucide-react';

export default function AutomationsPage() {
  const stages = [
    { name: 'Novo Lead', color: 'bg-blue-500', automations: ['Webhook n8n: Alerta de Lead'] },
    { name: 'Em Conversação', color: 'bg-indigo-500', automations: ['Salesbot: Qualificação'] },
    { name: 'Proposta Enviada', color: 'bg-amber-500', automations: ['n8n: Enviar PDF via WhatsApp'] },
    { name: 'Fechado', color: 'bg-emerald-500', automations: ['n8n: Criar Fatura Asaas'] },
  ];

  return (
    <div className="p-8 h-full bg-[#0a0a0a] overflow-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Bot className="size-6 text-indigo-400" />
          Pipeline Digital (Automações)
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Configure robôs e webhooks para cada etapa do seu funil.</p>
      </div>

      <div className="flex gap-6 min-w-max">
        {stages.map((stage) => (
          <div key={stage.name} className="w-[300px] flex flex-col gap-4">
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                <h3 className="font-bold text-zinc-200">{stage.name}</h3>
              </div>
            </div>

            {/* Triggers/Automations */}
            <div className="flex flex-col gap-3 relative before:absolute before:left-1/2 before:-top-4 before:-bottom-4 before:w-px before:bg-[#262626] before:-z-10">
              {stage.automations.map((auto, i) => (
                <div key={i} className="bg-[#1a1a1a] border border-[#333333] rounded-xl p-3 shadow-sm relative z-10">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#222222] flex items-center justify-center shrink-0">
                      <Zap className="size-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-300">{auto}</p>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1 block">Ao entrar na etapa</span>
                    </div>
                  </div>
                </div>
              ))}
              
              <button className="bg-[#141414] hover:bg-[#1a1a1a] border border-dashed border-[#333333] rounded-xl p-3 flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors relative z-10">
                <Plus className="size-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Adicionar Gatilho</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
