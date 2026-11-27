\set ON_ERROR_STOP on
begin;

select gen_random_uuid() as merchant_id, gen_random_uuid() as admin_id \gset
insert into auth.users(id) values (:'merchant_id'), (:'admin_id');
insert into public.user_roles(user_id, role) values (:'admin_id', 'admin');
insert into public.businesses(name, city, address, owner_user_id)
  values ('Fiche de recette facturation', 'Laval', 'Adresse de recette', :'merchant_id')
  returning id as listing_id \gset
select set_config('qmaps.billing_test_listing_id', :'listing_id', true);
select set_config('qmaps.billing_test_merchant_id', :'merchant_id', true);

-- Grant INSERT within the test so it exercises RLS even when a gateway
-- exposes the table. The grants and fixture rows are rolled back.
grant select, insert on public.merchant_billing_events to authenticated;
alter role service_role bypassrls;

do $$
begin
  if has_function_privilege('anon', 'public.qmaps_apply_stripe_billing_event(text,text,uuid,uuid,jsonb,jsonb)', 'execute') then
    raise exception 'Anonymous users can execute the Stripe billing function';
  end if;
end;
$$;

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
do $$
begin
  perform public.qmaps_apply_stripe_billing_event(
    'evt_untrusted', 'invoice.paid', current_setting('qmaps.billing_test_listing_id')::uuid,
    current_setting('qmaps.billing_test_merchant_id')::uuid, '{}'::jsonb
  );
  raise exception 'Authenticated admin was allowed to call the Stripe billing function';
exception when insufficient_privilege then null;
end;
$$;

reset role;
set local role service_role;
do $$
declare
  listing_id uuid := current_setting('qmaps.billing_test_listing_id')::uuid;
  merchant_id uuid := current_setting('qmaps.billing_test_merchant_id')::uuid;
  subscription jsonb := '{
    "plan":"starter","status":"active","provider_customer_id":"cus_fixture",
    "provider_subscription_id":"sub_fixture","current_period_start":"2026-11-26T00:00:00Z",
    "current_period_end":"2026-12-26T00:00:00Z","cancel_at_period_end":false
  }'::jsonb;
  canceled_subscription jsonb := subscription || '{"status":"canceled","cancel_at_period_end":true}'::jsonb;
begin
  if not public.qmaps_apply_stripe_billing_event(
    'evt_fixture', 'customer.subscription.created', listing_id, merchant_id,
    '{"raw_type":"customer.subscription.created"}'::jsonb, subscription
  ) then
    raise exception 'New Stripe receipt was not processed';
  end if;
  if public.qmaps_apply_stripe_billing_event(
    'evt_fixture', 'customer.subscription.updated', listing_id, merchant_id,
    '{}'::jsonb, canceled_subscription
  ) then
    raise exception 'Duplicate Stripe receipt was processed';
  end if;
  if not exists (
    select 1 from public.merchant_subscriptions where business_id = listing_id
      and status = 'active' and not cancel_at_period_end
  ) then
    raise exception 'A duplicate Stripe receipt changed subscription state';
  end if;
  if not public.qmaps_apply_stripe_billing_event(
    'evt_invoice', 'invoice.paid', listing_id, merchant_id, '{}'::jsonb
  ) then
    raise exception 'Receipt-only Stripe event was not processed';
  end if;
  begin
    perform public.qmaps_apply_stripe_billing_event(
      'evt_retry', 'customer.subscription.updated', listing_id, merchant_id, '{}'::jsonb, '{}'::jsonb
    );
    raise exception 'Invalid Stripe subscription did not fail';
  exception when not_null_violation then null;
  end;
  if exists (
    select 1 from public.merchant_billing_events where provider = 'stripe' and provider_event_id = 'evt_retry'
  ) then
    raise exception 'Failed subscription write left a success receipt';
  end if;
  if not public.qmaps_apply_stripe_billing_event(
    'evt_retry', 'customer.subscription.updated', listing_id, merchant_id,
    '{}'::jsonb, canceled_subscription
  ) then
    raise exception 'Failed event did not process on retry';
  end if;
end;
$$;
reset role;
do $$
begin
  if (select count(*) from public.merchant_billing_events
       where provider = 'stripe' and provider_event_id = 'evt_fixture'
         and metadata = '{"raw_type":"customer.subscription.created"}'::jsonb) <> 1 then
    raise exception 'Duplicate delivery changed the original receipt';
  end if;
  if not exists (
    select 1 from public.merchant_subscriptions
    where business_id = current_setting('qmaps.billing_test_listing_id')::uuid
      and user_id = current_setting('qmaps.billing_test_merchant_id')::uuid
      and plan = 'starter' and provider = 'stripe' and status = 'canceled'
      and provider_customer_id = 'cus_fixture' and provider_subscription_id = 'sub_fixture'
      and current_period_start = '2026-11-26T00:00:00Z'::timestamptz
      and current_period_end = '2026-12-26T00:00:00Z'::timestamptz and cancel_at_period_end
  ) then
    raise exception 'Valid retry did not store the Stripe subscription state';
  end if;
end;
$$;
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
