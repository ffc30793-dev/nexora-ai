import type { Metadata } from 'next';
import { AuthShell } from '@/components/AuthShell';
import { LoginForm } from '@/components/LoginForm';
import { sanitizeNext } from '@/lib/safe-redirect';

export const metadata: Metadata = { title: 'Entrar' };

const ERRORS: Record<string, string> = {
  'link-invalido': 'Link inválido ou expirado. Solicite um novo.',
  'sessao-expirada': 'Sua sessão expirou. Entre novamente.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string }>;
}) {
  const { next, erro } = await searchParams;
  const errorMessage = erro ? ERRORS[erro] : undefined;

  return (
    <AuthShell title="Entrar" subtitle="Acesse sua conta Nexora AI.">
      {errorMessage ? <div className="alert alert-error" role="alert">{errorMessage}</div> : null}
      <LoginForm next={next ? sanitizeNext(next) : undefined} />
    </AuthShell>
  );
}
