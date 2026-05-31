'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  const isPublicPage = pathname === '/login' || pathname === '/'
  
  if (isPublicPage) {
    return <main className="min-h-screen">{children}</main>
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1 ml-[260px] min-h-screen">
        {children}
      </main>
    </>
  )
}
