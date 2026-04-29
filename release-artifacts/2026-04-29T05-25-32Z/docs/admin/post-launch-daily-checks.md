# QMAPS — Post-Launch Daily Admin Checks

_Last reviewed: 2026-04-25_

A short daily walk for the admin on duty during the first weeks after
launch. Should take **10–15 minutes** end-to-end. Pair with
[`incident-response-playbook.md`](./incident-response-playbook.md).

> Tip: open `/admin` and keep the launch status tab handy.

---

## 1. New reviews flagged for moderation

- Open `/admin/review-moderation`
- Triage every entry with `status = pending` or `risk_level in (medium, high)`
- Hide / restore as needed; record reason
- Goal: queue back to **0 high-risk pending** by end of day

## 2. Business claims pending

- Open `/admin/businesses` → Claims tab
- Approve / reject every `business_claims` row in `pending`
- Reach out to claimant via support mailbox if evidence is missing
- See `business-claims-playbook.md`

## 3. Sponsored campaigns pending

- Open `/admin/sponsored`
- Review every `sponsored_campaigns` row in `pending_review`
- Approve, reject (with `admin_note`), or request changes
- See `sponsored-playbook.md`

## 4. Billing events / failed payments

- Open `/admin/launch-status` → Stripe section
- Review `merchant_billing_events` from the last 24h
- Investigate any `payment_failed` / `subscription_deleted` events
- Cross-check with Stripe dashboard webhook deliveries (100% 2xx target)
- See `billing-playbook.md`

## 5. Account deletion requests

- Open `/admin/account-deletions`
- Process every `account_deletion_requests` row in `pending`
- Move through the workflow in `account-deletion-support-workflow.md`
- Confirm audit rows written to `account_deletion_request_events`

## 6. Support inbox sweep

Check and reply (or assign) within the same business day:

- [ ] `support@qmaps.app`
- [ ] `privacy@qmaps.app`
- [ ] `abuse@qmaps.app`
- [ ] `business@qmaps.app`

## 7. App errors / user reports

- Skim edge function logs for 5xx in:
  - `stripe-webhook`
  - `create-merchant-checkout-session`
  - `create-merchant-billing-portal-session`
  - `analyze-review-risk`
- Skim `/admin/reports` for new abuse / content reports
- If volume spikes → escalate per
  [`incident-response-playbook.md`](./incident-response-playbook.md)

---

## End-of-day handoff note

Leave a one-line note for the next admin (chat or shared doc):

> _Day N — pending: X reviews, Y claims, Z sponsored, W deletions. Incidents: none / SEVx summary._
