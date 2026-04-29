# QMAPS — Production Verification Log

_Last reviewed: 2026-04-26_

This log is filled in **by hand** during the production launch by the
on-call verifier. One row per check, dated and initialed. Pair with
[`post-launch-checklist.md`](./post-launch-checklist.md) and
[`admin/first-72-hours-monitoring.md`](./admin/first-72-hours-monitoring.md).

---

## How to complete this log

1. Work top to bottom. Each row maps to one verifiable behavior.
2. Fill in **Result**, **Date** (YYYY-MM-DD), **Verifier** (initials), and
   an **Evidence link / screenshot** (URL, screenshot path, or `n/a`).
3. Use the status legend exactly:
   - **PASS** — observed working as expected.
   - **FAIL** — observed broken. File in
     [`post-launch-issue-tracker.md`](./post-launch-issue-tracker.md).
   - **N/A** — check not applicable to this launch (explain in Notes).
   - **BLOCKED** — cannot be verified yet (missing access, DNS not
     propagated, Stripe not Live, etc.). List in section
     "Owner action required" at the bottom.
4. When every row is PASS or N/A, sign the **Final verifier sign-off**.
5. Companion docs:
   - SQL snippets → [`production-verification-sql.md`](./production-verification-sql.md)
   - Stripe steps → [`production-verification-stripe.md`](./production-verification-stripe.md)
   - Mobile / PWA steps → [`production-verification-mobile.md`](./production-verification-mobile.md)
   - Email mailbox tests → [`production-verification-email-tests.md`](./production-verification-email-tests.md)

> Status legend: `PASS` · `FAIL` · `N/A` · `BLOCKED`

---

## 1. Domain / DNS / SSL

| Check | Expected | Result | Date | Verifier | Evidence link / screenshot | Notes |
|-------|----------|--------|------|----------|----------------------------|-------|
| `qmaps.app` resolves | A / CNAME per Lovable docs |  |  |  |  |  |
| `https://qmaps.app` loads | 200 OK |  |  |  |  |  |
| HTTP → HTTPS redirect | 301 to https |  |  |  |  |  |
| SSL certificate valid | Active, not self-signed |  |  |  |  |  |
| `www.qmaps.app` behaviour | redirect or 200 (decided) |  |  |  |  |  |

## 2. Stripe checkout + customer portal

Detailed steps: [`production-verification-stripe.md`](./production-verification-stripe.md).

| Check | Expected | Result | Date | Verifier | Evidence link / screenshot | Notes |
|-------|----------|--------|------|----------|----------------------------|-------|
| Stripe in Live mode | Dashboard says **Live** |  |  |  |  |  |
| Live checkout session | 200, redirects to Stripe |  |  |  |  |  |
| Real card purchase | Succeeds end-to-end |  |  |  |  |  |
| `merchant_subscriptions` updated | Plan upgraded |  |  |  |  |  |
| Customer portal opens | 200, shows subscription |  |  |  |  |  |
| Cancel from portal | Status updates in app |  |  |  |  |  |

## 3. Stripe webhook deliveries

| Check | Expected | Result | Date | Verifier | Evidence link / screenshot | Notes |
|-------|----------|--------|------|----------|----------------------------|-------|
| Webhook endpoint registered | `…/stripe-webhook` |  |  |  |  |  |
| `STRIPE_WEBHOOK_SECRET` set (live) | Yes |  |  |  |  |  |
| Last 24h delivery success | 100% 2xx |  |  |  |  |  |
| Manual replay one event | 2xx |  |  |  |  |  |
| `merchant_billing_events` row created | Yes |  |  |  |  |  |

## 4. Supabase edge functions

| Function | Expected | Result | Date | Verifier | Evidence link / screenshot | Notes |
|----------|----------|--------|------|----------|----------------------------|-------|
| `stripe-webhook` | 2xx on real event |  |  |  |  |  |
| `create-merchant-checkout-session` | 2xx |  |  |  |  |  |
| `create-merchant-billing-portal-session` | 2xx |  |  |  |  |  |
| `analyze-review-risk` | 2xx, score returned |  |  |  |  |  |
| Logs free of repeated 5xx | Yes |  |  |  |  |  |

## 5. Sponsored ads

| Check | Expected | Result | Date | Verifier | Evidence link / screenshot | Notes |
|-------|----------|--------|------|----------|----------------------------|-------|
| Approved campaign serves on `/search` | Visible |  |  |  |  |  |
| Approved campaign serves on category page | Visible |  |  |  |  |  |
| `impression` event recorded | Row in `sponsored_campaign_events` |  |  |  |  |  |
| `click` event recorded | Row in `sponsored_campaign_events` |  |  |  |  |  |
| Admin can pause/reject from `/admin/sponsored` | Status updates |  |  |  |  |  |

## 6. Review moderation

| Check | Expected | Result | Date | Verifier | Evidence link / screenshot | Notes |
|-------|----------|--------|------|----------|----------------------------|-------|
| New review creates `review_trust_scores` row | Yes |  |  |  |  |  |
| Risk-scored review surfaces in `/admin/review-moderation` | Yes |  |  |  |  |  |
| Admin can hide review | `moderation_status = hidden` |  |  |  |  |  |
| Admin can restore review | `moderation_status = visible` |  |  |  |  |  |
| `review_moderation_actions` audit row written | Yes |  |  |  |  |  |

## 7. Account deletion

| Check | Expected | Result | Date | Verifier | Evidence link / screenshot | Notes |
|-------|----------|--------|------|----------|----------------------------|-------|
| User submits request from `/settings/delete-account` | 200 |  |  |  |  |  |
| Request appears in `/admin/account-deletions` | Yes |  |  |  |  |  |
| Status transitions through workflow | per docs |  |  |  |  |  |
| `account_deletion_request_events` audit row | Yes |  |  |  |  |  |

## 8. Support mailboxes

Test templates: [`production-verification-email-tests.md`](./production-verification-email-tests.md).

| Mailbox | Test email received | Replied | Date | Verifier | Evidence link / screenshot | Notes |
|---------|---------------------|---------|------|----------|----------------------------|-------|
| `support@qmaps.app` |  |  |  |  |  |  |
| `privacy@qmaps.app` |  |  |  |  |  |  |
| `abuse@qmaps.app` |  |  |  |  |  |  |
| `business@qmaps.app` |  |  |  |  |  |  |

## 9. Mobile / PWA install

Detailed steps: [`production-verification-mobile.md`](./production-verification-mobile.md).

| Check | Expected | Result | Date | Verifier | Evidence link / screenshot | Notes |
|-------|----------|--------|------|----------|----------------------------|-------|
| Android Chrome install prompt | Works |  |  |  |  |  |
| Android standalone launch | Works |  |  |  |  |  |
| iOS Add to Home Screen | Works, icon correct |  |  |  |  |  |
| Bottom nav respects safe-area | Yes |  |  |  |  |  |
| No autozoom on input focus | Yes |  |  |  |  |  |
| Offline banner appears offline | Yes |  |  |  |  |  |

## 10. SEO / sitemap / robots

| Check | Expected | Result | Date | Verifier | Evidence link / screenshot | Notes |
|-------|----------|--------|------|----------|----------------------------|-------|
| `/robots.txt` resolves | 200, references `/sitemap.xml` |  |  |  |  |  |
| `/sitemap.xml` resolves | 200, includes legal + `/release-notes` |  |  |  |  |  |
| Per-route `<title>` < 60 chars | Yes |  |  |  |  |  |
| Per-route `<meta description>` < 160 chars | Yes |  |  |  |  |  |
| Canonical URLs use live domain | Yes |  |  |  |  |  |
| Lighthouse PWA = installable | Yes |  |  |  |  |  |

---

## Owner action required (BLOCKED rows)

List every row marked **BLOCKED** above with the action needed to unblock it.
A row stays here until it flips to PASS, FAIL, or N/A.

| Section / row | Reason BLOCKED | Owner action required | Owner | Target date | Resolved (date) |
|---------------|----------------|-----------------------|-------|-------------|-----------------|
|  |  |  |  |  |  |
|  |  |  |  |  |  |

Common blockers and the owner action to take:

- **Stripe rows BLOCKED** — switch Stripe dashboard to Live, set
  `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (live values) in Lovable
  Cloud, then rerun [`production-verification-stripe.md`](./production-verification-stripe.md).
- **Domain rows BLOCKED** — connect `qmaps.app` in Lovable, wait for SSL
  to go **Active**, then re-run section 1.
- **Mailbox rows BLOCKED** — confirm MX records and that the inboxes are
  monitored daily. Use [`production-verification-email-tests.md`](./production-verification-email-tests.md).
- **Mobile rows BLOCKED** — schedule a real-device pass with the steps in
  [`production-verification-mobile.md`](./production-verification-mobile.md).

---

## Final verifier sign-off

| Field | Value |
|-------|-------|
| Verifier name | _____________________________ |
| Verifier signature | _____________________________ |
| Date (YYYY-MM-DD) | _____________________________ |
| Sections all PASS or N/A? | ☐ Yes  ☐ No (see notes) |
| Outstanding issues filed in | [`post-launch-issue-tracker.md`](./post-launch-issue-tracker.md) |
| Final decision | ☐ GO 🚀  ☐ NO-GO 🛑 |
