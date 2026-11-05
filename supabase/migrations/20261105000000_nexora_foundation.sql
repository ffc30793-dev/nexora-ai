-- =====================================================================
-- Nexora AI — Pacote 02: fundação de autenticação e banco de dados
-- Multi-tenant (empresa = tenant) com RLS em todas as tabelas.
-- Execute uma única vez no SQL Editor do Supabase (ou via `supabase db push`).
-- Nenhuma chave/segredo é armazenado aqui.
-- =====================================================================

-- ---------- Tipos ----------
create type public.business_role as enum ('owner', 'admin', 'agent');

-- ---------- Funções utilitárias (sem acesso a dados) ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Impede mover uma linha para outra empresa (isolamento multi-tenant)
create or replace function public.prevent_business_id_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.business_id is distinct from old.business_id then
    raise exception 'business_id não pode ser alterado' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- ---------- Tabelas ----------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text check (full_name is null or char_length(full_name) between 1 and 100),
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.businesses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 2 and 120),
  created_by  uuid not null references auth.users (id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index businesses_created_by_idx on public.businesses (created_by);

create table public.business_members (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  role         public.business_role not null default 'agent',
  created_at   timestamptz not null default now(),
  unique (business_id, user_id)
);
create index business_members_user_idx on public.business_members (user_id);
-- No máximo um proprietário por empresa neste pacote
create unique index business_members_one_owner_idx
  on public.business_members (business_id) where role = 'owner';

create table public.whatsapp_accounts (
  id                   uuid primary key default gen_random_uuid(),
  business_id          uuid not null references public.businesses (id) on delete cascade,
  display_name         text not null check (char_length(display_name) between 1 and 100),
  phone_number         text,
  provider             text not null default 'pending',
  provider_account_id  text,
  status               text not null default 'disconnected'
                         check (status in ('disconnected', 'connecting', 'connected', 'error')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (id, business_id)
  -- Tokens/segredos do WhatsApp NÃO ficam aqui. Serão guardados
  -- em tabela/Vault acessível apenas pelo servidor (service role) no Pacote do WhatsApp.
);
create index whatsapp_accounts_business_idx on public.whatsapp_accounts (business_id);

create table public.contacts (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  name         text,
  phone        text not null check (char_length(phone) between 8 and 20),
  email        text,
  tags         text[] not null default '{}',
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (id, business_id),
  unique (business_id, phone)
);
create index contacts_business_created_idx on public.contacts (business_id, created_at desc);

create table public.conversations (
  id                    uuid primary key default gen_random_uuid(),
  business_id           uuid not null references public.businesses (id) on delete cascade,
  contact_id            uuid not null,
  whatsapp_account_id   uuid,
  status                text not null default 'open' check (status in ('open', 'pending', 'resolved')),
  assigned_to           uuid references auth.users (id) on delete set null,
  ai_enabled            boolean not null default true,
  last_message_at       timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (id, business_id),
  -- FKs compostas: contato/conta precisam ser da MESMA empresa
  foreign key (contact_id, business_id)
    references public.contacts (id, business_id) on delete cascade,
  foreign key (whatsapp_account_id, business_id)
    references public.whatsapp_accounts (id, business_id)
);
create index conversations_business_last_msg_idx on public.conversations (business_id, last_message_at desc nulls last);
create index conversations_contact_idx on public.conversations (contact_id);
create index conversations_assigned_idx on public.conversations (assigned_to) where assigned_to is not null;
create index conversations_whatsapp_idx on public.conversations (whatsapp_account_id) where whatsapp_account_id is not null;

create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references public.businesses (id) on delete cascade,
  conversation_id  uuid not null,
  direction        text not null check (direction in ('inbound', 'outbound')),
  sender_type      text not null check (sender_type in ('contact', 'agent', 'ai', 'system')),
  message_type     text not null default 'text',
  content          text,
  external_id      text,
  status           text not null default 'received'
                     check (status in ('received', 'queued', 'sent', 'delivered', 'read', 'failed')),
  created_at       timestamptz not null default now(),
  foreign key (conversation_id, business_id)
    references public.conversations (id, business_id) on delete cascade
);
create index messages_conversation_created_idx on public.messages (conversation_id, created_at);
create index messages_business_created_idx on public.messages (business_id, created_at desc);
create unique index messages_external_id_idx on public.messages (business_id, external_id) where external_id is not null;

create table public.ai_settings (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null unique references public.businesses (id) on delete cascade,
  enabled           boolean not null default false,
  language          text not null default 'pt-BR',
  tone              text not null default 'profissional',
  system_prompt     text,
  fallback_message  text,
  business_hours    jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table public.automations (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses (id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 120),
  trigger_type  text not null,
  conditions    jsonb not null default '{}'::jsonb,
  actions       jsonb not null default '[]'::jsonb,
  is_active     boolean not null default false,
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index automations_business_idx on public.automations (business_id);

create table public.usage_events (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  event_type   text not null,
  quantity     integer not null default 1 check (quantity >= 0),
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);
create index usage_events_business_created_idx on public.usage_events (business_id, created_at desc);

create table public.subscriptions (
  id                        uuid primary key default gen_random_uuid(),
  business_id               uuid not null unique references public.businesses (id) on delete cascade,
  plan                      text not null default 'free',
  status                    text not null default 'trialing'
                              check (status in ('trialing', 'active', 'past_due', 'canceled', 'incomplete')),
  trial_ends_at             timestamptz default (now() + interval '14 days'),
  current_period_end        timestamptz,
  provider                  text,
  provider_customer_id      text,
  provider_subscription_id  text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- ---------- Triggers de updated_at e de imutabilidade do tenant ----------
do $$
declare t text;
begin
  foreach t in array array['profiles','businesses','whatsapp_accounts','contacts','conversations',
                           'ai_settings','automations','subscriptions']
  loop
    execute format('create trigger set_updated_at before update on public.%I
                    for each row execute function public.set_updated_at()', t);
  end loop;

  foreach t in array array['whatsapp_accounts','contacts','conversations','messages',
                           'ai_settings','automations','usage_events','subscriptions','business_members']
  loop
    execute format('create trigger prevent_business_id_change before update on public.%I
                    for each row execute function public.prevent_business_id_change()', t);
  end loop;
end $$;

-- ---------- Funções seguras de permissão (SECURITY DEFINER, search_path vazio) ----------
create or replace function public.is_business_member(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.business_members m
    where m.business_id = p_business_id and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.has_business_role(p_business_id uuid, p_roles public.business_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.business_members m
    where m.business_id = p_business_id
      and m.user_id = (select auth.uid())
      and m.role = any (p_roles)
  );
$$;

create or replace function public.shares_business_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_members a
    join public.business_members b on b.business_id = a.business_id
    where a.user_id = (select auth.uid()) and b.user_id = p_user_id
  );
$$;

revoke all on function public.is_business_member(uuid) from public, anon;
revoke all on function public.has_business_role(uuid, public.business_role[]) from public, anon;
revoke all on function public.shares_business_with(uuid) from public, anon;
grant execute on function public.is_business_member(uuid) to authenticated;
grant execute on function public.has_business_role(uuid, public.business_role[]) to authenticated;
grant execute on function public.shares_business_with(uuid) to authenticated;

-- ---------- Triggers de cadastro ----------
-- 1) Após criar usuário em auth.users: cria perfil e (se informada) a empresa.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name     text := left(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 100);
  v_business text := left(btrim(coalesce(new.raw_user_meta_data ->> 'business_name', '')), 120);
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, nullif(v_name, ''))
  on conflict (id) do nothing;

  if char_length(v_business) >= 2 then
    insert into public.businesses (name, created_by) values (v_business, new.id);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Mantém o e-mail do perfil sincronizado com auth.users
create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.sync_profile_email();

-- 2) Após criar empresa: criador vira proprietário + cria configurações padrão.
create or replace function public.handle_new_business()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.business_members (business_id, user_id, role)
  values (new.id, new.created_by, 'owner');

  insert into public.ai_settings (business_id) values (new.id);
  insert into public.subscriptions (business_id) values (new.id);

  return new;
end;
$$;

create trigger on_business_created
  after insert on public.businesses
  for each row execute function public.handle_new_business();

-- ---------- Proteção contra escalada de privilégios em business_members ----------
create or replace function public.guard_business_members()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.user_id is distinct from old.user_id then
    raise exception 'user_id não pode ser alterado' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger guard_business_members
  before update on public.business_members
  for each row execute function public.guard_business_members();

-- ---------- Row Level Security ----------
alter table public.profiles          enable row level security;
alter table public.businesses        enable row level security;
alter table public.business_members  enable row level security;
alter table public.whatsapp_accounts enable row level security;
alter table public.contacts          enable row level security;
alter table public.conversations     enable row level security;
alter table public.messages          enable row level security;
alter table public.ai_settings       enable row level security;
alter table public.automations       enable row level security;
alter table public.usage_events      enable row level security;
alter table public.subscriptions     enable row level security;

-- Privilégios mínimos: anon não acessa nada; authenticated só o necessário.
do $$
declare t text;
begin
  foreach t in array array['profiles','businesses','business_members','whatsapp_accounts','contacts',
                           'conversations','messages','ai_settings','automations','usage_events','subscriptions']
  loop
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
  end loop;
end $$;

-- profiles: só nome e avatar são editáveis pelo usuário (e-mail vem do Auth)
grant update (full_name, avatar_url) on public.profiles to authenticated;
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.shares_business_with(id));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- businesses: nome editável por owner/admin; created_by é imutável
grant insert (name, created_by), update (name), delete on public.businesses to authenticated;
create policy businesses_select on public.businesses for select to authenticated
  using (created_by = (select auth.uid()) or public.is_business_member(id));
create policy businesses_insert on public.businesses for insert to authenticated
  with check (created_by = (select auth.uid()));
create policy businesses_update on public.businesses for update to authenticated
  using (public.has_business_role(id, array['owner','admin']::public.business_role[]))
  with check (public.has_business_role(id, array['owner','admin']::public.business_role[]));
create policy businesses_delete on public.businesses for delete to authenticated
  using (public.has_business_role(id, array['owner']::public.business_role[]));

-- business_members: ninguém vira owner pela API; admin só adiciona/remove agent
grant insert (business_id, user_id, role), update (role), delete on public.business_members to authenticated;
create policy members_select on public.business_members for select to authenticated
  using (public.is_business_member(business_id));
create policy members_insert on public.business_members for insert to authenticated
  with check (
    (role in ('admin', 'agent') and public.has_business_role(business_id, array['owner']::public.business_role[]))
    or (role = 'agent' and public.has_business_role(business_id, array['admin']::public.business_role[]))
  );
create policy members_update on public.business_members for update to authenticated
  using (role <> 'owner' and public.has_business_role(business_id, array['owner']::public.business_role[]))
  with check (role in ('admin', 'agent') and public.has_business_role(business_id, array['owner']::public.business_role[]));
create policy members_delete on public.business_members for delete to authenticated
  using (
    role <> 'owner' and (
      user_id = (select auth.uid())  -- sair da empresa
      or public.has_business_role(business_id, array['owner']::public.business_role[])
      or (role = 'agent' and public.has_business_role(business_id, array['admin']::public.business_role[]))
    )
  );

-- Tabelas de tenant: leitura por membros; escrita conforme o papel
do $$
declare
  t text;
  write_roles text;
  delete_roles text;
begin
  foreach t in array array['whatsapp_accounts','contacts','conversations','messages','ai_settings','automations']
  loop
    if t in ('contacts','conversations','messages') then
      write_roles  := $r$array['owner','admin','agent']::public.business_role[]$r$;
      delete_roles := $r$array['owner','admin']::public.business_role[]$r$;
    else
      write_roles  := $r$array['owner','admin']::public.business_role[]$r$;
      delete_roles := $r$array['owner','admin']::public.business_role[]$r$;
    end if;

    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_business_member(business_id))',
                   t || '_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.has_business_role(business_id, %s))',
                   t || '_insert', t, write_roles);
    execute format('create policy %I on public.%I for update to authenticated using (public.has_business_role(business_id, %s)) with check (public.has_business_role(business_id, %s))',
                   t || '_update', t, write_roles, write_roles);
    execute format('create policy %I on public.%I for delete to authenticated using (public.has_business_role(business_id, %s))',
                   t || '_delete', t, delete_roles);
  end loop;
end $$;

-- usage_events e subscriptions: somente leitura para membros.
-- Escrita apenas pelo servidor (service role), em pacotes futuros.
create policy usage_events_select on public.usage_events for select to authenticated
  using (public.is_business_member(business_id));
create policy subscriptions_select on public.subscriptions for select to authenticated
  using (public.is_business_member(business_id));
