\set ON_ERROR_STOP on
begin;

select gen_random_uuid() as merchant_id, gen_random_uuid() as admin_id \gset
insert into auth.users(id) values (:'merchant_id'), (:'admin_id');
insert into public.user_roles(user_id, role) values (:'admin_id', 'admin');
insert into public.businesses(name, city, address, owner_user_id)
  values ('Fiche de recette facturation', 'Laval', 'Adresse de recette', :'merchant_id')
  returning id as listing_id \gset
select set_config('qmaps.billing_test_listing_id', :'listing_id', true);

-- Grant INSERT within the test so it exercises RLS even when a gateway
-- exposes the table. The grants and fixture rows are rolled back.
grant select, insert on public.merchant_billing_events to authenticated;
grant insert on public.merchant_billing_events to service_role;
alter role service_role bypassrls;

set local role authenticated;
select set_config('qmaps.user_id', :'merchant_id', true);
insert into public.merchant_billing_events(business_id, event_type) values (:'listing_id', 'manual_credit');
do $$
begin
  insert into public.merchant_billing_events(business_id, event_type, provider)
    values (current_setting('qmaps.billing_test_listing_id')::uuid, 'receipt_fixture', 'stripe');
  raise exception 'Authenticated merchant was allowed to write a Stripe receipt';
exception when insufficient_privilege then null;
end;
$$;

select set_config('qmaps.user_id', :'admin_id', true);
insert into public.merchant_billing_events(business_id, event_type) values (:'listing_id', 'manual_credit');
do $$
begin
  insert into public.merchant_billing_events(business_id, event_type, provider)
    values (current_setting('qmaps.billing_test_listing_id')::uuid, 'receipt_fixture', ' Stripe ');
  raise exception 'Authenticated admin was allowed to write a Stripe receipt';
exception when insufficient_privilege then null;
end;
$$;

reset role;
set local role service_role;
insert into public.merchant_billing_events(business_id, event_type, provider, provider_event_id)
  values (:'listing_id', 'receipt_fixture', 'stripe', 'evt_fixture');
reset role;
set local role authenticated;
select set_config('qmaps.user_id', :'merchant_id', true);
do $$
begin
  if not exists (
    select from public.merchant_billing_events
    where business_id = current_setting('qmaps.billing_test_listing_id')::uuid
      and provider = 'stripe' and provider_event_id = 'evt_fixture'
  ) then
    raise exception 'Merchant could not read the Stripe receipt from their own listing';
  end if;
end;
$$;
reset role;
rollback;
