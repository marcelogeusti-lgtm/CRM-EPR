import { cache } from 'react'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

/**
 * Resolve o usuário logado do CRM a partir da sessão do Supabase.
 *
 * Contrato de identidade: no cadastro (signup) criamos a linha em `User` com
 * o MESMO id do Supabase Auth (`data.user.id`). Por isso conseguimos casar
 * a sessão -> User -> Tenant sem tabela de mapeamento extra.
 *
 * NÃO envolver esta função com `React.cache()` diretamente: essa memoização
 * é pensada pra deduplicar dentro do render de uma Server Component, mas
 * Server Actions (como as que as páginas client-side usam via useEffect)
 * não fazem parte dessa árvore de render — cache() pode devolver um
 * resultado (inclusive `null`) preso de uma invocação anterior, causando
 * falso "UNAUTHENTICATED" para usuários realmente logados. Já causou esse
 * bug em produção (2026-07-15). Para exibição não-crítica (ex.: nome na
 * Sidebar), prefira `getDisplayUser()` abaixo — evita o round-trip de
 * rede que causa essa classe de falha intermitente.
 */
export async function getCurrentUser() {
  // Caminho rápido: o middleware (proxy.ts → updateSession) já validou a
  // sessão contra o Supabase pra deixar a requisição chegar até aqui, e
  // propaga o id validado neste header — reaproveitar evita repetir a
  // MESMA validação de rede (supabase.auth.getUser()) que o middleware
  // acabou de fazer. Múltiplas chamadas independentes de getUser() por
  // requisição (middleware + layout + página + eventuais prefetches) era
  // a principal suspeita da corrida de renovação de refresh token que
  // causava "UNAUTHENTICATED" intermitente pra usuários genuinamente
  // logados (ver docs/ROADMAP.md). O header é normalizado no próprio
  // middleware (nunca vem de um valor injetado pelo cliente).
  const headerUserId = (await headers()).get('x-nexus-user-id')

  if (headerUserId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: headerUserId },
      include: { tenant: true },
    })
    if (dbUser) return dbUser
    // Sem match por id (ex.: conta antiga não sincronizada) — cai pro
    // caminho de rede completo abaixo, que tem o e-mail pra tentar o
    // fallback de novo.
  }

  const supabase = await createClient()

  // supabase.auth.getUser() valida a sessão com uma chamada de rede pro
  // Auth do Supabase a cada invocação — um timeout/blip transitório nessa
  // chamada devolve `user: null` mesmo pra quem está logado de verdade,
  // gerando "UNAUTHENTICATED" falso. Uma retentativa rápida cobre a
  // maioria desses casos; pra quem está genuinamente deslogado só custa
  // uma chamada extra de ~150ms.
  let { data: { user }, error } = await supabase.auth.getUser()
  if (!user) {
    await new Promise(resolve => setTimeout(resolve, 150))
    ;({ data: { user }, error } = await supabase.auth.getUser())
  }

  if (!user) {
    // Log de diagnóstico: se isso ainda aparecer nos logs do Vercel depois
    // do header acima, o `error` aqui é o dado que falta pra cravar a
    // causa raiz de vez (ver docs/ROADMAP.md).
    console.error('❌ [AUTH] getCurrentUser sem header e sem sessão via rede.', {
      hasHeaderFallback: !!headerUserId,
      supabaseError: error?.message,
    })
    return null
  }

  // Casa por id (caminho normal). Fallback por email cobre contas antigas
  // criadas antes de sincronizarmos o id, e reancora o id quando divergir.
  let dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { tenant: true },
  })

  if (!dbUser && user.email) {
    dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      include: { tenant: true },
    })
  }

  return dbUser
}

/**
 * Versão "cosmética" pra exibir nome/cargo na UI (ex.: rodapé da Sidebar).
 * Usa `getSession()` em vez de `getUser()`: lê o JWT do cookie localmente,
 * sem round-trip de rede pro Auth do Supabase no caso comum (token ainda
 * válido) — só faz rede se o token já tiver expirado e precisar renovar.
 * Isso evita a mesma classe de falha intermitente que derruba
 * `getCurrentUser()` quando a chamada de rede do `getUser()` falha.
 *
 * Só use isto pra EXIBIR informação, nunca pra decidir acesso a dado —
 * quem decide acesso continua sendo `getCurrentUser`/`requireTenantId`,
 * que validam a sessão de verdade contra o servidor do Supabase.
 */
export const getDisplayUser = cache(async function getDisplayUser() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const authUser = session?.user
  if (!authUser) return null

  let dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: { tenant: true },
  })

  if (!dbUser && authUser.email) {
    dbUser = await prisma.user.findUnique({
      where: { email: authUser.email },
      include: { tenant: true },
    })
  }

  return dbUser
})

/**
 * Igual a getCurrentUser, mas lança se não houver sessão válida.
 * Use em server actions/páginas que exigem login.
 */
export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('UNAUTHENTICATED: nenhum usuário logado.')
  }
  return user
}

/**
 * Retorna o tenantId do usuário logado. Toda query voltada ao usuário DEVE
 * escopar por este valor — nunca mais `prisma.tenant.findFirst()`.
 */
export async function requireTenantId() {
  const user = await requireUser()
  return user.tenantId
}

/** Conveniência para checagens de permissão (RBAC). */
export async function requireAdmin() {
  const user = await requireUser()
  if (user.role !== 'ADMIN') {
    throw new Error('FORBIDDEN: requer papel ADMIN.')
  }
  return user
}
