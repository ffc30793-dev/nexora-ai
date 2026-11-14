import Link from 'next/link';
import '@/styles/crm.css';
import { Logo } from '@/components/Logo';
import { signOutAction } from '@/app/actions';
import type { SessionContext } from '@/lib/session';

type NavKey = 'dashboard' | 'clientes' | 'conversas';

const NAV: { key: NavKey; href: string; icon: string; label: string }[] = [
  { key: 'dashboard', href: '/dashboard', icon: '⌂', label: 'Visão geral' },
  { key: 'clientes', href: '/clientes', icon: '♙', label: 'Clientes' },
  { key: 'conversas', href: '/conversas', icon: '▤', label: 'Conversas' },
];

export function AppShell({
  ctx,
  active,
  breadcrumb,
  title,
  children,
}: {
  ctx: SessionContext;
  active: NavKey;
  breadcrumb: string;
  title: string;
  children: React.ReactNode;
}) {
  const { user, displayName, firstName } = ctx;

  return (
    <div className="nx-dashboard">
      <aside className="nx-sidebar">
        <div className="nx-brand">
          <Logo href="/dashboard" />
          <span className="nx-brand-tag">BUSINESS AI</span>
        </div>

        <div className="nx-nav-label">MENU PRINCIPAL</div>

        <nav className="nx-nav">
          {NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`nx-nav-item${item.key === active ? ' active' : ''}`}
              aria-current={item.key === active ? 'page' : undefined}
            >
              <span className="nx-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}

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
            <div className="nx-avatar">{firstName.charAt(0).toUpperCase()}</div>

            <div className="nx-profile-info">
              <strong>{displayName}</strong>
              <span>{user.email}</span>
            </div>

            <form action={signOutAction}>
              <button type="submit" className="nx-logout" title="Sair da conta" aria-label="Sair da conta">
                ↗
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main className="nx-main">
        <header className="nx-topbar">
          <div>
            <span className="nx-breadcrumb">{breadcrumb}</span>
            <h1>{title}</h1>
          </div>

          <div className="nx-top-actions">
            <span className="nx-status">
              <span className="nx-status-dot" />
              Sistema conectado
            </span>
            <div className="nx-top-avatar">{firstName.charAt(0).toUpperCase()}</div>
            <form action={signOutAction} className="nx-logout-mobile">
              <button type="submit" className="btn btn-ghost">Sair</button>
            </form>
          </div>
        </header>

        <div className="nx-content">
          {children}

          <footer className="nx-footer">
            <span>© 2026 Nexora AI. Todos os direitos reservados.</span>
            <span>Automação inteligente para empresas.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
