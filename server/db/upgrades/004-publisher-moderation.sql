\set ON_ERROR_STOP on
begin;
alter table qmaps_private.accounts add column if not exists publication_terms text;
create table if not exists qmaps_private.publisher_blocks (
 id uuid primary key default gen_random_uuid(),
 viewer uuid not null references auth.users(id) on delete cascade,
 publisher uuid not null references auth.users(id) on delete cascade,
 label text not null,
 unique(viewer,publisher), check(viewer<>publisher)
);
grant select,insert,delete on qmaps_private.publisher_blocks to qmaps_gateway;
create or replace function public.qmaps_can_see_publisher(owner_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select not exists(select 1 from qmaps_private.publisher_blocks where viewer=auth.uid() and publisher=owner_id)
$$;
revoke all on function public.qmaps_can_see_publisher(uuid) from public;
grant execute on function public.qmaps_can_see_publisher(uuid) to anon,authenticated;

create or replace function public.qmaps_report_listing(place_id uuid, subject text, complaint text)
returns boolean language plpgsql security definer set search_path='' as $$
declare owner_id uuid; target uuid; viewer uuid:=auth.uid();
begin
 if viewer is null then raise insufficient_privilege; end if;
 if subject not in ('user','business') or complaint is null or length(trim(complaint)) not between 3 and 1000 then raise invalid_parameter_value; end if;
 select owner_user_id into owner_id from public.businesses where id=place_id and is_active;
 if not found or owner_id=viewer or (subject='user' and owner_id is null) then return false; end if;
 target:=case when subject='user' then owner_id else place_id end;
 perform pg_advisory_xact_lock(hashtextextended(viewer::text||target::text,0));
 if not exists(select 1 from public.reports where reporter_user_id=viewer and target_type=subject and target_id=target and status in ('open','reviewing')) then
  insert into public.reports(reporter_user_id,target_type,target_id,reason,details)
    values(viewer,subject,target,'other',trim(complaint));
 end if;
 return true;
end;
$$;
revoke all on function public.qmaps_report_listing(uuid,text,text) from public;
grant execute on function public.qmaps_report_listing(uuid,text,text) to authenticated;
grant select(id,target_type,target_id,reason,details,status,created_at) on public.reports to authenticated;

create or replace function public.qmaps_moderate_listing(report_id uuid, decision text)
returns boolean language plpgsql security definer set search_path='' as $$
declare item public.reports%rowtype;
begin
 if public.has_role(auth.uid(),'admin') is not true then raise insufficient_privilege; end if;
 if decision not in ('dismiss','hide') then raise invalid_parameter_value; end if;
 select * into item from public.reports where id=report_id and status in ('open','reviewing') and target_type in ('business','user') for update;
 if not found then return false; end if;
 if decision='hide' then
   if item.target_type='business' then update public.businesses set is_active=false where id=item.target_id;
   else
     if public.has_role(item.target_id,'admin') then raise insufficient_privilege; end if;
     update public.businesses set is_active=false where owner_user_id=item.target_id;
     update qmaps_private.accounts set publication_terms='suspended' where user_id=item.target_id;
   end if;
 end if;
 update public.reports set status=case when decision='hide' then 'resolved' else 'dismissed' end,reviewed_at=now(),reviewed_by=auth.uid() where id=report_id;
 return true;
end;
$$;
revoke all on function public.qmaps_moderate_listing(uuid,text) from public;
grant execute on function public.qmaps_moderate_listing(uuid,text) to authenticated;
commit;
