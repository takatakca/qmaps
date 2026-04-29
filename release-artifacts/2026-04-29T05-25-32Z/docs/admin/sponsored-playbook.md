# Admin playbook — Sponsored campaigns

_Phase 11. Internal use only._

## Scope
Reviewing `sponsored_campaigns` from `/admin/sponsored` and monitoring
`sponsored_campaign_events` for fraud / abnormal activity.

## Campaign review (before going live)
For each `pending` campaign, verify:
- [ ] `headline` and `description` comply with content rules
      (no misleading claims, no prohibited categories).
- [ ] `target_city` / `target_category_id` are reasonable (not nationwide
      spam, not unrelated categories).
- [ ] `daily_budget_cents` matches the merchant's plan tier.
- [ ] The owning `business_id` belongs to a verified merchant
      (`is_claimed = true`, valid `merchant_subscriptions.status`).

Decisions:
- **Approve** → set `status = 'active'`, fill `reviewed_by` / `reviewed_at`.
- **Reject** → set `status = 'rejected'` with `admin_note` explaining why.
- **Pause** → set `status = 'paused'` (temporary, no rejection).

## Monitoring (daily)
- Run a quick read on `sponsored_campaign_events` for the last 24h:
  - Impressions per campaign.
  - Click-through rate.
  - Same-user repeated clicks → potential click fraud.
- Compare against `merchant_billing_events` to ensure billing is consistent.

## Anomaly response
| Pattern | Action |
|---------|--------|
| > 50 clicks from one user/session in 1h | Pause campaign, investigate |
| Impressions but zero clicks for 7d | Notify merchant, suggest changes |
| Sudden spike in CTR > 30% | Pause + manual review |

Always document the action in `admin_note` (free text). Never delete
`sponsored_campaign_events` — they are the fraud audit trail.

## Refunds
For confirmed fraudulent impressions/clicks billed to a merchant:
1. Pause the campaign.
2. Compute the affected window from event timestamps.
3. Issue a credit / refund via Stripe (handled out of UI).
4. Log a `merchant_billing_events` row with `event_type = 'manual_credit'`.

## Never
- Never modify `sponsored_campaign_events` rows.
- Never approve a campaign for an unclaimed business.
