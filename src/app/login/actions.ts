'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: 'E-mail ou senha incorretos' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
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

  // Verifica se o Tenant padrão existe, senão cria
  let tenant = await prisma.tenant.findFirst()
  if (!tenant) {
    tenant = await prisma.tenant.create({ data: { name: 'Nexus Workspace' } })
  }

  // Se o usuário foi criado no Supabase Auth, sincroniza no Prisma
  if (data.user) {
    await prisma.user.create({
      data: {
        id: data.user.id,
        email: data.user.email!,
        name: email.split('@')[0], // Nome provisório
        tenantId: tenant.id
      }
    })
  }

  return { success: 'Conta criada com sucesso! Verifique seu e-mail ou faça login.' }
}
