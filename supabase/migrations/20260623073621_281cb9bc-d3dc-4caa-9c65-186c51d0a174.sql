
create type public.app_role as enum ('admin', 'client');
create type public.client_tipo as enum ('pmi','startup_pre','startup_scale','holding','immobiliare');
create type public.file_type as enum ('bilancio_verifica','mastrini','nota_integrativa');
create type public.file_status as enum ('pending','processing','done','error');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "users read own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  piva text,
  tipo public.client_tipo not null default 'pmi',
  ateco text,
  email text unique,
  invited_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.clients to authenticated;
grant all on public.clients to service_role;
alter table public.clients enable row level security;

create table public.client_users (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (client_id, user_id)
);
grant select, insert, update, delete on public.client_users to authenticated;
grant all on public.client_users to service_role;
alter table public.client_users enable row level security;

create or replace function public.user_owns_client(_client_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.client_users where client_id = _client_id and user_id = auth.uid())
$$;

create policy "clients admin all" on public.clients for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "clients linked read" on public.clients for select to authenticated
  using (public.user_owns_client(id));
create policy "client_users admin all" on public.client_users for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "client_users self read" on public.client_users for select to authenticated
  using (user_id = auth.uid());

create table public.client_kpi_config (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  kpi_key text not null,
  visible boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (client_id, kpi_key)
);
grant select, insert, update, delete on public.client_kpi_config to authenticated;
grant all on public.client_kpi_config to service_role;
alter table public.client_kpi_config enable row level security;
create policy "kpi_config admin all" on public.client_kpi_config for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "kpi_config client read" on public.client_kpi_config for select to authenticated
  using (public.user_owns_client(client_id));

create table public.uploaded_files (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  file_name text not null,
  file_type public.file_type not null,
  periodo text,
  storage_path text,
  size_bytes bigint,
  source text not null default 'manuale',
  status public.file_status not null default 'pending',
  uploaded_at timestamptz not null default now()
);
grant select, insert, update, delete on public.uploaded_files to authenticated;
grant all on public.uploaded_files to service_role;
alter table public.uploaded_files enable row level security;
create policy "files admin all" on public.uploaded_files for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "files client read" on public.uploaded_files for select to authenticated
  using (public.user_owns_client(client_id));

create table public.trial_balance (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  file_id uuid references public.uploaded_files(id) on delete set null,
  periodo text not null,
  sezione text,
  codice_conto text,
  descrizione text,
  dare numeric not null default 0,
  avere numeric not null default 0,
  saldo numeric not null default 0,
  created_at timestamptz not null default now()
);
create index on public.trial_balance(client_id, periodo);
grant select, insert, update, delete on public.trial_balance to authenticated;
grant all on public.trial_balance to service_role;
alter table public.trial_balance enable row level security;
create policy "tb admin all" on public.trial_balance for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "tb client read" on public.trial_balance for select to authenticated
  using (public.user_owns_client(client_id));

create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  file_id uuid references public.uploaded_files(id) on delete set null,
  codice_conto text,
  descrizione_conto text,
  sottoconto_id text,
  sottoconto_desc text,
  data_registrazione date,
  n_registrazione text,
  descrizione text,
  n_documento text,
  dare numeric not null default 0,
  avere numeric not null default 0,
  saldo_progressivo numeric not null default 0
);
create index on public.ledger_entries(client_id, codice_conto, data_registrazione);
grant select, insert, update, delete on public.ledger_entries to authenticated;
grant all on public.ledger_entries to service_role;
alter table public.ledger_entries enable row level security;
create policy "ledger admin all" on public.ledger_entries for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "ledger client read" on public.ledger_entries for select to authenticated
  using (public.user_owns_client(client_id));

create table public.kpi_snapshots (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  periodo text not null,
  kpi_key text not null,
  valore numeric,
  delta_pct numeric,
  calcolato_at timestamptz not null default now(),
  unique (client_id, periodo, kpi_key)
);
grant select, insert, update, delete on public.kpi_snapshots to authenticated;
grant all on public.kpi_snapshots to service_role;
alter table public.kpi_snapshots enable row level security;
create policy "kpi admin all" on public.kpi_snapshots for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "kpi client read visible" on public.kpi_snapshots for select to authenticated
  using (public.user_owns_client(client_id) and exists (
    select 1 from public.client_kpi_config c
    where c.client_id = kpi_snapshots.client_id and c.kpi_key = kpi_snapshots.kpi_key and c.visible = true
  ));

create table public.advisor_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  testo text not null,
  ai_generated boolean not null default false,
  autore text not null default 'Consulting/34 Studio STP',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.advisor_notes to authenticated;
grant all on public.advisor_notes to service_role;
alter table public.advisor_notes enable row level security;
create policy "notes admin all" on public.advisor_notes for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "notes client read" on public.advisor_notes for select to authenticated
  using (public.user_owns_client(client_id));

create table public.drive_connections (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  folder_path text,
  folder_name text,
  file_type text,
  last_checked timestamptz
);
grant select, insert, update, delete on public.drive_connections to authenticated;
grant all on public.drive_connections to service_role;
alter table public.drive_connections enable row level security;
create policy "drive admin all" on public.drive_connections for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "drive client read" on public.drive_connections for select to authenticated
  using (public.user_owns_client(client_id));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare matched_client uuid;
begin
  select id into matched_client from public.clients where lower(email) = lower(new.email);
  if matched_client is not null then
    insert into public.user_roles(user_id, role) values (new.id, 'client') on conflict do nothing;
    insert into public.client_users(client_id, user_id) values (matched_client, new.id) on conflict do nothing;
  end if;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
