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
 * `cache()` deduplica a chamada dentro de uma mesma request (RSC + actions),
 * evitando N idas ao banco por render.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
