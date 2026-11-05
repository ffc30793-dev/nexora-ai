import type { Metadata } from 'next';
import { AuthShell } from '@/components/AuthShell';
import { ResetPasswordForm } from '@/components/ResetPasswordForm';

export const metadata: Metadata = { title: 'Nova senha' };

// Rota protegida pelo middleware: só acessível após abrir o link de recuperação.
export default function ResetPasswordPage() {
  return (
    <AuthShell title="Criar nova senha" subtitle="Escolha uma senha segura para sua conta.">
      <ResetPasswordForm />
    </AuthShell>
  );
}
