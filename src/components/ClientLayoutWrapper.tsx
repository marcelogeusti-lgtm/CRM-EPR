'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Menu, Box } from 'lucide-react'

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const isPublicPage = pathname === '/login' || pathname === '/'
  
  if (isPublicPage) {
    return <main className="min-h-screen w-full flex-1">{children}</main>
  }

  return (
    <>
      <Sidebar 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
      <main className="flex-1 md:ml-[260px] min-h-screen flex flex-col">
        {/* Mobile Topbar */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-[#222] bg-[#111] sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Box className="size-5 text-white" />
            </div>
            <span className="text-zinc-100 font-bold text-xl tracking-tight">Nexus</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <Menu className="size-6" />
          </button>
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          {children}
        </div>
      </main>
    </>
  )
}
