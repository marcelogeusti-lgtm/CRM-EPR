import { cache } from 'react'
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
 * bug em produção (2026-07-15). Para o caso legítimo de cache — múltiplas
 * Server Components (ex.: layout + page) chamando isso no MESMO render —
 * use `getCachedUser()` abaixo.
 */
export async function getCurrentUser() {
  const supabase = await createClient()

  // supabase.auth.getUser() valida a sessão com uma chamada de rede pro
  // Auth do Supabase a cada invocação — um timeout/blip transitório nessa
  // chamada devolve `user: null` mesmo pra quem está logado de verdade,
  // gerando "UNAUTHENTICATED" falso (visto em produção mesmo depois de
  // remover o cache() acima). Uma retentativa rápida cobre a maioria
  // desses casos; pra quem está genuinamente deslogado só custa uma
  // chamada extra de ~150ms.
  let { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    await new Promise(resolve => setTimeout(resolve, 150))
    ;({ data: { user } } = await supabase.auth.getUser())
  }

  if (!user) return null

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
 * Versão cacheada de `getCurrentUser()`, escopada por `React.cache()` —
 * segura APENAS para uso dentro de Server Components (ex.: RootLayout +
 * page.tsx no mesmo render), nunca em Server Actions. Existe pra evitar
 * chamar `supabase.auth.getUser()` mais de uma vez por navegação quando o
 * layout e a página precisam do usuário no mesmo request.
 */
export const getCachedUser = cache(getCurrentUser)

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
