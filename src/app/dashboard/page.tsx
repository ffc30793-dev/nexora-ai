import type { Metadata } from 'next';
import { AppShell } from '@/components/AppShell';
import { ROLE_LABEL, getSessionContext } from '@/lib/session';

export const metadata: Metadata = { title: 'Painel | Nexora AI' };

export default async function DashboardPage() {
  const ctx = await getSessionContext();
  const { user, firstName, rows } = ctx;

  return (
    <AppShell ctx={ctx} active="dashboard" breadcrumb="Nexora AI / Painel" title="Visão geral">
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
    </AppShell>
  );
}
