# QMAPS — Post-Launch Checklist

_Last reviewed: 2026-04-25_

This checklist drives the **first 72 hours** after publishing QMAPS to
production. It is owned by the launch on-call. Pair it with
[`admin/incident-response-playbook.md`](./admin/incident-response-playbook.md)
and [`admin/post-launch-daily-checks.md`](./admin/post-launch-daily-checks.md).

---

## First 1 hour (T+0 → T+60 min)

- [ ] Production URL `https://qmaps.app` loads on desktop + mobile
- [ ] HTTPS active, certificate valid, no mixed-content warnings
- [ ] `/`, `/search`, `/more`, `/auth` render without console errors
- [ ] Sign-up + sign-in succeed end-to-end
- [ ] At least one business detail page loads with reviews
- [ ] `/sitemap.xml` and `/robots.txt` resolve
- [ ] All five legal routes load unauthenticated
- [ ] No spike in 4xx/5xx in edge function logs
- [ ] On-call contact reachable

## First 24 hours

- [ ] Run `bun run go:no-go:report` against `main`; archive JSON
- [ ] Stripe live checkout: one real purchase verified end-to-end
- [ ] Stripe webhook deliveries succeeding (no failures in dashboard)
- [ ] Customer portal opens for an active subscriber
- [ ] At least one new review submitted by a real user, moderation pipeline ran
- [ ] At least one sponsored campaign placement event recorded
- [ ] Account deletion request flow tested with a throwaway account
- [ ] Support mailboxes (`support@`, `privacy@`, `abuse@`, `business@qmaps.app`) checked twice
- [ ] PWA installable on Android Chrome + iOS Add-to-Home-Screen
- [ ] No regressions reported on `/admin/launch-status`

## First 72 hours

- [ ] Daily walk of [`admin/post-launch-daily-checks.md`](./admin/post-launch-daily-checks.md)
- [ ] Review error rates trend (edge functions, client console reports)
- [ ] Review Stripe failure rate; investigate any declined payments
- [ ] Confirm no spam wave in reviews / sponsored campaigns / claims
- [ ] Mobile QA spot-check on a fresh device per
      [`mobile-qa-checklist.md`](./mobile-qa-checklist.md)
- [ ] Owner re-confirms `final-owner-signoff.md` still valid
- [ ] If any incident occurred: post-mortem filed under
      `admin/incident-response-playbook.md` workflow

## Stripe checkout verification

- [ ] Stripe dashboard in **Live** mode
- [ ] One real checkout completes and merchant sees plan upgrade
- [ ] `merchant_subscriptions` row created/updated for the buyer
- [ ] `merchant_billing_events` shows the corresponding event

## Webhook verification

- [ ] Webhook endpoint registered → `https://<project>.functions.supabase.co/stripe-webhook`
- [ ] Live `STRIPE_WEBHOOK_SECRET` set
- [ ] Last 24h of webhook deliveries: 100% 2xx
- [ ] Manual replay of one event from Stripe dashboard succeeds

## Sponsored ads verification

- [ ] At least one approved campaign serving on `/search` and category pages
- [ ] `sponsored_campaign_events` records `impression` + `click` events
- [ ] Admin can pause/reject a campaign from `/admin/sponsored`

## Review moderation verification

- [ ] New reviews receive a `review_trust_scores` row
- [ ] Admin can hide/restore a review from `/admin/review-moderation`
- [ ] AI risk scoring edge function (`analyze-review-risk`) returns 2xx

## Account deletion request verification

- [ ] User can submit a deletion request from `/settings/delete-account`
- [ ] Request appears in `/admin/account-deletions`
- [ ] Audit row written to `account_deletion_request_events`

## Support mailbox verification

- [ ] `support@qmaps.app` — test email received and replied
- [ ] `privacy@qmaps.app` — test email received
- [ ] `abuse@qmaps.app` — test email received
- [ ] `business@qmaps.app` — test email received

## Mobile / PWA install verification

- [ ] Android Chrome: install prompt works, app opens standalone
- [ ] iOS Safari: Add to Home Screen works, icon + splash correct
- [ ] Bottom nav respects safe-area insets
- [ ] No autozoom on input focus
- [ ] Offline banner appears when network is killed
