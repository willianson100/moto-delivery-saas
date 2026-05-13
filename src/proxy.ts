import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * PROXY V.L.A.E.G. — Segurança Global do MotoDelivery
 * 
 * Responsabilidade deste arquivo:
 * - Verificar SE o usuário está logado
 * - Se não estiver logado, mandar para /login
 * - Se estiver logado e tentar acessar /login, mandar para /dashboard
 * 
 * Obs: A verificação de QUAL ÁREA o usuário pode acessar (admin, motoboy, etc.)
 * é feita dentro de cada página, não aqui. Isso evita loops de redirecionamento.
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Verifica se há um usuário logado (renovando o token automaticamente)
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Rotas que qualquer pessoa pode acessar sem estar logada
  const isPublicRoute =
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/tracking') ||
    pathname.startsWith('/auth');

  // Não está logado e tenta entrar em área protegida → manda pro login
  if (!user && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Está logado e tenta acessar /login → manda pro dashboard (fallback seguro)
  // A página de dashboard vai redirecionar para a área correta com base no role
  if (user && pathname === '/login') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
