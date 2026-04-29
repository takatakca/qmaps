# Admin playbook — Billing & subscriptions

_Phase 11. Internal use only._

## Scope
Operational handling of `merchant_subscriptions` and `merchant_billing_events`,
plus the Stripe edge functions:
- `create-merchant-checkout-session`
- `create-merchant-billing-portal-session`
- `stripe-webhook`

## Daily checks
1. Open Stripe dashboard → Webhooks → confirm `stripe-webhook` endpoint is
   delivering with no failures.
2. Spot-check 5 most recent `merchant_billing_events` rows to confirm the
   `event_type` and `metadata` look right.
3. Verify no `merchant_subscriptions.status = 'past_due'` is older than 7d
   without a follow-up note.

## Subscription lifecycle (read-only reference)
Stripe webhook updates `merchant_subscriptions` via these events:
- `checkout.session.completed` → status `active`, fill provider IDs.
- `customer.subscription.updated` → sync `plan`, `current_period_*`,
  `cancel_at_period_end`.
- `customer.subscription.deleted` → status `canceled`.
- `invoice.payment_failed` → status `past_due`.

Each transition writes a row to `merchant_billing_events`.

## Common operations

### Manual plan change (rare, support-led)
1. Cancel the current Stripe subscription via the customer portal session.
2. Have the merchant subscribe to the new price via `/merchant/billing`.
3. Verify the webhook updated `merchant_subscriptions.plan`.

### Refunds
- Process the refund in the Stripe dashboard.
- The webhook will record a `charge.refunded` row in
  `merchant_billing_events` automatically.
- If the refund covers a pause window for sponsored campaigns, also follow
  `docs/admin/sponsored-playbook.md` §Refunds.

### Switching from test to live
See `docs/deployment-checklist.md` §2 — never swap keys without:
- Updating `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
- Re-confirming live price IDs in `src/lib/billing.ts`.
- Running an end-to-end checkout in a private window.

## Disputes & chargebacks
1. Pull the affected `merchant_subscriptions.business_id`.
2. Pause any active sponsored campaigns for that business
   (see sponsored playbook).
3. Contact the merchant via `business@qmaps.app`.
4. Decide accept / contest the chargeback in Stripe within 7 days.
5. Log resolution as a free-text row in `merchant_billing_events`
   (`event_type = 'chargeback_resolution'`).

## Never
- Never write directly to `merchant_subscriptions` from the client.
- Never delete `merchant_billing_events` rows.
- Never share Stripe API keys outside of edge function secrets.
