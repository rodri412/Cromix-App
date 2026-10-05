begin;
-- Only the verified Cromix owner's immutable account gets this testing capability.
-- Usernames, profile labels and client-supplied admin flags cannot grant it.
create function public.can_add_self() returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select auth.uid()='e4142db2-3668-4b21-93f7-67d11eea63dd'::uuid
    and exists(select 1 from public.creator_accounts where user_id=auth.uid());
$$;
revoke all on function public.can_add_self() from public,anon;
grant execute on function public.can_add_self() to authenticated;

create or replace function public.get_music_progress() returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
  if auth.uid() is null then raise exception 'Inicia sesión.'; end if;
  return public.cromix_progress(auth.uid()) || jsonb_build_object('canAddSelf',public.can_add_self());
end $$;

drop policy cromix_friend_insert on public.amigos;
create policy cromix_friend_insert on public.amigos for insert to authenticated with check (
  user_id=(select auth.uid()) and (friend_id<>(select auth.uid()) or (select public.can_add_self()))
);
drop policy cromix_gift_insert on public.mixtapes;
create policy cromix_gift_insert on public.mixtapes for insert to authenticated with check (
  sender_id=(select auth.uid()) and (receiver_id<>sender_id or (select public.can_add_self())) and opened=false
  and exists(select 1 from public.amigos where user_id=(select auth.uid()) and friend_id=receiver_id)
);

create or replace function public.cromix_guard_gift() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid:=auth.uid(); sent_count integer;
begin
  if tg_op='INSERT' then
    if new.origin='daily' then
      if auth.role() is distinct from 'service_role' or new.sender_id<>new.receiver_id or not exists(select 1 from public.daily_gifts where user_id=new.receiver_id and gift_id=new.id and track_id=new.spotify_track_id and format=new.format_type and day=(now() at time zone 'UTC')::date) then raise exception 'El sobre diario lo prepara el servidor.'; end if;
    else
      if actor is null or new.sender_id<>actor then raise exception 'Inicia sesión para enviar una canción.'; end if;
      perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
      select count(*) into sent_count from public.mixtapes where sender_id=actor and origin='friend' and created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
      if sent_count>=3 then raise exception 'Ya usaste tus tres envíos de hoy. Mañana tienes tres nuevos.'; end if;
      if new.receiver_id=actor and not public.can_add_self() then raise exception 'Elige a un amigo para enviar tu regalo.'; end if;
      if not exists(select 1 from public.amigos where user_id=actor and friend_id=new.receiver_id) then raise exception 'Agrega primero a esa persona a tus amigos.'; end if;
    end if;
    if length(trim(new.message)) not between 1 and 500 then raise exception 'Escribe una dedicatoria de hasta 500 caracteres.'; end if;
    if length(trim(new.track_name)) not between 1 and 200 or length(trim(new.artist_name)) not between 1 and 200 then raise exception 'Revisa el título y el artista de la canción.'; end if;
    if new.spotify_track_id is null or new.spotify_track_id!~'^[a-zA-Z0-9]{22}$' or new.spotify_external_url is distinct from ('https://open.spotify.com/track/'||new.spotify_track_id) then raise exception 'Elige un enlace válido de Spotify.'; end if;
    if new.spotify_image_url is not null and new.spotify_image_url!~'^https://i\.scdn\.co/image/[a-zA-Z0-9]+$' then raise exception 'La portada debe proceder de Spotify.'; end if;
    if new.deliver_at is not null and (new.deliver_at<=now() or new.deliver_at>now()+interval '1 year') then raise exception 'Programa tu regalo dentro del próximo año.'; end if;
    new.created_at:=now(); new.opened:=false; new.opened_at:=null;
  else
    if actor is null or actor<>old.receiver_id or (old.deliver_at is not null and old.deliver_at>now()) then raise exception 'Este regalo todavía no se puede abrir.'; end if;
    if (to_jsonb(new)-'opened'-'opened_at') is distinct from (to_jsonb(old)-'opened'-'opened_at') then raise exception 'Solo puedes abrir este regalo; sus datos se conservan.'; end if;
    if not new.opened then raise exception 'Un recuerdo abierto no se puede volver a cerrar.'; end if;
    new.opened_at:=coalesce(old.opened_at,now());
  end if;
  return new;
end $$;
commit;
