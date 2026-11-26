-- Stripe receipts are written by the signature-verifying webhook as service_role.
-- The existing merchant and admin policies still authorize manual entries.
create policy "Reserve Stripe billing receipts for service writes"
  on public.merchant_billing_events
  as restrictive
  for insert to authenticated
  with check (lower(btrim(provider)) is distinct from 'stripe');
