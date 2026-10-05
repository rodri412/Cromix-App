-- Apply as one transaction in the SQL editor of the existing Supabase project.
-- Existing regalos, friendships and profiles are preserved. Access policies are replaced.
begin;
create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique, created_at timestamptz not null default now()
);
create table if not exists public.amigos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.perfiles(id) on delete cascade,
  friend_id uuid not null references public.perfiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.mixtapes (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.perfiles(id), receiver_id uuid not null references public.perfiles(id),
  track_name text not null, artist_name text not null, spotify_image_url text,
  format_type text not null default 'CASETE', opened boolean not null default false,
  message text not null default '', created_at timestamptz not null default now()
);
alter table public.mixtapes add column if not exists spotify_track_id text;
alter table public.mixtapes add column if not exists spotify_external_url text;
alter table public.mixtapes add column if not exists envelope_type text not null default 'kraft';
alter table public.mixtapes add column if not exists deliver_at timestamptz;
alter table public.mixtapes add column if not exists opened_at timestamptz;
-- Old format checks may only permit the original three formats.
do $$ declare item record; begin
  for item in select conname from pg_constraint where conrelid = 'public.mixtapes'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%format_type%' loop
    execute format('alter table public.mixtapes drop constraint %I', item.conname);
  end loop;
end $$;
alter table public.mixtapes add constraint cromix_format_check check (format_type in ('CASETE','CD','VINILO','MINIDISC')) not valid;
alter table public.mixtapes add constraint cromix_envelope_check check (envelope_type in ('kraft','rosa','medianoche','lavanda')) not valid;
create index if not exists cromix_received_idx on public.mixtapes(receiver_id, opened, created_at desc);
create index if not exists cromix_sent_idx on public.mixtapes(sender_id, created_at desc);
create index if not exists cromix_friends_idx on public.amigos(user_id, friend_id);

alter table public.mixtapes enable row level security;
alter table public.amigos enable row level security;
alter table public.perfiles enable row level security;
-- PostgreSQL ORs permissive policies; leaving old broad policies would defeat new protections.
do $$ declare item record; begin
  for item in select tablename, policyname from pg_policies where schemaname = 'public' and tablename in ('mixtapes','amigos','perfiles') loop
    execute format('drop policy %I on public.%I', item.policyname, item.tablename);
  end loop;
end $$;
create policy cromix_profile_read on public.perfiles for select to authenticated using (true);
create policy cromix_profile_insert on public.perfiles for insert to authenticated with check (id = (select auth.uid()));
create policy cromix_profile_update on public.perfiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy cromix_friend_read on public.amigos for select to authenticated using (user_id = (select auth.uid()));
create policy cromix_friend_insert on public.amigos for insert to authenticated with check (user_id = (select auth.uid()) and friend_id <> (select auth.uid()));
create policy cromix_friend_delete on public.amigos for delete to authenticated using (user_id = (select auth.uid()));
create policy cromix_gift_read on public.mixtapes for select to authenticated using (
  sender_id = (select auth.uid()) or (receiver_id = (select auth.uid()) and (deliver_at is null or deliver_at <= now()))
);
create policy cromix_gift_insert on public.mixtapes for insert to authenticated with check (
  sender_id = (select auth.uid()) and receiver_id <> sender_id and opened = false and
  exists (select 1 from public.amigos where user_id = (select auth.uid()) and friend_id = receiver_id)
);
create policy cromix_gift_open on public.mixtapes for update to authenticated using (
  receiver_id = (select auth.uid()) and (deliver_at is null or deliver_at <= now())
) with check (receiver_id = (select auth.uid()) and opened = true);
revoke all on public.mixtapes, public.amigos, public.perfiles from public, anon, authenticated;
grant select, insert, update on public.perfiles to authenticated;
grant select, insert, delete on public.amigos to authenticated;
grant select, insert, update on public.mixtapes to authenticated;
revoke all on public.mixtapes, public.amigos, public.perfiles from anon;

create or replace function public.cromix_guard_gift() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare actor uuid := auth.uid(); sent_count integer;
begin
  if tg_op = 'INSERT' then
    if actor is null or new.sender_id <> actor then raise exception 'Inicia sesión para enviar una canción.'; end if;
    perform pg_advisory_xact_lock(hashtextextended(actor::text, 0));
    select count(*) into sent_count from public.mixtapes where sender_id = actor and created_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
    if sent_count >= 3 then raise exception 'Ya usaste tus tres envíos de hoy. Mañana tienes tres nuevos.'; end if;
    if new.receiver_id = actor then raise exception 'Elige a un amigo para enviar tu regalo.'; end if;
    if not exists (select 1 from public.amigos where user_id = actor and friend_id = new.receiver_id) then raise exception 'Agrega primero a esa persona a tus amigos.'; end if;
    if length(trim(new.message)) not between 1 and 500 then raise exception 'Escribe una dedicatoria de hasta 500 caracteres.'; end if;
    if length(trim(new.track_name)) not between 1 and 200 or length(trim(new.artist_name)) not between 1 and 200 then raise exception 'Revisa el título y el artista de la canción.'; end if;
    if new.spotify_track_id is null or new.spotify_track_id !~ '^[a-zA-Z0-9]{22}$' or new.spotify_external_url is distinct from ('https://open.spotify.com/track/' || new.spotify_track_id) then raise exception 'Elige un enlace válido de Spotify.'; end if;
    if new.spotify_image_url is not null and new.spotify_image_url !~ '^https://i\.scdn\.co/image/[a-zA-Z0-9]+$' then raise exception 'La portada debe proceder de Spotify.'; end if;
    if new.deliver_at is not null and (new.deliver_at <= now() or new.deliver_at > now() + interval '1 year') then raise exception 'Programa tu regalo dentro del próximo año.'; end if;
    new.created_at := now(); new.opened := false; new.opened_at := null;
  else
    if actor is null or actor <> old.receiver_id or (old.deliver_at is not null and old.deliver_at > now()) then raise exception 'Este regalo todavía no se puede abrir.'; end if;
    if (to_jsonb(new) - 'opened' - 'opened_at') is distinct from (to_jsonb(old) - 'opened' - 'opened_at') then raise exception 'Solo puedes abrir este regalo; sus datos se conservan.'; end if;
    if not new.opened then raise exception 'Un recuerdo abierto no se puede volver a cerrar.'; end if;
    new.opened_at := coalesce(old.opened_at, now());
  end if;
  return new;
end $$;
drop trigger if exists cromix_guard_gift on public.mixtapes;
create trigger cromix_guard_gift before insert or update on public.mixtapes for each row execute function public.cromix_guard_gift();

create or replace function public.send_mixtape(p_recipient text, p_track_name text, p_artist_name text, p_image_url text,
  p_track_id text, p_external_url text, p_format text, p_envelope text, p_message text, p_deliver_at timestamptz default null)
returns public.mixtapes language plpgsql security invoker set search_path = public, pg_temp as $$
declare recipient uuid; result public.mixtapes;
begin
  if auth.uid() is null then raise exception 'Inicia sesión para enviar.'; end if;
  select id into recipient from public.perfiles where username = lower(trim(p_recipient));
  if recipient is null then raise exception 'No encontramos ese usuario.'; end if;
  insert into public.mixtapes(sender_id, receiver_id, track_name, artist_name, spotify_image_url, spotify_track_id,
    spotify_external_url, format_type, envelope_type, message, deliver_at, opened)
  values(auth.uid(), recipient, p_track_name, p_artist_name, p_image_url, p_track_id, p_external_url, p_format, p_envelope, trim(p_message), p_deliver_at, false)
  returning * into result;
  return result;
end $$;
revoke all on function public.send_mixtape(text,text,text,text,text,text,text,text,text,timestamptz) from public, anon;
grant execute on function public.send_mixtape(text,text,text,text,text,text,text,text,text,timestamptz) to authenticated;

-- Search throttling is independent of the client and protects the Spotify quota.
create table if not exists public.cromix_search_limits(user_id uuid primary key references auth.users(id) on delete cascade, bucket timestamptz not null, requests integer not null);
alter table public.cromix_search_limits enable row level security;
revoke all on public.cromix_search_limits from public, anon, authenticated;
create or replace function public.consume_music_search() returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare result integer; current_bucket timestamptz := date_trunc('minute', now());
begin
  if auth.uid() is null then return false; end if;
  insert into public.cromix_search_limits(user_id,bucket,requests) values(auth.uid(),current_bucket,1)
  on conflict(user_id) do update set bucket = excluded.bucket, requests = case when cromix_search_limits.bucket = excluded.bucket then cromix_search_limits.requests + 1 else 1 end
  returning requests into result;
  return result <= 25;
end $$;
revoke all on function public.consume_music_search() from public, anon;
grant execute on function public.consume_music_search() to authenticated;

create or replace function public.cromix_new_user() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare chosen text := lower(trim(new.raw_user_meta_data->>'username'));
begin
  if chosen ~ '^[a-z0-9_]{3,24}$' then insert into public.perfiles(id,username) values(new.id,chosen) on conflict(id) do nothing; end if;
  return new;
end $$;
drop trigger if exists cromix_new_user on auth.users;
create trigger cromix_new_user after insert on auth.users for each row execute function public.cromix_new_user();
-- Realtime is an optimization; app resume and periodic refresh also discover gifts.
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'mixtapes') then
    alter publication supabase_realtime add table public.mixtapes;
  end if;
end $$;
commit;
