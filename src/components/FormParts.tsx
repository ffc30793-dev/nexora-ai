'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import type { ActionState } from '@/lib/action-state';

export function SubmitButton({ children, pendingLabel = 'Aguarde…' }: { children: React.ReactNode; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}

export function Field({
  label,
  name,
  type = 'text',
  autoComplete,
  defaultValue,
  error,
  hint,
  inputMode,
  required = true,
}: {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password';
  autoComplete?: string;
  defaultValue?: string;
  error?: string;
  hint?: string;
  inputMode?: 'text' | 'email';
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  const id = `f-${name}`;

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <input
          id={id}
          name={name}
          className="input"
          type={isPassword && visible ? 'text' : type}
          autoComplete={autoComplete}
          defaultValue={defaultValue}
          inputMode={inputMode}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          autoCapitalize={type === 'email' ? 'none' : undefined}
          spellCheck={type === 'text' ? undefined : false}
          style={isPassword ? { paddingRight: '5rem' } : undefined}
        />
        {isPassword ? (
          <button type="button" className="toggle-pass" onClick={() => setVisible((v) => !v)}>
            {visible ? 'Ocultar' : 'Mostrar'}
          </button>
        ) : null}
      </div>
      {error ? <p id={`${id}-err`} className="field-error" role="alert">{error}</p> : null}
      {!error && hint ? <p id={`${id}-hint`} className="hint">{hint}</p> : null}
    </div>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  if (state.error) return <div className="alert alert-error" role="alert">{state.error}</div>;
  if (state.success) return <div className="alert alert-success" role="status">{state.success}</div>;
  return null;
}
