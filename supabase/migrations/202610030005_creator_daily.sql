begin;
create table public.creator_accounts(user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.creator_accounts enable row level security;
revoke all on public.creator_accounts from public,anon,authenticated,service_role;
-- Pin the verified creator account by immutable ID, never by an editable username.
insert into public.creator_accounts(user_id) select id from auth.users where id='e4142db2-3668-4b21-93f7-67d11eea63dd';
alter table public.daily_gifts add column ordinal integer not null default 0 check(ordinal>=0);
alter table public.daily_gifts drop constraint daily_gifts_pkey;
alter table public.daily_gifts add primary key(user_id,day,ordinal);
create or replace function public.cromix_progress(p_user uuid) returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare sent integer; pieces integer; achievements integer; extra integer; lvl integer; prefs public.music_preferences; today uuid;
begin
  select count(*) into sent from public.mixtapes where sender_id=p_user and receiver_id<>p_user and origin='friend';
  select count(*) into pieces from public.mixtapes where receiver_id=p_user and opened;
  achievements:=(case when sent>=3 then 1 else 0 end)+(case when pieces>=10 then 1 else 0 end);
  extra:=greatest(sent-3,0)*5+greatest(pieces-10,0)*2;
  lvl:=1+achievements+(case when achievements=2 then extra/100 else 0 end);
  select * into prefs from public.music_preferences where user_id=p_user;
  select gift_id into today from public.daily_gifts where user_id=p_user and day=(now() at time zone 'UTC')::date order by created_at desc,ordinal desc limit 1;
  return jsonb_build_object('dailyUnlimited',exists(select 1 from public.creator_accounts where user_id=p_user),'level',lvl,'slots',least(5,3+achievements),'sent',sent,'pieces',pieces,'extraXP',extra,'xpToNext',case when achievements=2 then 100-(extra%100) else null end,'changesAvailable',greatest(lvl-3-coalesce(prefs.changes_used,0),0),'artists',coalesce(prefs.artists,'[]'::jsonb),'onboarded',coalesce(jsonb_array_length(prefs.artists)>=3,false),'dailyGiftId',today,'nextDailyAt',((now() at time zone 'UTC')::date+1)::timestamp at time zone 'UTC');
end $$;
create or replace function public.issue_daily_gift(p_user uuid,p_track jsonb,p_format text,p_artist_id text,p_identity text,p_day date) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare result uuid; prefs public.music_preferences; unlimited boolean; seq integer:=0;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text,3));
  unlimited:=exists(select 1 from public.creator_accounts where user_id=p_user);
  select gift_id into result from public.daily_gifts where user_id=p_user and day=(now() at time zone 'UTC')::date order by ordinal desc limit 1;
  if result is not null and not unlimited then return result; end if;
  if p_day is distinct from (now() at time zone 'UTC')::date then raise exception 'El día cambió. Vuelve a abrir tu sobre.'; end if;
  select * into prefs from public.music_preferences where user_id=p_user;
  if coalesce(jsonb_array_length(prefs.artists),0)<3 or not exists(select 1 from jsonb_array_elements(prefs.artists) artist where artist->>'id'=p_artist_id) then raise exception 'Primero elige tus artistas favoritos.'; end if;
  if p_identity is null or length(p_identity) not between 1 and 300 then raise exception 'Canción inválida.'; end if;
  if unlimited then select coalesce(max(ordinal),0)+1 into seq from public.daily_gifts where user_id=p_user and day=p_day; end if;
  result:=gen_random_uuid();
  insert into public.daily_gifts(user_id,day,gift_id,track_id,artist_id,identity,format,ordinal) values(p_user,p_day,result,p_track->>'id',p_artist_id,p_identity,p_format,seq);
  insert into public.mixtapes(id,sender_id,receiver_id,track_name,artist_name,spotify_image_url,spotify_track_id,spotify_external_url,format_type,envelope_type,message,origin)
  values(result,p_user,p_user,p_track->>'name',p_track->>'artist',nullif(p_track->>'albumUrl',''),p_track->>'id','https://open.spotify.com/track/'||(p_track->>'id'),p_format,'medianoche','Una canción de tus artistas favoritos, elegida para tu colección de hoy.','daily');
  return result;
end $$;
commit;
