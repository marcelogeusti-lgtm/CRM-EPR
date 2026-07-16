import React from 'react';
import { Users } from 'lucide-react';

export default function TeamPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0a] text-zinc-500 px-6">
      <div className="flex flex-col items-center text-center max-w-sm">
        <Users className="size-12 mb-4 opacity-20" />
        <h2 className="text-lg font-bold text-zinc-400 mb-2">Em Desenvolvimento</h2>
        <p className="text-sm leading-relaxed">
          Chat interno entre membros da equipe — ainda não construído. Por enquanto, use o WhatsApp ou e-mail da empresa para se comunicar com o time.
        </p>
      </div>
    </div>
  );
}
