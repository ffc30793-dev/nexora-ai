import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeNext } from '@/lib/safe-redirect';

const ALLOWED_TYPES: EmailOtpType[] = ['signup', 'email', 'recovery', 'invite', 'magiclink', 'email_change'];

/**
 * Link de e-mail (template com token_hash). Funciona mesmo se o e-mail for
 * aberto em outro navegador/aparelho que não iniciou o fluxo.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  if (!tokenHash || !type || !ALLOWED_TYPES.includes(type)) {
    return NextResponse.redirect(`${origin}/login?erro=link-invalido`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) {
    return NextResponse.redirect(`${origin}/login?erro=link-invalido`);
  }

  const next = type === 'recovery' ? '/redefinir-senha' : sanitizeNext(searchParams.get('next'));
  return NextResponse.redirect(`${origin}${next}`);
}
