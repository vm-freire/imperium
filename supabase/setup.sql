-- ============================================================
--  IMPERIUM — Estrutura do banco no Supabase
--  Cole TUDO isto no Supabase → SQL Editor → New query → Run.
--  Pode rodar de novo sem problemas (é idempotente).
-- ============================================================

-- Perfis dos jogadores (nome e conquistas)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  trophies jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Salas
create table if not exists public.rooms (
  code text primary key,
  host uuid not null references auth.users(id) on delete cascade,
  member_uids uuid[] not null default '{}',
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Dados públicos de cada jogador numa sala
create table if not exists public.room_players (
  code text not null references public.rooms(code) on delete cascade,
  uid uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  primary key (code, uid)
);

-- Estado do mundo (publicado pelo anfitrião)
create table if not exists public.room_world (
  code text primary key references public.rooms(code) on delete cascade,
  turn int not null default 0,
  data jsonb not null
);

-- Salvamento privado de cada jogador
create table if not exists public.room_saves (
  code text not null references public.rooms(code) on delete cascade,
  uid uuid not null references auth.users(id) on delete cascade,
  json text not null,
  saved_at timestamptz not null default now(),
  primary key (code, uid)
);

-- Mensagens e eventos entre jogadores
create table if not exists public.room_events (
  id bigint generated always as identity primary key,
  code text not null references public.rooms(code) on delete cascade,
  ts bigint not null,
  from_uid uuid not null references auth.users(id) on delete cascade,
  data jsonb not null
);
create index if not exists room_events_code_ts on public.room_events (code, ts);
create index if not exists rooms_members on public.rooms using gin (member_uids);

-- ---------------- Segurança (Row Level Security) ----------------
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.room_world enable row level security;
alter table public.room_saves enable row level security;
alter table public.room_events enable row level security;

drop policy if exists "perfis: ler" on public.profiles;
drop policy if exists "perfis: criar o próprio" on public.profiles;
drop policy if exists "perfis: editar o próprio" on public.profiles;
create policy "perfis: ler" on public.profiles for select to authenticated using (true);
create policy "perfis: criar o próprio" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "perfis: editar o próprio" on public.profiles for update to authenticated using (id = auth.uid());

drop policy if exists "salas: ler" on public.rooms;
drop policy if exists "salas: criar" on public.rooms;
drop policy if exists "salas: atualizar" on public.rooms;
create policy "salas: ler" on public.rooms for select to authenticated using (true);
create policy "salas: criar" on public.rooms for insert to authenticated with check (host = auth.uid());
-- qualquer jogador logado pode atualizar (para entrar na sala com o código); o anfitrião avança os meses
create policy "salas: atualizar" on public.rooms for update to authenticated using (true);

drop policy if exists "jogadores: ler" on public.room_players;
drop policy if exists "jogadores: escrever o próprio" on public.room_players;
drop policy if exists "jogadores: atualizar o próprio" on public.room_players;
create policy "jogadores: ler" on public.room_players for select to authenticated using (true);
create policy "jogadores: escrever o próprio" on public.room_players for insert to authenticated with check (uid = auth.uid());
create policy "jogadores: atualizar o próprio" on public.room_players for update to authenticated using (uid = auth.uid());

drop policy if exists "mundo: ler" on public.room_world;
drop policy if exists "mundo: anfitrião cria" on public.room_world;
drop policy if exists "mundo: anfitrião atualiza" on public.room_world;
create policy "mundo: ler" on public.room_world for select to authenticated using (true);
create policy "mundo: anfitrião cria" on public.room_world for insert to authenticated
  with check (exists (select 1 from public.rooms r where r.code = room_world.code and r.host = auth.uid()));
create policy "mundo: anfitrião atualiza" on public.room_world for update to authenticated
  using (exists (select 1 from public.rooms r where r.code = room_world.code and r.host = auth.uid()));

drop policy if exists "saves: dono" on public.room_saves;
create policy "saves: dono" on public.room_saves for all to authenticated using (uid = auth.uid()) with check (uid = auth.uid());

drop policy if exists "eventos: ler" on public.room_events;
drop policy if exists "eventos: enviar" on public.room_events;
create policy "eventos: ler" on public.room_events for select to authenticated using (true);
create policy "eventos: enviar" on public.room_events for insert to authenticated with check (from_uid = auth.uid());

-- ---------------- Tempo real ----------------
do $$
begin
  begin alter publication supabase_realtime add table public.rooms; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.room_players; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.room_world; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.room_events; exception when duplicate_object then null; end;
end $$;

-- ---------------- Limpeza automática de eventos antigos (opcional) ----------------
-- Mantém o banco leve: apaga eventos com mais de 7 dias sempre que um novo chega.
create or replace function public.limpar_eventos() returns trigger language plpgsql security definer as $$
begin
  delete from public.room_events where ts < (extract(epoch from now()) * 1000)::bigint - 7*24*3600*1000;
  return new;
end $$;
drop trigger if exists trg_limpar_eventos on public.room_events;
create trigger trg_limpar_eventos after insert on public.room_events for each statement execute function public.limpar_eventos();
