import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
  // First, let supabase handle the auth and possibly return a redirect
  const supabaseResponse = await updateSession(request)

  // If Supabase is redirecting, let it redirect.
  if (supabaseResponse.status >= 300 && supabaseResponse.status < 400) {
    return supabaseResponse;
  }

  // If it's not a redirect, we can apply our rewrite for the subdomain
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const isPainel = hostname.startsWith('painel.');

  if (isPainel && !url.pathname.startsWith('/admin')) {
    const path = url.pathname === '/' ? '' : url.pathname;
    url.pathname = `/admin${path}`;
    
    // Copy the cookies from supabaseResponse to the new rewrite response
    const rewriteResponse = NextResponse.rewrite(url);
    supabaseResponse.cookies.getAll().forEach(cookie => {
        rewriteResponse.cookies.set(cookie.name, cookie.value);
    });
    return rewriteResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
