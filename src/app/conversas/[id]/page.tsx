import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { AutoRefresh, MessageComposer, SimulateInboundForm } from '@/components/CrmClient';
import { getSessionContext } from '@/lib/session';
import { MESSAGE_STATUS_LABEL, STATUS_LABEL, formatDateTime, formatPhone, uuidSchema } from '@/lib/crm';
import { setConversationStatusAction } from '@/app/crm-actions';

export const metadata: Metadata = { title: 'Conversa | Nexora AI' };

type Message = {
  id: string;
  direction: string;
  content: string | null;
  status: string;
  created_at: string;
};

export default async function ConversaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();

  const ctx = await getSessionContext();
  if (!ctx.active) notFound();

  const { data: conversation } = await ctx.supabase
    .from('conversations')
    .select('id, status, contact_id')
    .eq('id', id)
    .eq('business_id', ctx.active.id)
    .maybeSingle();

  if (!conversation) notFound();

  const [{ data: contact }, { data: messageRows }] = await Promise.all([
    ctx.supabase
      .from('contacts')
      .select('name, phone')
      .eq('id', conversation.contact_id)
      .eq('business_id', ctx.active.id)
      .maybeSingle(),
    ctx.supabase
      .from('messages')
      .select('id, direction, content, status, created_at')
      .eq('conversation_id', id)
      .eq('business_id', ctx.active.id)
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  const messages = ((messageRows ?? []) as Message[]).reverse();
  const name = contact?.name || (contact ? formatPhone(contact.phone) : 'Cliente');
  const resolved = conversation.status === 'resolved';

  return (
    <AppShell ctx={ctx} active="conversas" breadcrumb="Nexora AI / Conversas" title="Conversa">
      <AutoRefresh seconds={8} />

      <section className="crm-panel">
        <div className="crm-thread-head">
          <div>
            <Link href="/conversas" className="crm-back">← Voltar</Link>
            <h2>{name}</h2>
            {contact?.name ? <span className="crm-sub">{formatPhone(contact.phone)}</span> : null}
          </div>

          <div className="crm-thread-actions">
            <span className={`crm-badge ${conversation.status}`}>
              {STATUS_LABEL[conversation.status] ?? conversation.status}
            </span>
            <form action={setConversationStatusAction}>
              <input type="hidden" name="conversationId" value={id} />
              <input type="hidden" name="status" value={resolved ? 'open' : 'resolved'} />
              <button type="submit" className="btn btn-outline">
                {resolved ? 'Reabrir' : 'Marcar como resolvida'}
              </button>
            </form>
          </div>
        </div>

        <div className="crm-messages" aria-live="polite">
          {messages.length === 0 ? (
            <div className="crm-empty">
              <strong>Nenhuma mensagem ainda</strong>
              Envie a primeira mensagem abaixo.
            </div>
          ) : (
            messages.map((m) => {
              const outbound = m.direction === 'outbound';
              return (
                <div key={m.id} className={`crm-msg ${outbound ? 'out' : 'in'}`}>
                  {m.content}
                  <small>
                    {formatDateTime(m.created_at)}
                    {outbound ? ` · ${MESSAGE_STATUS_LABEL[m.status] ?? m.status}` : ''}
                  </small>
                </div>
              );
            })
          )}
        </div>

        <MessageComposer conversationId={id} />
        <p className="crm-note">
          O envio pelo WhatsApp será ativado no próximo pacote. Por enquanto, a mensagem fica registrada na conversa.
        </p>

        <details className="crm-test">
          <summary>Ferramentas de teste</summary>
          <p className="crm-note">Registra uma mensagem como se o cliente tivesse enviado.</p>
          <SimulateInboundForm conversationId={id} />
        </details>
      </section>
    </AppShell>
  );
}
