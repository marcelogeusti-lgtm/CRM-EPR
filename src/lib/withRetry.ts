/**
 * Chama uma função assíncrona e, se ela rejeitar, tenta de novo UMA vez
 * depois de um pequeno delay antes de propagar o erro adiante.
 *
 * Usado nas telas que buscam dado ao montar via useEffect, como rede de
 * segurança contra o erro UNAUTHENTICATED intermitente documentado no
 * ROADMAP.md. Importante: isso roda no navegador (client component), então
 * a retentativa é uma requisição HTTP nova de verdade — diferente de uma
 * retentativa dentro do server, que esbarra na memoização automática de
 * fetch() do Next.js e nunca chega a bater na rede de novo.
 */
export async function withRetry<T>(fn: () => Promise<T>, delayMs = 800): Promise<T> {
  try {
    return await fn();
  } catch {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    return fn();
  }
}
