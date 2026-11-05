import type { Metadata } from 'next';
import { AuthShell } from '@/components/AuthShell';
import { SignUpForm } from '@/components/SignUpForm';

export const metadata: Metadata = { title: 'Criar conta' };

export default function SignUpPage() {
  return (
    <AuthShell title="Criar conta" subtitle="Comece a automatizar o atendimento do seu negócio.">
      <SignUpForm />
    </AuthShell>
  );
}
