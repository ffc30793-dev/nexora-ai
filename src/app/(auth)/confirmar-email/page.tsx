import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/AuthShell';
import { ResendForm } from '@/components/ResendForm';
import { emailSchema } from '@/lib/validation';

export const metadata: Metadata = { title: 'Confirme seu e-mail' };

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  const parsed = emailSchema.safeParse({ email });
  const validEmail = parsed.success ? parsed.data.email : undefined;

  return (
    <AuthShell title="Confirme seu e-mail">
      <svg className="mail-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <rect x="6" y="14" width="52" height="36" rx="6" fill="#eff6ff" stroke="#1d4ed8" strokeWidth="3" />
        <path d="M8 18l24 18 24-18" stroke="#1d4ed8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="center">
        Enviamos um link de confirmação{validEmail ? <> para <strong>{validEmail}</strong></> : null}.
        Abra o e-mail e toque no link para ativar sua conta.
      </p>
      <p className="muted center">Não encontrou? Verifique a caixa de spam.</p>
      {validEmail ? <ResendForm email={validEmail} /> : null}
      <div className="links">
        <Link href="/login">Já confirmei — entrar</Link>
      </div>
    </AuthShell>
  );
}
