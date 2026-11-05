import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseEnv } from '@/lib/env';
import { secureCookieOptions } from '@/lib/cookies';

export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(list: { name: string; value: string; options: import('@supabase/ssr').CookieOptions }[]) {
        try {
          for (const { name, value, options } of list) {
            cookieStore.set(name, value, secureCookieOptions(options));
          }
        } catch {
          // Chamado a partir de um Server Component: o middleware renova a sessão.
        }
      },
    },
  });
}
