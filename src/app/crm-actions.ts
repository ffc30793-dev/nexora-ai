'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { contactSchema, messageSchema, uuidSchema } from '@/lib/crm';
import type { ActionState } from '@/lib/action-state';

const str = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === 'string' ? v : '';
};

/* A empresa vem sempre da sessão (servidor), nunca do formulário. */

export async function createContactAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = { name: str(formData, 'name'), phone: str(formData, 'phone'), email: str(formData, 'email') };

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, values: raw };
  }

  const ctx = await getSessionContext();
  if (!ctx.active) return { error: 'Nenhuma empresa vinculada à sua conta.', values: raw };

  const { error } = await ctx.supabase.from('contacts').insert({
    business_id: ctx.active.id,
    name: parsed.data.name ?? null,
    phone: parsed.data.phone,
    email: parsed.data.email ?? null,
  });

  if (error) {
    return {
      error:
        error.code === '23505'
          ? 'Já existe um cliente com este WhatsApp.'
          : 'Não foi possível salvar o cliente. Tente novamente.',
      values: raw,
    };
  }

  revalidatePath('/clientes');
  return { success: 'Cliente cadastrado.' };
}

export async function startConversationAction(formData: FormData): Promise<void> {
  const contactId = uuidSchema.safeParse(str(formData, 'contactId'));
  if (!contactId.success) redirect('/clientes?erro=conversa');

  const ctx = await getSessionContext();
  if (!ctx.active) redirect('/dashboard');

  // Reaproveita a conversa em andamento deste cliente, se houver.
  const { data: existing } = await ctx.supabase
    .from('conversations')
    .select('id')
    .eq('business_id', ctx.active.id)
    .eq('contact_id', contactId.data)
    .neq('status', 'resolved')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) redirect(`/conversas/${existing.id}`);

  const { data: created, error } = await ctx.supabase
    .from('conversations')
    .insert({ business_id: ctx.active.id, contact_id: contactId.data, status: 'open' })
    .select('id')
    .single();

  if (error || !created) redirect('/clientes?erro=conversa');
  redirect(`/conversas/${created.id}`);
}

async function addMessage(formData: FormData, kind: 'outbound' | 'inbound'): Promise<ActionState> {
  const rawContent = str(formData, 'content');
  const parsed = messageSchema.safeParse({
    conversationId: str(formData, 'conversationId'),
    content: rawContent,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Mensagem inválida.', values: { content: rawContent } };
  }

  const ctx = await getSessionContext();
  if (!ctx.active) return { error: 'Nenhuma empresa vinculada à sua conta.', values: { content: rawContent } };

  const { conversationId, content } = parsed.data;
  const outbound = kind === 'outbound';

  // A FK composta (conversation_id, business_id) impede usar conversa de outra empresa.
  const { error } = await ctx.supabase.from('messages').insert({
    business_id: ctx.active.id,
    conversation_id: conversationId,
    direction: kind,
    sender_type: outbound ? 'agent' : 'contact',
    message_type: 'text',
    content,
    status: outbound ? 'queued' : 'received',
  });

  if (error) {
    return { error: 'Não foi possível registrar a mensagem. Tente novamente.', values: { content: rawContent } };
  }

  await ctx.supabase
    .from('conversations')
    .update(
      outbound
        ? { last_message_at: new Date().toISOString() }
        : { last_message_at: new Date().toISOString(), status: 'open' },
    )
    .eq('id', conversationId)
    .eq('business_id', ctx.active.id);

  revalidatePath(`/conversas/${conversationId}`);
  revalidatePath('/conversas');
  return {};
}

export async function sendMessageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return addMessage(formData, 'outbound');
}

/** Ferramenta de teste (remover quando o WhatsApp real estiver conectado). */
export async function simulateInboundAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return addMessage(formData, 'inbound');
}

export async function setConversationStatusAction(formData: FormData): Promise<void> {
  const id = uuidSchema.safeParse(str(formData, 'conversationId'));
  const status = str(formData, 'status');
  if (!id.success || (status !== 'open' && status !== 'resolved')) return;

  const ctx = await getSessionContext();
  if (!ctx.active) return;

  await ctx.supabase
    .from('conversations')
    .update({ status })
    .eq('id', id.data)
    .eq('business_id', ctx.active.id);

  revalidatePath(`/conversas/${id.data}`);
  revalidatePath('/conversas');
}
