create function pg_temp.check_that(ok boolean, explanation text) returns void language plpgsql as $$
begin if ok is not true then raise exception '%', explanation; end if; end $$;
set role authenticated;
set request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';
insert into public.business_content(business_id,kind,title,is_published) values
 ('20000000-0000-0000-0000-000000000001','post','Public',true),
 ('20000000-0000-0000-0000-000000000001','post','Brouillon',false),
 ('20000000-0000-0000-0000-000000000003','post','Fiche inactive',true);
insert into public.business_content(business_id,kind,title,link_url,is_published)
 values ('20000000-0000-0000-0000-000000000001','action','Réserver','https://example.org/reserver',true);
insert into public.guest_services(business_id,reservations,waitlist) values
 ('20000000-0000-0000-0000-000000000001',true,true),
 ('20000000-0000-0000-0000-000000000003',true,true);
do $$begin
  begin
    insert into public.business_content(business_id,kind,title,link_url) values ('20000000-0000-0000-0000-000000000001','action','Autre','https://example.org/a');
    raise exception 'Duplicate action accepted'; exception when unique_violation then null; end;
end$$;
reset role;
set request.jwt.claim.sub = '';
set role anon;
select pg_temp.check_that(count(*)=2,'Only published content of active businesses is public') from public.business_content;
select pg_temp.check_that(count(*)=1,'Draft businesses have no public guest service') from public.guest_services;
do $$begin
  begin perform id from public.guest_requests; raise exception 'Private guest list readable'; exception when insufficient_privilege then null; end;
end$$;
reset role;
set role authenticated;
set request.jwt.claim.sub = '10000000-0000-0000-0000-000000000003';
insert into public.guest_requests(business_id,kind,guest_name,party_size,requested_time) values
 ('20000000-0000-0000-0000-000000000001','reservation','Cliente',2,timezone('America/Toronto',now())+interval '1 day');
insert into public.guest_requests(business_id,kind,guest_name,party_size) values
 ('20000000-0000-0000-0000-000000000001','waitlist','Cliente',2);
do $$begin
  begin insert into public.guest_requests(business_id,kind,guest_name,party_size) values
    ('20000000-0000-0000-0000-000000000001','waitlist','Cliente',2);
    raise exception 'Duplicate waiting party'; exception when unique_violation then null; end;
  begin update public.guest_requests set status='accepted' where kind='reservation';
    raise exception 'Guest approved a request'; exception when insufficient_privilege then null; end;
  begin insert into public.guest_requests(business_id,kind,guest_name,party_size) values
    ('20000000-0000-0000-0000-000000000003','waitlist','Cliente',2);
    raise exception 'Inactive business admitted a guest'; exception when insufficient_privilege then null; end;
end$$;
update public.guest_requests set status='cancelled' where kind='waitlist';
set request.jwt.claim.sub = '10000000-0000-0000-0000-000000000002';
select pg_temp.check_that(count(*)=0,'Other merchant cannot read guest names') from public.guest_requests;
with changed as (update public.business_content set title='Other tenant' returning id)
 select pg_temp.check_that(count(*)=0,'Other merchant cannot edit content') from changed;
set request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';
select pg_temp.check_that(count(*)=2,'Owner sees the two guest requests') from public.guest_requests;
update public.guest_requests set status='accepted' where kind='reservation';
do $$begin
  begin update public.guest_requests set status='pending' where kind='reservation';
    raise exception 'Invalid transition accepted'; exception when check_violation then null; end;
end$$;
update public.guest_services set waitlist=false where business_id='20000000-0000-0000-0000-000000000001';
update public.business_content set is_published=false where kind='action';
set request.jwt.claim.sub = '10000000-0000-0000-0000-000000000003';
select pg_temp.check_that(count(*)=1,'Guest can see merchant confirmation') from public.guest_requests where status='accepted';
do $$begin
  begin insert into public.guest_requests(business_id,kind,guest_name,party_size) values
    ('20000000-0000-0000-0000-000000000001','waitlist','Cliente',3);
    raise exception 'Closed waitlist accepted a new party'; exception when insufficient_privilege then null; end;
end$$;
reset role;
set request.jwt.claim.sub = '';
set role anon;
select pg_temp.check_that(count(*)=0,'Unpublished action removed from listing') from public.business_content where kind='action';
reset role;
set role authenticated;
set request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';
do $$begin
  begin insert into public.business_mail(id,business_id,customer_id,merchant_id,body) values
    (gen_random_uuid(),'20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','Offre');
    raise exception 'Merchant started an unsolicited thread'; exception when insufficient_privilege then null; end;
end$$;
set request.jwt.claim.sub = '10000000-0000-0000-0000-000000000003';
insert into public.business_mail(id,business_id,customer_id,merchant_id,body) values
 (gen_random_uuid(),'20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','Question');
set request.jwt.claim.sub = '10000000-0000-0000-0000-000000000002';
select pg_temp.check_that(count(*)=0,'Separate merchant inbox is empty') from public.business_mail_threads;
set request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';
insert into public.business_mail(id,business_id,customer_id,merchant_id,body) values
 (gen_random_uuid(),'20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','Réponse');
set request.jwt.claim.sub = '10000000-0000-0000-0000-000000000003';
select pg_temp.check_that(count(*)=2,'Customer sees both messages') from public.business_mail;
select pg_temp.check_that(count(*)=1,'Inbox groups the conversation') from public.business_mail_threads;
reset role;
set role authenticated;
set request.jwt.claim.sub = '10000000-0000-0000-0000-000000000003';
insert into storage.objects values ('photos','customer-media/10000000-0000-0000-0000-000000000003/20000000-0000-0000-0000-000000000001/abab.jpg');
do $$begin
  begin insert into storage.objects values ('photos','customer-media/10000000-0000-0000-0000-000000000002/20000000-0000-0000-0000-000000000001/abab.jpg');
    raise exception 'Upload accepted outside customer folder'; exception when insufficient_privilege then null; end;
  begin insert into storage.objects values ('photos','customer-media/10000000-0000-0000-0000-000000000003/20000000-0000-0000-0000-000000000003/abab.jpg');
    raise exception 'Upload accepted on inactive listing'; exception when insufficient_privilege then null; end;
end$$;
reset role;
set role authenticated;
set request.jwt.claim.sub='10000000-0000-0000-0000-000000000003';
insert into public.business_endorsements(business_id,recommended) values('20000000-0000-0000-0000-000000000001',true);
update public.business_endorsements set recommended=false;
select pg_temp.check_that(count(*)=1,'Customer can update own recommendation') from public.business_endorsements where not recommended;
set request.jwt.claim.sub='10000000-0000-0000-0000-000000000002';
select pg_temp.check_that(count(*)=0,'Other user cannot read individual votes') from public.business_endorsements;
reset role;
