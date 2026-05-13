import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Redirecionamento de proteção
  const isAuthPage = pathname.startsWith("/login") || 
                     pathname.startsWith("/forgot-password") ||
                     pathname.startsWith("/reset-password");
  
  const isProtectedPage = pathname.startsWith("/dashboard") ||
                           pathname.startsWith("/motoboy") ||
                           pathname.startsWith("/admin-master");

  if (!user && isProtectedPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    // Buscar perfil para saber o role e o tenant_id
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role, tenant_id")
      .eq("id", user.id)
      .single();

    const role = profile?.role;
    const tenantId = profile?.tenant_id;

    // Verificar status da assinatura do Tenant
    let isExpired = false;
    if (tenantId && role !== "admin_master") {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("subscription_status, trial_ends_at")
        .eq("id", tenantId)
        .single();
      
      if (tenant) {
        const now = new Date();
        const trialEnd = new Date(tenant.trial_ends_at);
        isExpired = tenant.subscription_status === "expired" || 
                    tenant.subscription_status === "blocked" ||
                    (tenant.subscription_status === "trial" && now > trialEnd);
      }
    }

    // Se estiver na página de login ou billing, não redireciona novamente
    if (isAuthPage || pathname.includes("/billing")) return response;

    // Se estiver expirado, redireciona para a página de cobrança/bloqueio
    if (isExpired && isProtectedPage) {
      return NextResponse.redirect(new URL("/dashboard/billing", request.url));
    }

    // Proteção de rotas cruzadas (Apenas para contas ATIVAS)
    if (pathname.startsWith("/admin-master") && role !== "admin_master") {
      const target = role === "motoboy" ? "/motoboy" : "/dashboard";
      return NextResponse.redirect(new URL(target, request.url));
    }

    if (pathname.startsWith("/dashboard") && (role === "motoboy" || role === "admin_master")) {
      const target = role === "admin_master" ? "/admin-master" : "/motoboy";
      return NextResponse.redirect(new URL(target, request.url));
    }

    if (pathname.startsWith("/motoboy") && role !== "motoboy") {
      const target = role === "admin_master" ? "/admin-master" : "/dashboard";
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  return response;
}
