import { Logo } from './Logo';

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="auth-page">
      <Logo />
      <section className="card">
        <header className="card-header">
          <h1>{title}</h1>
          {subtitle ? <p className="muted">{subtitle}</p> : null}
        </header>
        {children}
      </section>
    </main>
  );
}
