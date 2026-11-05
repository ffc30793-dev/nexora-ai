'use client';

import { useActionState } from 'react';
import { resendConfirmationAction } from '@/app/actions';
import { initialState } from '@/lib/action-state';
import { FormMessage } from './FormParts';
import { useFormStatus } from 'react-dom';

function ResendButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-outline" disabled={pending}>
      {pending ? 'Reenviando…' : 'Reenviar e-mail de confirmação'}
    </button>
  );
}

export function ResendForm({ email }: { email: string }) {
  const [state, action] = useActionState(resendConfirmationAction, initialState);
  return (
    <form action={action} className="form">
      <FormMessage state={state} />
      <input type="hidden" name="email" value={email} />
      <ResendButton />
    </form>
  );
}
