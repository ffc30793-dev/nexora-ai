import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeNext } from '@/lib/safe-redirect';

/** Fluxo PKCE (?code=...). Requer abrir o link no mesmo navegador do cadastro. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${origin}/login?erro=link-invalido`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?erro=link-invalido`);
  }

  return NextResponse.redirect(`${origin}${sanitizeNext(searchParams.get('next'))}`);
}
