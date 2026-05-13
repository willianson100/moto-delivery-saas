import { createBrowserClient } from '@supabase/ssr';

/**
 * Cliente Supabase para uso em componentes "use client".
 * Gerencia cookies de sessão automaticamente no browser.
 * NÃO use em Server Components ou middleware.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
