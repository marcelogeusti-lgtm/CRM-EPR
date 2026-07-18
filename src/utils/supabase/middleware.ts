import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Cookies que o Supabase quiser regravar (ex.: token renovado) ficam
  // aqui e só são aplicadas UMA vez, na resposta final — antes, cada
  // branch de retorno (login redirect, dashboard redirect, resposta
  // normal) criava sua própria NextResponse, e os dois primeiros
  // descartavam silenciosamente qualquer renovação de token que tivesse
  // acabado de acontecer.
  let cookiesToSet: { name: string; value: string; options: CookieOptions }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(newCookies) {
          newCookies.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet = newCookies
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (e) {
    // Ignora erro se o Supabase estiver fora do ar
  }

  const hostname = request.headers.get('host') || ''
  const isPainel = hostname.startsWith('painel.')

  // Proteger rotas (Tudo exceto /, /login, /admin/login e rotas publicas)
  const isPublicRoute = request.nextUrl.pathname === '/' ||
                        request.nextUrl.pathname.startsWith('/login') ||
                        request.nextUrl.pathname.startsWith('/admin/login') ||
                        request.nextUrl.pathname.startsWith('/api/webhooks');

  if (!user && !isPublicRoute) {
    // Redireciona para o Login se não estiver autenticado
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const redirectResponse = NextResponse.redirect(url)
    cookiesToSet.forEach(({ name, value, options }) => redirectResponse.cookies.set(name, value, options))
    return redirectResponse
  }

  // Se o usuário já está logado e tenta acessar a página de login OU a raiz (/), redireciona
  if (user && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/admin/login')) {
    const url = request.nextUrl.clone()
    url.pathname = isPainel ? '/admin' : '/dashboard'
    const redirectResponse = NextResponse.redirect(url)
    cookiesToSet.forEach(({ name, value, options }) => redirectResponse.cookies.set(name, value, options))
    return redirectResponse
  }

  // Propaga o id do usuário já validado aqui pro downstream (Server
  // Components/Actions) reaproveitar em vez de chamar supabase.auth.getUser()
  // de novo — essa segunda validação de rede redundante é a principal
  // suspeita da corrida de renovação de token intermitente (ver
  // docs/ROADMAP.md). getCurrentUser() ainda faz a validação de rede
  // completa como fallback se este header não vier, então nenhuma
  // garantia de segurança é perdida — só evitamos repetir o trabalho que
  // o middleware acabou de fazer.
  //
  // Sempre normaliza o header (nunca deixa passar um valor vindo do
  // próprio cliente): se validamos alguém, sobrescreve com o id real;
  // caso contrário, apaga qualquer x-nexus-user-id que o cliente tenha
  // tentado injetar na própria requisição — sem isso, alguém sem sessão
  // válida em uma rota pública poderia forjar esse header e se passar
  // por outro usuário.
  //
  // IMPORTANTE: `request.headers` não é mutável diretamente — precisa
  // clonar num `Headers` novo e passar via `NextResponse.next({request:
  // {headers}})`, exatamente como a documentação do Next.js manda (ver
  // node_modules/next/dist/docs/.../proxy.md, seção "Setting Headers).
  // Mutar `request.headers.set()/.delete()` direto (como a primeira
  // versão desta correção fazia) lança exceção em produção — foi a causa
  // de uma leva de erro 500 nova, pior que o bug que estava tentando
  // resolver.
  const requestHeaders = new Headers(request.headers)
  if (user) {
    requestHeaders.set('x-nexus-user-id', user.id)
  } else {
    requestHeaders.delete('x-nexus-user-id')
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
  return response
}
