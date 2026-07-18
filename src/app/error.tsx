'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Para-quedas de erro pra todo o app (Next.js App Router: error.tsx captura
 * qualquer exceção não tratada durante a renderização de uma página/Server
 * Component nesse segmento de rota). Sem isso, um erro não tratado — como o
 * UNAUTHENTICATED intermitente numa página que só roda no servidor (ex.:
 * /service-orders) — mostrava a tela genérica e feia do Next.js
 * ("This page couldn't load") em vez da nossa mensagem.
 */
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error('❌ [ERROR BOUNDARY]', error);
  }, [error]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0a0a0a] text-white px-6">
      <AlertTriangle className="size-12 text-amber-400 mb-4" />
      <h1 className="text-xl font-bold mb-2">Não foi possível carregar esta página</h1>
      <p className="text-sm text-zinc-500 text-center max-w-sm mb-6">
        Foi uma falha temporária. Tente de novo — na maioria das vezes já resolve.
      </p>
      <button
        onClick={() => unstable_retry()}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors"
      >
        <RefreshCw className="size-4" />
        Tentar novamente
      </button>
    </div>
  );
}
