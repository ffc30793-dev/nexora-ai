import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseEnv } from '@/lib/env';
import { secureCookieOptions } from '@/lib/cookies';

const PROTECTED_PATHS = ['/dashboard', '/redefinir-senha'];
const GUEST_ONLY_PATHS = ['/login', '/cadastro', '/recuperar-senha'];

const matches = (pathname: string, bases: string[]) =>
  bases.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/** Renova a sessão (cookies) e aplica a proteção de rotas. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list: { name: string; value: string; options: import('@supabase/ssr').CookieOptions }[]) {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) {
          response.cookies.set(name, value, secureCookieOptions(options));
        }
      },
    },
  });

  // getUser() valida o token no servidor do Supabase (não confie em getSession aqui).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  const redirectWithCookies = (target: URL) => {
    const redirect = NextResponse.redirect(target);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  };

  if (!user && matches(pathname, PROTECTED_PATHS)) {
    const target = request.nextUrl.clone();
    target.pathname = '/login';
    target.search = '';
    target.searchParams.set('next', `${pathname}${search}`);
    return redirectWithCookies(target);
  }

  if (user && matches(pathname, GUEST_ONLY_PATHS)) {
    const target = request.nextUrl.clone();
    target.pathname = '/dashboard';
    target.search = '';
    return redirectWithCookies(target);
  }

  return response;
}
