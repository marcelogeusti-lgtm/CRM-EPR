import { PrismaClient } from '@prisma/client'

// Singleton do Prisma.
// Em serverless (Vercel), cada `new PrismaClient()` abre um novo pool de
// conexões. Instanciar em vários arquivos esgota o Postgres rapidamente.
// Reaproveitamos a mesma instância via `globalThis` (que sobrevive ao
// hot-reload em dev e é reutilizado entre invocações "quentes" em prod).

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
