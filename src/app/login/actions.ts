'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma';


export async function login(formData: FormData) {
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: 'Credenciais inválidas ou erro no login.' }
  }

  return { success: true }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Quando o e-mail já tem conta confirmada, o Supabase NÃO retorna erro —
  // por design, pra não revelar quais e-mails já estão cadastrados, ele
  // devolve um `data.user` "fake" com `identities: []` (nenhuma identidade
  // de fato vinculada). Sem checar isso, criávamos um Tenant+User órfão pra
  // esse id fake, que nunca bate com nenhuma sessão real de login.
  if (data.user && data.user.identities?.length === 0) {
    return { error: 'Este e-mail já está cadastrado. Faça login em vez de criar uma conta nova.' }
  }

  // Cada cadastro cria seu PRÓPRIO workspace (tenant) e entra como ADMIN dele.
  // É isso que garante o isolamento multi-tenant: nada de colar todo mundo
  // no "primeiro tenant". Convites de funcionários para um workspace
  // existente serão um fluxo separado (RBAC).
  if (data.user) {
    const workspaceName = (formData.get('workspaceName') as string)?.trim()
    await prisma.user.create({
      data: {
        id: data.user.id,
        email: data.user.email!,
        name: email.split('@')[0], // Nome provisório
        role: 'ADMIN',
        tenant: {
          create: { name: workspaceName || `Workspace de ${email.split('@')[0]}` },
        },
      },
    })
  }

  return { success: 'Conta criada com sucesso! Verifique seu e-mail ou faça login.' }
}
