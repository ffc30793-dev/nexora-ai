import type { Metadata } from 'next';
import { AppShell } from '@/components/AppShell';
import { AutoRefresh, NewContactForm } from '@/components/CrmClient';
import { getSessionContext } from '@/lib/session';
import { formatPhone } from '@/lib/crm';
import { startConversationAction } from '@/app/crm-actions';

export const metadata: Metadata = { title: 'Clientes | Nexora AI' };

type Contact = { id: string; name: string | null; phone: string; email: string | null };

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; erro?: string }>;
}) {
  const { q = '', erro } = await searchParams;
  const ctx = await getSessionContext();

  // Remove caracteres que têm significado nos filtros do PostgREST.
  const term = q.replace(/[^\p{L}\p{N}\s]/gu, '').trim().slice(0, 50);
  const digits = term.replace(/\D/g, '');

  let contacts: Contact[] = [];
  if (ctx.active) {
    let query = ctx.supabase
      .from('contacts')
      .select('id, name, phone, email')
      .eq('business_id', ctx.active.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (term) {
      const filters = [`name.ilike.%${term}%`];
      if (digits.length >= 3) filters.push(`phone.ilike.%${digits}%`);
      query = query.or(filters.join(','));
    }

    const { data } = await query;
    contacts = (data ?? []) as Contact[];
  }

  return (
    <AppShell ctx={ctx} active="clientes" breadcrumb="Nexora AI / Clientes" title="Clientes">
      <AutoRefresh seconds={20} />

      {!ctx.active ? (
        <section className="crm-panel crm-empty">
          <strong>Nenhuma empresa vinculada</strong>
          Sua conta não está ligada a nenhuma empresa.
        </section>
      ) : (
        <div className="crm-grid">
          <section className="crm-panel">
            <h2>Novo cliente</h2>
            <p className="crm-sub">Cadastre o WhatsApp de quem você atende.</p>
            <NewContactForm />
          </section>

          <section className="crm-panel">
            <h2>Seus clientes</h2>
            <p className="crm-sub">{ctx.active.name}</p>

            {erro === 'conversa' ? (
              <div className="alert alert-error" role="alert">
                Não foi possível abrir a conversa. Tente novamente.
              </div>
            ) : null}

            <form method="get" className="crm-search" role="search">
              <input
                type="search"
                name="q"
                defaultValue={term}
                placeholder="Buscar por nome ou telefone"
                className="input"
                aria-label="Buscar clientes"
              />
              <button type="submit" className="btn btn-outline">Buscar</button>
            </form>

            {contacts.length === 0 ? (
              <div className="crm-empty">
                <strong>{term ? 'Nenhum cliente encontrado' : 'Nenhum cliente ainda'}</strong>
                {term ? 'Tente outro nome ou número.' : 'Cadastre o primeiro cliente ao lado.'}
              </div>
            ) : (
              <ul className="crm-list">
                {contacts.map((c) => (
                  <li key={c.id} className="crm-item">
                    <div className="crm-item-main">
                      <strong>{c.name || formatPhone(c.phone)}</strong>
                      <span>{c.name ? formatPhone(c.phone) : c.email || 'Sem nome'}</span>
                    </div>
                    <form action={startConversationAction}>
                      <input type="hidden" name="contactId" value={c.id} />
                      <button type="submit" className="btn btn-outline">Conversar</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}

            {contacts.length === 50 ? (
              <p className="crm-note">Mostrando os 50 mais recentes. Use a busca para encontrar outros.</p>
            ) : null}
          </section>
        </div>
      )}
    </AppShell>
  );
}
