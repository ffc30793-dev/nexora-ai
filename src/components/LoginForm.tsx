'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { signInAction } from '@/app/actions';
import { initialState } from '@/lib/action-state';
import { Field, FormMessage, SubmitButton } from './FormParts';

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(signInAction, initialState);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="form" noValidate>
      <FormMessage state={state} />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Field label="E-mail" name="email" type="email" inputMode="email" autoComplete="email" defaultValue={state.values?.email} error={fe.email?.[0]} />
      <Field label="Senha" name="password" type="password" autoComplete="current-password" error={fe.password?.[0]} />
      <SubmitButton pendingLabel="Entrando…">Entrar</SubmitButton>
      <div className="links">
        <Link href="/recuperar-senha">Esqueci minha senha</Link>
        <span className="muted">
          Não tem conta? <Link href="/cadastro">Criar conta</Link>
        </span>
      </div>
    </form>
  );
}
