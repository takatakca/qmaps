\set ON_ERROR_STOP on
begin;
do $$
declare
  admin_id uuid := gen_random_uuid();
  client_id uuid := gen_random_uuid();
  merchant_id uuid := gen_random_uuid();
  case_id uuid;
  merchant_case uuid;
  listing uuid;
  flag uuid;
begin
  insert into auth.users(id) values(admin_id),(client_id),(merchant_id);
  insert into public.user_roles(user_id,role) values(admin_id,'admin');
  insert into qmaps_private.accounts values
    (client_id,'qa-closure-'||client_id,'test','test'),(merchant_id,'qa-closure-'||merchant_id,'test','test');
  insert into qmaps_private.sessions values('qa-closure-'||client_id,client_id,now()+interval '1 day');
  perform set_config('qmaps.user_id', client_id::text, true);
  select id into strict case_id from public.qmaps_account_closure('request');
  perform set_config('qmaps.user_id', merchant_id::text, true);
  insert into public.businesses(name,city,address,owner_user_id) values('Essai fermeture', 'Laval', 'Fictif', merchant_id) returning id into listing;
  select id into strict merchant_case from public.qmaps_account_closure('request');
  perform set_config('qmaps.user_id', admin_id::text, true);
  -- Exercise reporter and administrator against the same record.
  perform set_config('qmaps.user_id',client_id::text,true);
  if not public.qmaps_report_listing(listing,'business','Essai du traitement') then raise exception 'Could not report listing'; end if;
  select id into strict flag from public.reports where reporter_user_id=client_id and target_id=listing;
  perform set_config('qmaps.user_id',admin_id::text,true);
  if not public.qmaps_moderate_listing(flag,'hide') or exists(select 1 from public.businesses where id=listing and is_active) then raise exception 'Reported listing still visible'; end if;
  -- The moderation audit may need manual retention processing. Test closure on a clean reporter identity.
  update public.reports set reporter_user_id=gen_random_uuid() where id=flag;
  if not public.qmaps_start_closure(merchant_case) or not public.qmaps_start_closure(case_id) then raise exception 'Cases not claimed'; end if;
  if public.qmaps_finish_closure(merchant_case) <> 'review_required' then raise exception 'Merchant data not held'; end if;
  if public.qmaps_finish_closure(case_id) <> 'completed' or public.qmaps_finish_closure(case_id) <> 'completed' then raise exception 'Close or retry failed'; end if;
  if exists(select 1 from auth.users where id=client_id) or exists(select 1 from qmaps_private.accounts where user_id=client_id)
     or exists(select 1 from qmaps_private.sessions where user_id=client_id) or exists(select 1 from public.profiles where id=client_id)
     then raise exception 'Identity or access survived deletion'; end if;
  if not exists(select 1 from public.account_deletion_requests where id=case_id and status='completed') or
    (select count(*) from public.account_deletion_request_events where request_id=case_id) <> 3 then raise exception 'Missing audit history'; end if;
end
$$;
rollback;
