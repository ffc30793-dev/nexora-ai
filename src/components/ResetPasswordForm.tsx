'use client';

import { useActionState } from 'react';
import { updatePasswordAction } from '@/app/actions';
import { initialState } from '@/lib/action-state';
import { Field, FormMessage, SubmitButton } from './FormParts';

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePasswordAction, initialState);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="form" noValidate>
      <FormMessage state={state} />
      <Field label="Nova senha" name="password" type="password" autoComplete="new-password" error={fe.password?.[0]} hint="Mínimo de 8 caracteres, com letras e números." />
      <Field label="Confirmar nova senha" name="confirmPassword" type="password" autoComplete="new-password" error={fe.confirmPassword?.[0]} />
      <SubmitButton pendingLabel="Salvando…">Salvar nova senha</SubmitButton>
    </form>
  );
}
