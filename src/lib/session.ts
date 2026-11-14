import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type Role = 'owner' | 'admin' | 'agent';

export const ROLE_LABEL: Record<Role, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  agent: 'Atendente',
};

type Business = { id: string; name: string };
type MembershipRow = {
  role: Role;
  businesses: Business | Business[] | null;
};

/**
 * Contexto da sessão: usuário logado, empresas (RLS já filtra) e empresa ativa.
 * A empresa ativa é a mais antiga do usuário. Nunca vem de formulário ou URL.
 */
export async function getSessionContext() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase
      .from('business_members')
      .select('role, created_at, businesses(id, name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
  ]);

  const rows = ((memberships ?? []) as unknown as MembershipRow[]).flatMap((m) => {
    const business = Array.isArray(m.businesses) ? m.businesses[0] : m.businesses;
    return business ? [{ role: m.role, business }] : [];
  });

  const displayName =
    (profile?.full_name as string | null | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split('@')[0] ||
    'Usuário';

  const firstName = displayName.trim().split(' ')[0];
  const first = rows[0];
  const active = first ? { ...first.business, role: first.role } : null;

  return { supabase, user, displayName, firstName, rows, active };
}

export type SessionContext = Awaited<ReturnType<typeof getSessionContext>>;
