import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // Verifica se o acesso está vindo pelo subdomínio 'painel.'
  const isPainel = hostname.startsWith('painel.')

  if (isPainel) {
    // Se estiver acessando a raiz do painel, redireciona para o dashboard ou login
    // Nós usamos 'rewrite' para manter a URL limpa (painel.seudominio.com) no navegador do cliente,
    // mas o Next.js carrega os arquivos da pasta interna /admin.
    if (!url.pathname.startsWith('/admin')) {
      // Se o usuário acessar painel.dominio.com/, vira /admin/
      // Se acessar painel.dominio.com/login, vira /admin/login
      const path = url.pathname === '/' ? '' : url.pathname
      url.pathname = `/admin${path}`
      return NextResponse.rewrite(url)
    }
  }

  return NextResponse.next()
}

// Configuração para dizer ao middleware em quais rotas ele deve rodar
export const config = {
  matcher: [
    // Roda em todas as rotas, exceto arquivos estáticos, _next, imagens e favicons
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
