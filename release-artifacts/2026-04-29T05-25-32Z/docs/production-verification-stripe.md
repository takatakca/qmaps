# QMAPS — Production verification: Stripe

_Last reviewed: 2026-04-26_

Step-by-step checklist for verifying Stripe in **Live** mode against the
production QMAPS deployment. Pair with sections **2. Stripe checkout +
customer portal** and **3. Stripe webhook deliveries** of
[`production-verification-log.md`](./production-verification-log.md).

> Do not run this checklist against test mode. Every step assumes Live.

---

## 1. Confirm Live mode

1. Open the Stripe dashboard.
2. Top-left environment switch must read **Live**.
3. Confirm the connected account is the QMAPS account, not a personal
   sandbox.

Record in log: section 2, row "Stripe in Live mode".

## 2. Confirm webhook endpoint

1. Stripe → **Developers → Webhooks**.
2. Endpoint URL must end with `/stripe-webhook`
   (e.g. `https://<project>.functions.supabase.co/stripe-webhook`).
3. Status must be **Enabled**.
4. Subscribed events should include at minimum:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

Record in log: section 3, row "Webhook endpoint registered".

## 3. Confirm webhook secret

1. In Stripe webhook details, copy the **Signing secret** (starts with
   `whsec_…`).
2. In Lovable Cloud → Functions → Environment variables, confirm
   `STRIPE_WEBHOOK_SECRET` matches the live signing secret.
3. Confirm `STRIPE_SECRET_KEY` is the live secret (starts with `sk_live_`).

Record in log: section 3, row "`STRIPE_WEBHOOK_SECRET` set (live)".

## 4. Send / replay one webhook event

1. Stripe → **Developers → Webhooks → <QMAPS endpoint> → Send test webhook**.
2. Pick `checkout.session.completed`. Click **Send test webhook**.
3. Verify response is `2xx`.
4. Verify a new row exists in `merchant_billing_events` using
   [`production-verification-sql.md`](./production-verification-sql.md)
   (snippet "Lookup a specific Stripe event by provider_event_id").

Record in log: section 3, rows "Manual replay one event" and
"`merchant_billing_events` row created".

## 5. Live checkout

1. From production QMAPS, log in as a merchant for a test business you
   own.
2. Open the upgrade flow and start a checkout for a paid plan.
3. Complete payment with a real card (refund afterwards if needed).
4. Confirm redirect back to QMAPS shows the upgraded plan.
5. Run the SQL snippet "Current subscription state for a business" from
   [`production-verification-sql.md`](./production-verification-sql.md)
   and confirm `plan` and `status` reflect the purchase.

Record in log: section 2, rows "Live checkout session", "Real card
purchase", "`merchant_subscriptions` updated".

## 6. Customer portal

1. From the merchant dashboard, open the billing portal link.
2. Confirm the Stripe-hosted portal loads with the active subscription.
3. Update the payment method or invoice email and confirm the change
   persists in Stripe.

Record in log: section 2, row "Customer portal opens".

## 7. Cancellation from portal

1. In the customer portal, click **Cancel plan**.
2. Confirm cancellation in Stripe (immediate or at period end per
   policy).
3. Wait for the webhook to fire, then re-run the
   `merchant_subscriptions` SQL snippet. Expect `cancel_at_period_end`
   or `status` updated.
4. Confirm the QMAPS merchant dashboard reflects the cancellation.

Record in log: section 2, row "Cancel from portal".

---

## What to do if anything fails

- Mark the row **FAIL** in the log and file in
  [`post-launch-issue-tracker.md`](./post-launch-issue-tracker.md).
- For repeated webhook 4xx/5xx, follow
  [`admin/incident-response-playbook.md`](./admin/incident-response-playbook.md)
  and check the `stripe-webhook` function logs.
- If Stripe is still in Test mode or the secret is missing, mark every
  Stripe row **BLOCKED** and list it in the **Owner action required**
  section of the log.
