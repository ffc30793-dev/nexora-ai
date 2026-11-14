'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createContactAction, sendMessageAction, simulateInboundAction } from '@/app/crm-actions';
import { initialState } from '@/lib/action-state';
import { Field, FormMessage, SubmitButton } from '@/components/FormParts';

/** Atualiza a tela a cada poucos segundos (enquanto a aba está visível). */
export function AutoRefresh({ seconds = 8 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}

export function NewContactForm() {
  const [state, action] = useActionState(createContactAction, initialState);
  const fe = state.fieldErrors ?? {};
  const v = state.values ?? {};

  return (
    <form action={action} className="form" noValidate>
      <FormMessage state={state} />
      <Field label="Nome" name="name" autoComplete="off" defaultValue={v.name} error={fe.name?.[0]} required={false} />
      <Field
        label="WhatsApp"
        name="phone"
        autoComplete="off"
        defaultValue={v.phone}
        error={fe.phone?.[0]}
        hint="Com DDD, ex.: (86) 99999-9999"
      />
      <Field
        label="E-mail (opcional)"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="off"
        defaultValue={v.email}
        error={fe.email?.[0]}
        required={false}
      />
      <SubmitButton pendingLabel="Salvando…">Cadastrar cliente</SubmitButton>
    </form>
  );
}

function MessageForm({
  conversationId,
  action,
  placeholder,
  buttonLabel,
  pendingLabel,
}: {
  conversationId: string;
  action: typeof sendMessageAction;
  placeholder: string;
  buttonLabel: string;
  pendingLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="crm-composer">
      <FormMessage state={state} />
      <input type="hidden" name="conversationId" value={conversationId} />
      <textarea
        name="content"
        className="input crm-textarea"
        rows={3}
        maxLength={4000}
        placeholder={placeholder}
        defaultValue={state.values?.content}
        required
      />
      <SubmitButton pendingLabel={pendingLabel}>{buttonLabel}</SubmitButton>
    </form>
  );
}

export function MessageComposer({ conversationId }: { conversationId: string }) {
  return (
    <MessageForm
      conversationId={conversationId}
      action={sendMessageAction}
      placeholder="Escreva sua mensagem…"
      buttonLabel="Enviar"
      pendingLabel="Enviando…"
    />
  );
}

export function SimulateInboundForm({ conversationId }: { conversationId: string }) {
  return (
    <MessageForm
      conversationId={conversationId}
      action={simulateInboundAction}
      placeholder="Texto que o cliente enviaria…"
      buttonLabel="Simular mensagem recebida"
      pendingLabel="Registrando…"
    />
  );
}
