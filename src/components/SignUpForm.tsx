'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { signUpAction } from '@/app/actions';
import { initialState } from '@/lib/action-state';
import { Field, FormMessage, SubmitButton } from './FormParts';

export function SignUpForm() {
  const [state, action] = useActionState(signUpAction, initialState);
  const fe = state.fieldErrors ?? {};
  const v = state.values ?? {};

  return (
    <form action={action} className="form" noValidate>
      <FormMessage state={state} />
      <Field label="Seu nome" name="fullName" autoComplete="name" defaultValue={v.fullName} error={fe.fullName?.[0]} />
      <Field label="Nome da empresa" name="businessName" autoComplete="organization" defaultValue={v.businessName} error={fe.businessName?.[0]} />
      <Field label="E-mail" name="email" type="email" inputMode="email" autoComplete="email" defaultValue={v.email} error={fe.email?.[0]} />
      <Field label="Senha" name="password" type="password" autoComplete="new-password" error={fe.password?.[0]} hint="Mínimo de 8 caracteres, com letras e números." />
      <Field label="Confirmar senha" name="confirmPassword" type="password" autoComplete="new-password" error={fe.confirmPassword?.[0]} />
      <SubmitButton pendingLabel="Criando conta…">Criar conta</SubmitButton>
      <div className="links">
        <span className="muted">
          Já tem conta? <Link href="/login">Entrar</Link>
        </span>
      </div>
    </form>
  );
}
