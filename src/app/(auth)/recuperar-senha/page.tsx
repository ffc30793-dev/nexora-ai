import type { Metadata } from 'next';
import { AuthShell } from '@/components/AuthShell';
import { ForgotPasswordForm } from '@/components/ForgotPasswordForm';

export const metadata: Metadata = { title: 'Recuperar senha' };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Recuperar senha" subtitle="Informe seu e-mail e enviaremos um link para criar uma nova senha.">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
