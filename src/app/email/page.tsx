import React from 'react';
import { Mail } from 'lucide-react';

export default function EmailPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0a] text-zinc-500 px-6">
      <div className="flex flex-col items-center text-center max-w-sm">
        <Mail className="size-12 mb-4 opacity-20" />
        <h2 className="text-lg font-bold text-zinc-400 mb-2">Em Desenvolvimento</h2>
        <p className="text-sm leading-relaxed">
          Integração com caixa de e-mail (Gmail/IMAP) — ainda não construída. Por enquanto, o WhatsApp em <span className="text-zinc-300 font-medium">Inbox de chat</span> é o canal disponível.
        </p>
      </div>
    </div>
  );
}
