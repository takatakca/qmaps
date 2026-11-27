-- Existing Stripe receipts must be unique before this migration is applied.
create unique index uq_merchant_billing_events_stripe_event
  on public.merchant_billing_events (provider_event_id)
  where provider = 'stripe' and provider_event_id is not null;

create function public.qmaps_apply_stripe_billing_event(
  p_event_id text,
  p_event_type text,
  p_business_id uuid,
  p_user_id uuid,
  p_metadata jsonb,
  p_subscription jsonb default null
) returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if nullif(btrim(p_event_id), '') is null then
    raise invalid_parameter_value using message = 'Stripe event ID is required';
  end if;

  insert into public.merchant_billing_events
    (business_id, user_id, event_type, provider, provider_event_id, metadata)
  values (p_business_id, p_user_id, p_event_type, 'stripe', p_event_id, p_metadata)
  on conflict (provider_event_id)
    where provider = 'stripe' and provider_event_id is not null
    do nothing;

  if not found then
    return false;
  end if;

  if p_subscription is not null then
    insert into public.merchant_subscriptions (
      business_id, user_id, plan, status, provider, provider_customer_id,
      provider_subscription_id, current_period_start, current_period_end,
      cancel_at_period_end
    )
    values (
      p_business_id, p_user_id, p_subscription->>'plan', p_subscription->>'status',
      'stripe', p_subscription->>'provider_customer_id',
      p_subscription->>'provider_subscription_id',
      (p_subscription->>'current_period_start')::timestamptz,
      (p_subscription->>'current_period_end')::timestamptz,
      coalesce((p_subscription->>'cancel_at_period_end')::boolean, false)
    )
    on conflict (business_id) do update
      set user_id = excluded.user_id,
          plan = excluded.plan,
          status = excluded.status,
          provider = excluded.provider,
          provider_customer_id = excluded.provider_customer_id,
          provider_subscription_id = excluded.provider_subscription_id,
          current_period_start = excluded.current_period_start,
          current_period_end = excluded.current_period_end,
          cancel_at_period_end = excluded.cancel_at_period_end;
  end if;

  return true;
end;
$$;

revoke all on function public.qmaps_apply_stripe_billing_event(text, text, uuid, uuid, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.qmaps_apply_stripe_billing_event(text, text, uuid, uuid, jsonb, jsonb)
  to service_role;

grant select (id, provider, provider_event_id),
      insert (business_id, user_id, event_type, provider, provider_event_id, metadata)
  on public.merchant_billing_events to service_role;
grant select (business_id, user_id, plan, status, provider, provider_customer_id,
              provider_subscription_id, current_period_start, current_period_end,
              cancel_at_period_end),
      insert (business_id, user_id, plan, status, provider, provider_customer_id,
              provider_subscription_id, current_period_start, current_period_end,
              cancel_at_period_end),
      update (user_id, plan, status, provider, provider_customer_id,
              provider_subscription_id, current_period_start, current_period_end,
              cancel_at_period_end)
  on public.merchant_subscriptions to service_role;
