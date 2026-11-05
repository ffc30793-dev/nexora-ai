import type { CookieOptions } from '@supabase/ssr';

/**
 * Cookies de sessão endurecidos. Como o app não usa cliente Supabase no
 * navegador (toda autenticação passa pelo servidor), podemos usar HttpOnly.
 */
export function secureCookieOptions(options: CookieOptions = {}): CookieOptions {
  return {
    ...options,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
}
