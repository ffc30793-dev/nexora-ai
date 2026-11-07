
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Logo } from '@/components/Logo';
import { signOutAction } from '@/app/actions';

export const metadata: Metadata = { title: 'Painel | Nexora AI' };

type Business = { id: string; name: string };
type MembershipRow = {
  role: 'owner' | 'admin' | 'agent';
  businesses: Business | Business[] | null;
};

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

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase
      .from('business_members')
      .select('role, businesses(id, name)')
      .eq('user_id', user.id),
  ]);

  const rows = ((memberships ?? []) as unknown as MembershipRow[]).flatMap((m) => {
    const business = Array.isArray(m.businesses)
      ? m.businesses[0]
      : m.businesses;

    return business ? [{ role: m.role, business }] : [];
  });

  const displayName =
    (profile?.full_name as string | null | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split('@')[0] ||
    'Usuário';

  const firstName = displayName.trim().split(' ')[0];

  return (
    <div className="nx-dashboard">
      <aside className="nx-sidebar">
        <div className="nx-brand">
          <Logo href="/dashboard" />
          <span className="nx-brand-tag">BUSINESS AI</span>
        </div>

        <div className="nx-nav-label">MENU PRINCIPAL</div>

        <nav className="nx-nav">
          <a href="/dashboard" className="nx-nav-item active">
            <span className="nx-nav-icon">⌂</span>
            <span>Visão geral</span>
          </a>

          <div className="nx-nav-item nx-nav-disabled">
            <span className="nx-nav-icon">♙</span>
            <span>Clientes</span>
            <span className="nx-coming">Em breve</span>
          </div>

          <div className="nx-nav-item nx-nav-disabled">
            <span className="nx-nav-icon">▤</span>
            <span>Conversas</span>
            <span className="nx-coming">Em breve</span>
          </div>

          <div className="nx-nav-item nx-nav-disabled">
            <span className="nx-nav-icon">✧</span>
            <span>Automações</span>
            <span className="nx-coming">Em breve</span>
          </div>
        </nav>

        <div className="nx-nav-label nx-secondary-label">PREFERÊNCIAS</div>

        <nav className="nx-nav">
          <div className="nx-nav-item nx-nav-disabled">
            <span className="nx-nav-icon">⚙</span>
            <span>Configurações</span>
            <span className="nx-coming">Em breve</span>
          </div>
        </nav>

        <div className="nx-sidebar-bottom">
          <div className="nx-help-card">
            <div className="nx-help-icon">✦</div>
            <strong>Seu negócio mais inteligente.</strong>
            <p>Prepare-se para automatizar seu atendimento com IA.</p>
          </div>

          <div className="nx-profile">
            <div className="nx-avatar">
              {firstName.charAt(0).toUpperCase()}
            </div>

            <div className="nx-profile-info">
              <strong>{displayName}</strong>
              <span>{user.email}</span>
            </div>

            <form action={signOutAction}>
              <button
                type="submit"
                className="nx-logout"
                title="Sair da conta"
                aria-label="Sair da conta"
              >
                ↗
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main className="nx-main">
        <header className="nx-topbar">
          <div>
            <span className="nx-breadcrumb">Nexora AI / Painel</span>
            <h1>Visão geral</h1>
          </div>

          <div className="nx-top-actions">
            <span className="nx-status">
              <span className="nx-status-dot" />
              Sistema conectado
            </span>
            <div className="nx-top-avatar">
              {firstName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="nx-content">
          <section className="nx-welcome">
            <div className="nx-welcome-content">
              <span className="nx-eyebrow">SEU ESPAÇO DE GESTÃO</span>
              <h2>Olá, {firstName}!</h2>
              <p>
                Bem-vindo ao Nexora AI. Organize seu negócio e prepare-se
                para automatizar seus processos.
              </p>
            </div>
            <div className="nx-welcome-art" aria-hidden="true">
              <div className="nx-orbit nx-orbit-one" />
              <div className="nx-orbit nx-orbit-two" />
              <div className="nx-art-core">N</div>
              <span className="nx-art-spark">✦</span>
            </div>
          </section>

          <section className="nx-section">
            <div className="nx-section-heading">
              <div>
                <h2>Resumo da plataforma</h2>
                <p>Conheça os recursos disponíveis no seu espaço.</p>
              </div>
            </div>

            <div className="nx-stats">
              <article className="nx-stat-card">
                <div className="nx-stat-top">
                  <span>Empresas vinculadas</span>
                  <span className="nx-stat-icon blue">▦</span>
                </div>
                <strong>{rows.length}</strong>
                <small>Empresas na sua conta</small>
              </article>

              <article className="nx-stat-card">
                <div className="nx-stat-top">
                  <span>Conversas</span>
                  <span className="nx-stat-icon purple">▤</span>
                </div>
                <strong>—</strong>
                <small>Integração em preparação</small>
              </article>

              <article className="nx-stat-card">
                <div className="nx-stat-top">
                  <span>Automações</span>
                  <span className="nx-stat-icon cyan">✧</span>
                </div>
                <strong>—</strong>
                <small>Recurso em preparação</small>
              </article>

              <article className="nx-stat-card">
                <div className="nx-stat-top">
                  <span>Conta</span>
                  <span className="nx-stat-icon green">✓</span>
                </div>
                <strong className="nx-stat-account">
                  {user.email_confirmed_at ? 'Verificada' : 'Pendente'}
                </strong>
                <small>Confirmação do e-mail</small>
              </article>
            </div>
          </section>

          <div className="nx-lower-grid">
            <section className="nx-panel">
              <div className="nx-panel-heading">
                <div>
                  <h2>Minhas empresas</h2>
                  <p>Empresas associadas à sua conta.</p>
                </div>
                <span className="nx-count">{rows.length}</span>
              </div>

              {rows.length === 0 ? (
                <div className="nx-empty">
                  <div className="nx-empty-icon">▦</div>
                  <strong>Nenhuma empresa vinculada</strong>
                  <p>
                    Quando uma empresa estiver associada à sua conta,
                    ela aparecerá aqui.
                  </p>
                </div>
              ) : (
                <div className="nx-business-list">
                  {rows.map(({ role, business }) => (
                    <div className="nx-business" key={business.id}>
                      <div className="nx-business-icon">
                        {business.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="nx-business-info">
                        <strong>{business.name}</strong>
                        <span>Empresa vinculada</span>
                      </div>
                      <span className="nx-role">
                        {ROLE_LABEL[role]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="nx-panel">
              <div className="nx-panel-heading">
                <div>
                  <h2>Central de recursos</h2>
                  <p>O que está sendo preparado.</p>
                </div>
              </div>

              <div className="nx-resource-list">
                <div className="nx-resource">
                  <span className="nx-resource-icon">◉</span>
                  <div>
                    <strong>WhatsApp</strong>
                    <p>Conexão com atendimento empresarial.</p>
                  </div>
                  <span className="nx-resource-status">Planejado</span>
                </div>

                <div className="nx-resource">
                  <span className="nx-resource-icon purple">✧</span>
                  <div>
                    <strong>Inteligência artificial</strong>
                    <p>Assistente para automatizar tarefas.</p>
                  </div>
                  <span className="nx-resource-status">Planejado</span>
                </div>

                <div className="nx-resource">
                  <span className="nx-resource-icon cyan">⟳</span>
                  <div>
                    <strong>Automações</strong>
                    <p>Fluxos inteligentes para sua empresa.</p>
                  </div>
                  <span className="nx-resource-status">Planejado</span>
                </div>
              </div>
            </section>
          </div>

          <footer className="nx-footer">
            <span>© 2026 Nexora AI. Todos os direitos reservados.</span>
            <span>Automação inteligente para empresas.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
