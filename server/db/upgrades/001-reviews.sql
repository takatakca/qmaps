\set ON_ERROR_STOP on
begin;
grant select (id,business_id,user_id,rating,body,created_at,owner_reply,owner_replied_at,moderation_status)
  on public.reviews to authenticated, anon;
grant select (id, display_name) on public.profiles to authenticated, anon;
grant insert (business_id,user_id,rating,body), update (rating,body), delete
  on public.reviews to authenticated;

create or replace function public.qmaps_publish_owner_reply(place_id uuid, review_id uuid, response text)
returns boolean language plpgsql security definer set search_path='' as $$
declare changed_id uuid;
begin
  if auth.uid() is null or not exists (select 1 from public.businesses
      where id=place_id and owner_user_id=auth.uid() and is_active) then
    raise exception 'Accès propriétaire requis' using errcode='42501';
  end if;
  if response is null or length(trim(response)) not between 1 and 2000 then
    raise exception 'Réponse invalide' using errcode='23514';
  end if;
  update public.reviews set owner_reply=trim(response),owner_replied_at=now()
    where id=review_id and business_id=place_id and moderation_status in ('visible','trusted')
    returning id into changed_id;
  return changed_id is not null;
end;
$$;
revoke all on function public.qmaps_publish_owner_reply(uuid,uuid,text) from public;
grant execute on function public.qmaps_publish_owner_reply(uuid,uuid,text) to authenticated;
commit;
