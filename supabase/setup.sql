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

-- ---------------- Salvamentos da conta (jogo solo, histórico e conquistas) ----------------
create table if not exists public.user_saves (
  uid uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value text not null,
  updated_at timestamptz not null default now(),
  primary key (uid, key)
);
alter table public.user_saves enable row level security;
drop policy if exists "saves da conta: dono" on public.user_saves;
create policy "saves da conta: dono" on public.user_saves for all to authenticated using (uid = auth.uid()) with check (uid = auth.uid());

-- ---------------- Multiplayer: operações atômicas ----------------
-- Evitam que duas gravações ao mesmo tempo apaguem dados (ex.: a nação escolhida sumir).

-- mescla dois JSONs em profundidade (objetos são combinados; o resto é substituído)
create or replace function public.jsonb_deep_merge(a jsonb, b jsonb) returns jsonb
language plpgsql immutable as $$
declare k text; out jsonb;
begin
  if a is null or jsonb_typeof(a) <> 'object' or jsonb_typeof(b) <> 'object' then return b; end if;
  out := a;
  for k in select jsonb_object_keys(b) loop
    out := jsonb_set(out, array[k], public.jsonb_deep_merge(a->k, b->k), true);
  end loop;
  return out;
end $$;

-- altera campos da sala sem sobrescrever o resto
create or replace function public.room_patch(p_code text, p_patch jsonb) returns void
language plpgsql security invoker as $$
begin
  update public.rooms set data = public.jsonb_deep_merge(data, p_patch), updated_at = now() where code = p_code;
end $$;

-- entra na sala reservando uma vaga de forma segura (duas pessoas não pegam a mesma vaga)
create or replace function public.room_join(p_code text, p_name text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r public.rooms; d jsonb; s int := 0; used int[]; me uuid := auth.uid();
begin
  if me is null then raise exception 'login necessário'; end if;
  select * into r from public.rooms where code = p_code for update;
  if not found then return jsonb_build_object('error', 'notfound'); end if;
  d := r.data;
  if (d->'members') ? me::text then return d; end if;
  if d->>'status' <> 'lobby' then return jsonb_build_object('error', 'started'); end if;
  select coalesce(array_agg((v->>'slot')::int), '{}') into used from jsonb_each(d->'members') as e(k, v);
  if coalesce(array_length(used, 1), 0) >= (d->>'maxPlayers')::int then return jsonb_build_object('error', 'full'); end if;
  while s = any(used) loop s := s + 1; end loop;
  d := jsonb_set(d, array['members', me::text], jsonb_build_object('name', p_name, 'slot', s, 'joinedAt', (extract(epoch from now()) * 1000)::bigint));
  d := jsonb_set(d, '{memberUids}', coalesce(d->'memberUids', '[]'::jsonb) || to_jsonb(me::text));
  d := jsonb_set(d, '{updatedAt}', to_jsonb((extract(epoch from now()) * 1000)::bigint));
  update public.rooms set data = d, member_uids = array_append(member_uids, me), updated_at = now() where code = p_code;
  return d;
end $$;

-- grava os dados públicos do jogador mesclando com o que já existe
create or replace function public.room_player_patch(p_code text, p_patch jsonb) returns void
language plpgsql security invoker as $$
begin
  insert into public.room_players (code, uid, data) values (p_code, auth.uid(), p_patch)
  on conflict (code, uid) do update set data = public.room_players.data || excluded.data;
end $$;

-- se o anfitrião sumir por mais de 90 s, outro jogador da sala assume o comando do mundo
create or replace function public.room_take_host(p_code text) returns boolean
language plpgsql security definer set search_path = public as $$
declare r public.rooms; me uuid := auth.uid(); seen bigint;
begin
  select * into r from public.rooms where code = p_code for update;
  if not found or not (me = any(r.member_uids)) then return false; end if;
  if r.host = me then return true; end if;
  select coalesce((data->>'lastSeen')::bigint, 0) into seen from public.room_players where code = p_code and uid = r.host;
  if coalesce(seen, 0) > (extract(epoch from now()) * 1000)::bigint - 90000 then return false; end if;
  update public.rooms set host = me, data = jsonb_set(data, '{host}', to_jsonb(me::text)), updated_at = now() where code = p_code;
  return true;
end $$;

grant execute on function public.room_patch(text, jsonb) to authenticated;
grant execute on function public.room_join(text, text) to authenticated;
grant execute on function public.room_player_patch(text, jsonb) to authenticated;
grant execute on function public.room_take_host(text) to authenticated;

-- ---------------- Excluir sala (só o anfitrião) ----------------
-- Mundo, jogadores, salvamentos e eventos da sala são apagados junto (on delete cascade).
drop policy if exists "salas: anfitrião exclui" on public.rooms;
create policy "salas: anfitrião exclui" on public.rooms for delete to authenticated using (host = auth.uid());
