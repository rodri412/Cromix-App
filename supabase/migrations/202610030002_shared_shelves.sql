begin;
create table public.shared_shelves(id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name)) between 1 and 60), owner_id uuid not null references public.perfiles(id), created_at timestamptz not null default now());
create table public.shelf_members(shelf_id uuid references public.shared_shelves(id) on delete cascade, user_id uuid references public.perfiles(id) on delete cascade, accepted boolean not null default false, primary key(shelf_id,user_id));
create table public.shelf_items(shelf_id uuid references public.shared_shelves(id) on delete cascade, gift_id uuid references public.mixtapes(id) on delete cascade, added_by uuid not null references public.perfiles(id), created_at timestamptz not null default now(), primary key(shelf_id,gift_id));
create index cromix_members_user on public.shelf_members(user_id,shelf_id);
create index cromix_shelf_gift on public.shelf_items(gift_id,shelf_id);
alter table public.shared_shelves enable row level security;
alter table public.shelf_members enable row level security;
alter table public.shelf_items enable row level security;
revoke all on public.shared_shelves,public.shelf_members,public.shelf_items from public,anon,authenticated;
grant select on public.shared_shelves,public.shelf_members,public.shelf_items to authenticated;

create function public.cromix_shelf_member(p_shelf uuid, p_accepted boolean default true) returns boolean
language sql stable security definer set search_path=public,pg_temp as $$
  select exists(select 1 from public.shelf_members where shelf_id=p_shelf and user_id=auth.uid() and (not p_accepted or accepted));
$$;
revoke all on function public.cromix_shelf_member(uuid,boolean) from public,anon;
grant execute on function public.cromix_shelf_member(uuid,boolean) to authenticated;
create policy shelf_read on public.shared_shelves for select to authenticated using(public.cromix_shelf_member(id,false));
create policy member_read on public.shelf_members for select to authenticated using(user_id=auth.uid() or public.cromix_shelf_member(shelf_id));
create policy item_read on public.shelf_items for select to authenticated using(public.cromix_shelf_member(shelf_id));

create function public.cromix_shared_gift(p_gift uuid) returns boolean
language sql stable security definer set search_path=public,pg_temp as $$
  select exists(select 1 from public.shelf_items i join public.shelf_members m on m.shelf_id=i.shelf_id where i.gift_id=p_gift and m.user_id=auth.uid() and m.accepted);
$$;
revoke all on function public.cromix_shared_gift(uuid) from public,anon;
grant execute on function public.cromix_shared_gift(uuid) to authenticated;
create policy cromix_shared_gift_read on public.mixtapes for select to authenticated using(opened and public.cromix_shared_gift(id));

create function public.create_shared_shelf(p_name text, p_friends uuid[]) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid:=auth.uid(); result uuid;
begin
  if actor is null then raise exception 'Inicia sesión para crear una repisa.'; end if;
  if length(trim(p_name)) not between 1 and 60 or p_name is null then raise exception 'Escribe un nombre de hasta 60 caracteres.'; end if;
  if coalesce(cardinality(p_friends),0) not between 1 and 10 then raise exception 'Elige de 1 a 10 amigos.'; end if;
  if exists(select 1 from unnest(p_friends) friend where friend is null or friend=actor or not exists(select 1 from public.amigos where user_id=actor and friend_id=friend)) then raise exception 'Solo puedes invitar a tus amigos.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(actor::text,1));
  if (select count(*) from public.shared_shelves where owner_id=actor) >= 20 then raise exception 'Puedes crear hasta 20 repisas.'; end if;
  insert into public.shared_shelves(name,owner_id) values(trim(p_name),actor) returning id into result;
  insert into public.shelf_members(shelf_id,user_id,accepted) values(result,actor,true);
  insert into public.shelf_members(shelf_id,user_id) select result,friend from (select distinct unnest(p_friends) friend) members;
  return result;
end $$;
create function public.accept_shared_shelf(p_shelf uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  update public.shelf_members set accepted=true where shelf_id=p_shelf and user_id=auth.uid();
  if not found then raise exception 'No tienes una invitación a esa repisa.'; end if;
end $$;
create function public.leave_shared_shelf(p_shelf uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if exists(select 1 from public.shared_shelves where id=p_shelf and owner_id=auth.uid()) then raise exception 'Eres quien creó esta repisa.'; end if;
  delete from public.shelf_items where shelf_id=p_shelf and added_by=auth.uid();
  delete from public.shelf_members where shelf_id=p_shelf and user_id=auth.uid();
end $$;
create function public.add_shelf_gift(p_shelf uuid,p_gift uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if not public.cromix_shelf_member(p_shelf) then raise exception 'Acepta la invitación a esta repisa primero.'; end if;
  if not exists(select 1 from public.mixtapes where id=p_gift and receiver_id=auth.uid() and opened and (deliver_at is null or deliver_at<=now())) then raise exception 'Solo puedes compartir canciones que recibiste y abriste.'; end if;
  insert into public.shelf_items(shelf_id,gift_id,added_by) values(p_shelf,p_gift,auth.uid()) on conflict do nothing;
end $$;
create function public.remove_shelf_gift(p_shelf uuid,p_gift uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  delete from public.shelf_items where shelf_id=p_shelf and gift_id=p_gift and added_by=auth.uid();
end $$;
revoke all on function public.create_shared_shelf(text,uuid[]),public.accept_shared_shelf(uuid),public.leave_shared_shelf(uuid),public.add_shelf_gift(uuid,uuid),public.remove_shelf_gift(uuid,uuid) from public,anon;
grant execute on function public.create_shared_shelf(text,uuid[]),public.accept_shared_shelf(uuid),public.leave_shared_shelf(uuid),public.add_shelf_gift(uuid,uuid),public.remove_shelf_gift(uuid,uuid) to authenticated;
commit;
