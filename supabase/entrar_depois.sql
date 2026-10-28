-- ============================================================
--  IMPERIUM — permitir entrar numa sala com a partida em andamento
--  Rode este arquivo uma vez no Supabase (SQL Editor → New query → Run).
--  Ele só substitui a função room_join; nada é apagado.
-- ============================================================
create or replace function public.room_join(p_code text, p_name text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r public.rooms; d jsonb; s int := 0; used int[]; me uuid := auth.uid();
begin
  if me is null then raise exception 'login necessário'; end if;
  select * into r from public.rooms where code = p_code for update;
  if not found then return jsonb_build_object('error', 'notfound'); end if;
  d := r.data;
  if (d->'members') ? me::text then return d; end if;
  -- a sala aceita jogadores mesmo com a partida em andamento (quem chega depois entra num país da IA)
  select coalesce(array_agg((v->>'slot')::int), '{}') into used from jsonb_each(d->'members') as e(k, v);
  if coalesce(array_length(used, 1), 0) >= (d->>'maxPlayers')::int then return jsonb_build_object('error', 'full'); end if;
  while s = any(used) loop s := s + 1; end loop;
  d := jsonb_set(d, array['members', me::text], jsonb_build_object('name', p_name, 'slot', s, 'joinedAt', (extract(epoch from now()) * 1000)::bigint));
  d := jsonb_set(d, '{memberUids}', coalesce(d->'memberUids', '[]'::jsonb) || to_jsonb(me::text));
  d := jsonb_set(d, '{updatedAt}', to_jsonb((extract(epoch from now()) * 1000)::bigint));
  update public.rooms set data = d, member_uids = array_append(member_uids, me), updated_at = now() where code = p_code;
  return d;
end $$;
grant execute on function public.room_join(text, text) to authenticated;
