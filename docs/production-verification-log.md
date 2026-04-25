# QMAPS — Production Verification Log

_Last reviewed: 2026-04-25_

This log is filled in **by hand** during the production launch by the
on-call verifier. One row per check, dated and initialed. Pair with
[`post-launch-checklist.md`](./post-launch-checklist.md) and
[`admin/first-72-hours-monitoring.md`](./admin/first-72-hours-monitoring.md).

> Status legend: `PASS` · `FAIL` · `N/A` · `BLOCKED`

---

## 1. Domain / DNS / SSL

| Check | Expected | Result | Date | Verifier | Notes |
|-------|----------|--------|------|----------|-------|
| `qmaps.app` resolves | A / CNAME per Lovable docs |  |  |  |  |
| `https://qmaps.app` loads | 200 OK |  |  |  |  |
| HTTP → HTTPS redirect | 301 to https |  |  |  |  |
| SSL certificate valid | Active, not self-signed |  |  |  |  |
| `www.qmaps.app` behaviour | redirect or 200 (decided) |  |  |  |  |

## 2. Stripe checkout + customer portal

| Check | Expected | Result | Date | Verifier | Notes |
|-------|----------|--------|------|----------|-------|
| Stripe in Live mode | Dashboard says **Live** |  |  |  |  |
| Live checkout session | 200, redirects to Stripe |  |  |  |  |
| Real card purchase | Succeeds end-to-end |  |  |  |  |
| `merchant_subscriptions` updated | Plan upgraded |  |  |  |  |
| Customer portal opens | 200, shows subscription |  |  |  |  |
| Cancel from portal | Status updates in app |  |  |  |  |

## 3. Stripe webhook deliveries

| Check | Expected | Result | Date | Verifier | Notes |
|-------|----------|--------|------|----------|-------|
| Webhook endpoint registered | `…/stripe-webhook` |  |  |  |  |
| `STRIPE_WEBHOOK_SECRET` set (live) | Yes |  |  |  |  |
| Last 24h delivery success | 100% 2xx |  |  |  |  |
| Manual replay one event | 2xx |  |  |  |  |
| `merchant_billing_events` row created | Yes |  |  |  |  |

## 4. Supabase edge functions

| Function | Expected | Result | Date | Verifier | Notes |
|----------|----------|--------|------|----------|-------|
| `stripe-webhook` | 2xx on real event |  |  |  |  |
| `create-merchant-checkout-session` | 2xx |  |  |  |  |
| `create-merchant-billing-portal-session` | 2xx |  |  |  |  |
| `analyze-review-risk` | 2xx, score returned |  |  |  |  |
| Logs free of repeated 5xx | Yes |  |  |  |  |

## 5. Sponsored ads

| Check | Expected | Result | Date | Verifier | Notes |
|-------|----------|--------|------|----------|-------|
| Approved campaign serves on `/search` | Visible |  |  |  |  |
| Approved campaign serves on category page | Visible |  |  |  |  |
| `impression` event recorded | Row in `sponsored_campaign_events` |  |  |  |  |
| `click` event recorded | Row in `sponsored_campaign_events` |  |  |  |  |
| Admin can pause/reject from `/admin/sponsored` | Status updates |  |  |  |  |

## 6. Review moderation

| Check | Expected | Result | Date | Verifier | Notes |
|-------|----------|--------|------|----------|-------|
| New review creates `review_trust_scores` row | Yes |  |  |  |  |
| Risk-scored review surfaces in `/admin/review-moderation` | Yes |  |  |  |  |
| Admin can hide review | `moderation_status = hidden` |  |  |  |  |
| Admin can restore review | `moderation_status = visible` |  |  |  |  |
| `review_moderation_actions` audit row written | Yes |  |  |  |  |

## 7. Account deletion

| Check | Expected | Result | Date | Verifier | Notes |
|-------|----------|--------|------|----------|-------|
| User submits request from `/settings/delete-account` | 200 |  |  |  |  |
| Request appears in `/admin/account-deletions` | Yes |  |  |  |  |
| Status transitions through workflow | per docs |  |  |  |  |
| `account_deletion_request_events` audit row | Yes |  |  |  |  |

## 8. Support mailboxes

| Mailbox | Test email received | Replied | Date | Verifier | Notes |
|---------|---------------------|---------|------|----------|-------|
| `support@qmaps.app` |  |  |  |  |  |
| `privacy@qmaps.app` |  |  |  |  |  |
| `abuse@qmaps.app` |  |  |  |  |  |
| `business@qmaps.app` |  |  |  |  |  |

## 9. Mobile / PWA install

| Check | Expected | Result | Date | Verifier | Notes |
|-------|----------|--------|------|----------|-------|
| Android Chrome install prompt | Works |  |  |  |  |
| Android standalone launch | Works |  |  |  |  |
| iOS Add to Home Screen | Works, icon correct |  |  |  |  |
| Bottom nav respects safe-area | Yes |  |  |  |  |
| No autozoom on input focus | Yes |  |  |  |  |
| Offline banner appears offline | Yes |  |  |  |  |

## 10. SEO / sitemap / robots

| Check | Expected | Result | Date | Verifier | Notes |
|-------|----------|--------|------|----------|-------|
| `/robots.txt` resolves | 200, references `/sitemap.xml` |  |  |  |  |
| `/sitemap.xml` resolves | 200, includes legal + `/release-notes` |  |  |  |  |
| Per-route `<title>` < 60 chars | Yes |  |  |  |  |
| Per-route `<meta description>` < 160 chars | Yes |  |  |  |  |
| Canonical URLs use live domain | Yes |  |  |  |  |
| Lighthouse PWA = installable | Yes |  |  |  |  |

---

## Final verifier sign-off

| Field | Value |
|-------|-------|
| Verifier name | _____________________________ |
| Verifier signature | _____________________________ |
| Date (YYYY-MM-DD) | _____________________________ |
| Sections all PASS? | ☐ Yes  ☐ No (see notes) |
| Outstanding issues filed in | [`post-launch-issue-tracker.md`](./post-launch-issue-tracker.md) |
| Final decision | ☐ GO 🚀  ☐ NO-GO 🛑 |
