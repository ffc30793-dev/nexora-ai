'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { requestPasswordResetAction } from '@/app/actions';
import { initialState } from '@/lib/action-state';
import { Field, FormMessage, SubmitButton } from './FormParts';

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordResetAction, initialState);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="form" noValidate>
      <FormMessage state={state} />
      <Field label="E-mail" name="email" type="email" inputMode="email" autoComplete="email" defaultValue={state.values?.email} error={fe.email?.[0]} />
      <SubmitButton pendingLabel="Enviando…">Enviar link</SubmitButton>
      <div className="links">
        <Link href="/login">Voltar para o login</Link>
      </div>
    </form>
  );
}
