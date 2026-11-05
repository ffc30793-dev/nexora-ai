import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Logo } from '@/components/Logo';
import { signOutAction } from '@/app/actions';

export const metadata: Metadata = { title: 'Painel' };

type Business = { id: string; name: string };
type MembershipRow = { role: 'owner' | 'admin' | 'agent'; businesses: Business | Business[] | null };

const ROLE_LABEL: Record<MembershipRow['role'], string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  agent: 'Atendente',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Todas as consultas passam pelo RLS: só retornam dados das empresas do usuário.
  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase.from('business_members').select('role, businesses(id, name)').eq('user_id', user.id),
  ]);

  const rows = ((memberships ?? []) as unknown as MembershipRow[]).flatMap((m) => {
    const b = Array.isArray(m.businesses) ? m.businesses[0] : m.businesses;
    return b ? [{ role: m.role, business: b }] : [];
  });

  const displayName =
    (profile?.full_name as string | null | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    user.email;

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Logo href="/dashboard" />
          <div className="topbar-right">
            <span className="user-name">{user.email}</span>
            <form action={signOutAction}>
              <button type="submit" className="btn btn-ghost">Sair</button>
            </form>
          </div>
        </div>
      </header>

      <main className="container">
        <h1>Olá, {displayName}</h1>
        <p className="muted">Bem-vindo ao Nexora AI. Sua conta está pronta.</p>

        <div className="grid">
          <section className="panel">
            <h2>Sua empresa</h2>
            {rows.length === 0 ? (
              <p className="muted">Nenhuma empresa vinculada à sua conta.</p>
            ) : (
              <ul className="list">
                {rows.map(({ role, business }) => (
                  <li key={business.id}>
                    <strong>{business.name}</strong>
                    <span className="badge">{ROLE_LABEL[role]}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel">
            <h2>Conta</h2>
            <ul className="list">
              <li>
                <span>E-mail</span>
                <span className={`badge ${user.email_confirmed_at ? 'badge-ok' : ''}`}>
                  {user.email_confirmed_at ? 'Verificado' : 'Não verificado'}
                </span>
              </li>
              <li>
                <span className="muted">{user.email}</span>
              </li>
            </ul>
          </section>

          <section className="panel">
            <h2>Próximos passos</h2>
            <p className="muted">
              Conexão com WhatsApp, IA e automações serão liberadas nos próximos pacotes.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
