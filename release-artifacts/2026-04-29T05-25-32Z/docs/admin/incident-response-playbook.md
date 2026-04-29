# QMAPS — Incident Response Playbook

_Last reviewed: 2026-04-25_

This playbook governs how the QMAPS on-call team responds to production
incidents. It pairs with [`../post-launch-checklist.md`](../post-launch-checklist.md)
and [`post-launch-daily-checks.md`](./post-launch-daily-checks.md).

---

## Severity levels

| Level | Definition | Target ack | Target mitigation |
|------:|------------|-----------:|------------------:|
| **SEV1** | Full outage, data loss risk, payment processing broken, auth broken for all users, legal/privacy breach | 15 min | 1 hour |
| **SEV2** | Major feature broken (search, reviews, sponsored, billing portal) for many users; no data loss | 30 min | 4 hours |
| **SEV3** | Degraded UX or single-feature regression; workaround exists | 4 hours | 1 business day |
| **SEV4** | Cosmetic / low-impact issue, single user report | next business day | best-effort |

The on-call decides severity. **When in doubt, escalate up one level.**

---

## Common incident types

### 1. Payment outage (SEV1 / SEV2)

Symptoms: checkout fails, webhook 5xx, merchants stuck on free plan.

1. Check Stripe dashboard → Developers → Webhooks for failures.
2. Confirm `STRIPE_SECRET_KEY` (live) and `STRIPE_WEBHOOK_SECRET` are set in Lovable Cloud.
3. Inspect edge function logs for `stripe-webhook`,
   `create-merchant-checkout-session`, and
   `create-merchant-billing-portal-session`.
4. If a recent deploy caused it → see **Rollback decision tree** below.
5. Communicate in the support inbox; pause sponsored campaign approvals
   until billing is restored.

### 2. Login / auth outage (SEV1)

Symptoms: users cannot sign in or sign up.

1. Check Lovable Cloud auth status (`supabase--cloud_status`).
2. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env`.
3. Check OAuth providers (Google) — credentials still valid?
4. If schema change to `profiles` or trigger broke sign-ups → revert
   migration via Supabase migrations review + redeploy previous version.

### 3. Database / RLS issue (SEV1 / SEV2)

Symptoms: 403/permission errors, missing rows, RLS recursion.

1. Run `supabase--linter` and review warnings.
2. Inspect the failing query path (client console + edge function logs).
3. If a new RLS policy is the cause → revert that migration only;
   do **not** disable RLS on a public table.
4. Never alter reserved schemas (`auth`, `storage`, `realtime`, `vault`).

### 4. Bad review moderation action (SEV3)

Symptoms: a legitimate review was hidden or a harmful review is live.

1. Open `/admin/review-moderation` and locate the review.
2. Restore or hide as appropriate; record reason in the moderation log.
3. If automated AI scoring is misfiring repeatedly, raise a SEV2 and
   pause auto-hiding via the admin moderation queue.
4. See `admin/reviews-playbook.md` for the full moderation workflow.

### 5. Sponsored campaign abuse (SEV2 / SEV3)

Symptoms: misleading, illegal, or off-policy sponsored content live.

1. Open `/admin/sponsored`, set the campaign status to `rejected`.
2. Notify the merchant via the support mailbox.
3. Add an `admin_note` explaining the rejection.
4. See `admin/sponsored-playbook.md` for the full review workflow.

### 6. Legal / privacy request issue (SEV1 / SEV2)

Symptoms: account deletion stuck, data export request, regulator inquiry.

1. Open `/admin/account-deletions` and locate the request.
2. Follow `account-deletion-support-workflow.md` to the letter.
3. Privacy regulator inquiries → respond from `privacy@qmaps.app`
   within statutory deadline; loop in legal owner.

---

## Rollback decision tree

```
Incident detected
       │
       ▼
Was it caused by a deploy in the last 24h?
       │
   ┌───┴────┐
  YES       NO
   │         │
   ▼         ▼
Roll back   Patch forward
to previous (hotfix branch +
published   bun run go:no-go
version     before publish)
   │
   ▼
DB migration in that deploy?
   │
 ┌─┴─┐
YES  NO
 │    │
 ▼    ▼
Review  Safe to roll back
with    immediately via
supabase Lovable history
linter  (no service worker,
before  next reload picks
revert  it up)
```

> **Reminder:** rolling back the published version does **not** revert
> database state. Always review in-flight migrations with
> `supabase--linter` before re-publishing.

---

## Who to notify

| Audience | When | How |
|----------|------|-----|
| On-call owner | Every SEV1/SEV2 immediately | Direct contact (per `final-owner-signoff.md`) |
| Launch owner | SEV1 within 30 min, SEV2 within 4h | Email + chat |
| Affected users | SEV1 longer than 1h, or SEV2 affecting payments | Banner on `/`, post in support inbox |
| Merchants | Any payment/sponsored impact | Email from `business@qmaps.app` |
| Legal/privacy | Any privacy or regulator-facing incident | Email from `privacy@qmaps.app` |

## Post-incident

After mitigation, within **5 business days**:

1. Write a short post-mortem (what happened, root cause, fix, prevention).
2. Add the prevention item to the next phase backlog.
3. If it was caused by a missing check → extend
   `scripts/launch-checks.mjs` or `scripts/go-no-go.mjs` so the gate
   would have caught it.
