import type { Metadata } from 'next';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { AutoRefresh } from '@/components/CrmClient';
import { getSessionContext } from '@/lib/session';
import { STATUS_LABEL, formatPhone, formatShort } from '@/lib/crm';

export const metadata: Metadata = { title: 'Conversas | Nexora AI' };

type Conversation = {
  id: string;
  status: string;
  contact_id: string;
  last_message_at: string | null;
  created_at: string;
};
type ContactLite = { id: string; name: string | null; phone: string };
type MessageLite = { conversation_id: string; content: string | null; direction: string };

const FILTERS = [
  { key: 'todas', label: 'Todas' },
  { key: 'abertas', label: 'Abertas' },
  { key: 'resolvidas', label: 'Resolvidas' },
];

export default async function ConversasPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const { filtro = 'todas' } = await searchParams;
  const ctx = await getSessionContext();

  let conversations: Conversation[] = [];
  const contacts = new Map<string, ContactLite>();
  const lastMessage = new Map<string, MessageLite>();

  if (ctx.active) {
    let query = ctx.supabase
      .from('conversations')
      .select('id, status, contact_id, last_message_at, created_at')
      .eq('business_id', ctx.active.id)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (filtro === 'abertas') query = query.neq('status', 'resolved');
    if (filtro === 'resolvidas') query = query.eq('status', 'resolved');

    const { data } = await query;
    conversations = (data ?? []) as Conversation[];

    if (conversations.length > 0) {
      const contactIds = [...new Set(conversations.map((c) => c.contact_id))];
      const conversationIds = conversations.map((c) => c.id);

      const [{ data: contactRows }, { data: messageRows }] = await Promise.all([
        ctx.supabase.from('contacts').select('id, name, phone').in('id', contactIds),
        ctx.supabase
          .from('messages')
          .select('conversation_id, content, direction')
          .eq('business_id', ctx.active.id)
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false })
          .limit(300),
      ]);

      for (const c of (contactRows ?? []) as ContactLite[]) contacts.set(c.id, c);
      for (const m of (messageRows ?? []) as MessageLite[]) {
        if (!lastMessage.has(m.conversation_id)) lastMessage.set(m.conversation_id, m);
      }
    }
  }

  return (
    <AppShell ctx={ctx} active="conversas" breadcrumb="Nexora AI / Conversas" title="Conversas">
      <AutoRefresh seconds={10} />

      <section className="crm-panel">
        <div className="crm-tabs" role="tablist" aria-label="Filtrar conversas">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={f.key === 'todas' ? '/conversas' : `/conversas?filtro=${f.key}`}
              className={`crm-tab${filtro === f.key || (f.key === 'todas' && !['abertas', 'resolvidas'].includes(filtro)) ? ' active' : ''}`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {!ctx.active ? (
          <div className="crm-empty">
            <strong>Nenhuma empresa vinculada</strong>
            Sua conta não está ligada a nenhuma empresa.
          </div>
        ) : conversations.length === 0 ? (
          <div className="crm-empty">
            <strong>Nenhuma conversa ainda</strong>
            Abra uma conversa a partir de um <Link href="/clientes">cliente</Link>.
          </div>
        ) : (
          <ul className="crm-list">
            {conversations.map((conv) => {
              const contact = contacts.get(conv.contact_id);
              const last = lastMessage.get(conv.id);
              const when = conv.last_message_at ?? conv.created_at;
              const title = contact ? contact.name || formatPhone(contact.phone) : 'Cliente';
              const preview = last
                ? `${last.direction === 'outbound' ? 'Você: ' : ''}${last.content ?? ''}`
                : 'Sem mensagens';

              return (
                <li key={conv.id}>
                  <Link href={`/conversas/${conv.id}`} className="crm-item crm-link-item">
                    <div className="crm-item-main">
                      <strong>{title}</strong>
                      <span>{preview}</span>
                    </div>
                    <div className="crm-item-side">
                      <span className="crm-time">{formatShort(when)}</span>
                      <span className={`crm-badge ${conv.status}`}>{STATUS_LABEL[conv.status] ?? conv.status}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
