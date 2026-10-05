begin;
alter table public.mixtapes add column origin text not null default 'friend' check(origin in ('friend','daily'));
create table public.music_preferences(user_id uuid primary key references auth.users(id) on delete cascade, artists jsonb not null default '[]'::jsonb, changes_used integer not null default 0 check(changes_used>=0), updated_at timestamptz not null default now());
create table public.daily_gifts(user_id uuid references auth.users(id) on delete cascade, day date not null, gift_id uuid not null unique, track_id text not null, artist_id text not null, identity text not null, format text not null, created_at timestamptz not null default now(), primary key(user_id,day));
create index cromix_daily_history on public.daily_gifts(user_id,created_at desc);
alter table public.daily_gifts add constraint cromix_daily_gift_fk foreign key(gift_id) references public.mixtapes(id) deferrable initially deferred;
alter table public.music_preferences enable row level security;
alter table public.daily_gifts enable row level security;
revoke all on public.music_preferences,public.daily_gifts from public,anon,authenticated;
grant select on public.music_preferences,public.daily_gifts to authenticated;
create policy music_preferences_read on public.music_preferences for select to authenticated using(user_id=auth.uid());
create policy daily_gifts_read on public.daily_gifts for select to authenticated using(user_id=auth.uid());

-- Progress is derived from immutable gifts. The client never writes XP or its level.
create function public.cromix_progress(p_user uuid) returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare sent integer; pieces integer; achievements integer; extra integer; lvl integer; prefs public.music_preferences; today uuid;
begin
  select count(*) into sent from public.mixtapes where sender_id=p_user and receiver_id<>p_user and origin='friend';
  select count(*) into pieces from public.mixtapes where receiver_id=p_user and opened;
  achievements:=(case when sent>=3 then 1 else 0 end)+(case when pieces>=10 then 1 else 0 end);
  extra:=greatest(sent-3,0)*5+greatest(pieces-10,0)*2;
  lvl:=1+achievements+(case when achievements=2 then extra/100 else 0 end);
  select * into prefs from public.music_preferences where user_id=p_user;
  select gift_id into today from public.daily_gifts where user_id=p_user and day=(now() at time zone 'UTC')::date;
  return jsonb_build_object('level',lvl,'slots',least(5,3+achievements),'sent',sent,'pieces',pieces,'extraXP',extra,'xpToNext',case when achievements=2 then 100-(extra%100) else null end,'changesAvailable',greatest(lvl-3-coalesce(prefs.changes_used,0),0),'artists',coalesce(prefs.artists,'[]'::jsonb),'onboarded',coalesce(jsonb_array_length(prefs.artists)>=3,false),'dailyGiftId',today,'nextDailyAt',((now() at time zone 'UTC')::date+1)::timestamp at time zone 'UTC');
end $$;
revoke all on function public.cromix_progress(uuid) from public,anon,authenticated;
create function public.get_music_progress() returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
begin if auth.uid() is null then raise exception 'Inicia sesión.'; end if; return public.cromix_progress(auth.uid()); end $$;
revoke all on function public.get_music_progress() from public,anon;
grant execute on function public.get_music_progress() to authenticated;

-- Only the Edge Function can save artists, after validating them with Spotify.
create function public.save_music_artists(p_user uuid,p_artists jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare prefs public.music_preferences; progress jsonb; old_count integer; new_count integer; replacements integer; additions integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text,2));
  if p_user is null or not exists(select 1 from auth.users where id=p_user) then raise exception 'Usuario inválido.'; end if;
  if p_artists is null or jsonb_typeof(p_artists)<>'array' then raise exception 'Elige tus artistas.'; end if;
  new_count:=jsonb_array_length(p_artists);
  if new_count not between 3 and 5 then raise exception 'Elige de 3 a 5 artistas.'; end if;
  if exists(select 1 from jsonb_array_elements(p_artists) artist where coalesce(artist->>'id','')!~'^[a-zA-Z0-9]{22}$' or length(coalesce(artist->>'name','')) not between 1 and 200) or (select count(distinct artist->>'id') from jsonb_array_elements(p_artists) artist)<>new_count then raise exception 'Elige artistas distintos y válidos.'; end if;
  select * into prefs from public.music_preferences where user_id=p_user;
  old_count:=coalesce(jsonb_array_length(prefs.artists),0);
  progress:=public.cromix_progress(p_user);
  if old_count=0 then
    if new_count<>3 then raise exception 'Empieza eligiendo exactamente 3 artistas.'; end if;
    insert into public.music_preferences(user_id,artists) values(p_user,p_artists);
  else
    if new_count<old_count then raise exception 'Conserva todos tus slots; puedes sustituir artistas al desbloquear un cambio.'; end if;
    if new_count>(progress->>'slots')::integer then raise exception 'Sube de nivel para desbloquear ese slot.'; end if;
    select count(*) into additions from jsonb_array_elements(p_artists) artist where not exists(select 1 from jsonb_array_elements(prefs.artists) old_artist where old_artist->>'id'=artist->>'id');
    replacements:=greatest(additions-(new_count-old_count),0);
    if replacements>(progress->>'changesAvailable')::integer then raise exception 'Necesitas un cambio de artista desbloqueado.'; end if;
    update public.music_preferences set artists=p_artists,changes_used=changes_used+replacements,updated_at=now() where user_id=p_user;
  end if;
  return public.cromix_progress(p_user);
end $$;
revoke all on function public.save_music_artists(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.save_music_artists(uuid,jsonb) to service_role;

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
      if new.receiver_id=actor then raise exception 'Elige a un amigo para enviar tu regalo.'; end if;
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

create function public.issue_daily_gift(p_user uuid,p_track jsonb,p_format text,p_artist_id text,p_identity text,p_day date) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare result uuid; prefs public.music_preferences;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text,3));
  select gift_id into result from public.daily_gifts where user_id=p_user and day=(now() at time zone 'UTC')::date;
  if result is not null then return result; end if;
  if p_day is distinct from (now() at time zone 'UTC')::date then raise exception 'El día cambió. Vuelve a abrir tu sobre.'; end if;
  select * into prefs from public.music_preferences where user_id=p_user;
  if coalesce(jsonb_array_length(prefs.artists),0)<3 or not exists(select 1 from jsonb_array_elements(prefs.artists) artist where artist->>'id'=p_artist_id) then raise exception 'Primero elige tus artistas favoritos.'; end if;
  if p_identity is null or length(p_identity) not between 1 and 300 then raise exception 'Canción inválida.'; end if;
  result:=gen_random_uuid();
  insert into public.daily_gifts(user_id,day,gift_id,track_id,artist_id,identity,format) values(p_user,p_day,result,p_track->>'id',p_artist_id,p_identity,p_format);
  insert into public.mixtapes(id,sender_id,receiver_id,track_name,artist_name,spotify_image_url,spotify_track_id,spotify_external_url,format_type,envelope_type,message,origin)
  values(result,p_user,p_user,p_track->>'name',p_track->>'artist',nullif(p_track->>'albumUrl',''),p_track->>'id','https://open.spotify.com/track/'||(p_track->>'id'),p_format,'medianoche','Una canción de tus artistas favoritos, elegida para tu colección de hoy.','daily');
  return result;
end $$;
revoke all on function public.issue_daily_gift(uuid,jsonb,text,text,text,date) from public,anon,authenticated;
grant execute on function public.issue_daily_gift(uuid,jsonb,text,text,text,date) to service_role;
commit;
