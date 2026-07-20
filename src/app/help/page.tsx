'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, MessageCircle, Bot, Zap, Puzzle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSection {
  title: string;
  icon: React.ElementType;
  items: FaqItem[];
}

const SECTIONS: FaqSection[] = [
  {
    title: 'WhatsApp e Inbox',
    icon: MessageCircle,
    items: [
      {
        question: 'Como conecto meu número de WhatsApp?',
        answer: 'Vá em Integrações → WhatsApp Business e insira o Token de Acesso Permanente e o ID do Número de Telefone gerados no Meta for Developers. O webhook do seu app na Meta deve apontar para /api/webhooks/meta.'
      },
      {
        question: 'Por que uma mensagem minha não foi enviada?',
        answer: 'O WhatsApp só aceita mensagens de texto livre até 24h depois da última mensagem do contato. Fora dessa janela, é preciso usar um template aprovado (HSM) — o inbox avisa quando isso acontece.'
      },
    ],
  },
  {
    title: 'Agente de IA (Salesbot)',
    icon: Bot,
    items: [
      {
        question: 'Como configuro a personalidade do agente?',
        answer: 'Em Agente de IA → Persona, defina o prompt de sistema, tom de voz, tamanho das respostas e diretrizes. Clique em "Salvar alterações" para aplicar.'
      },
      {
        question: 'Como ativo o agente para responder sozinho?',
        answer: 'Use o botão "Ativar agente de IA" no topo da página do Salesbot, ou configure uma etapa do funil em Automações para ativá-lo automaticamente quando um lead chegar lá.'
      },
    ],
  },
  {
    title: 'Automações',
    icon: Zap,
    items: [
      {
        question: 'O que uma automação de etapa faz?',
        answer: 'Ao mover um negócio para uma etapa com automação configurada, o Nexus pode ativar o Agente de IA e/ou disparar um webhook para o seu n8n com os dados do negócio.'
      },
    ],
  },
  {
    title: 'Integrações',
    icon: Puzzle,
    items: [
      {
        question: 'Minhas chaves de API ficam seguras?',
        answer: 'Sim — cada integração é isolada por workspace (tenant) e usada apenas nas chamadas de servidor para aquele provedor específico.'
      },
    ],
  },
];

function FaqAccordionItem({ item }: { item: FaqItem }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-[#262626] rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#141414] hover:bg-[#1a1a1a] transition-colors text-left"
      >
        <span className="text-sm font-semibold text-zinc-200">{item.question}</span>
        <ChevronDown className={`size-4 text-zinc-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-4 py-3 bg-[#111] text-sm text-zinc-400 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
          {item.answer}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="h-full bg-[#0a0a0a] text-white overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-8">
        <div className="flex items-center gap-3">
          <HelpCircle className="size-7 text-indigo-400" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Central de Ajuda</h1>
            <p className="text-zinc-500 text-sm">Dúvidas comuns sobre o Nexus CRM.</p>
          </div>
        </div>

        {SECTIONS.map(section => (
          <div key={section.title} className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-400 uppercase tracking-wider">
              <section.icon className="size-4" />
              {section.title}
            </h2>
            <div className="space-y-2">
              {section.items.map(item => (
                <FaqAccordionItem key={item.question} item={item} />
              ))}
            </div>
          </div>
        ))}

        <p className="text-xs text-zinc-600 pt-4 border-t border-[#222]">
          Não achou o que precisava? Use a página de <a href="/feedback" className="text-indigo-400 hover:text-indigo-300">Feedback</a> para nos contar.
        </p>
      </div>
    </div>
  );
}
