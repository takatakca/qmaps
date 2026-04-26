# QMAPS — Final Owner Sign-Off

_Last reviewed: 2026-04-25_

This is the **final human gate** before publishing QMAPS to production.
The automated Go / No-Go must be green (see
[`docs/final-launch-handoff.md`](./final-launch-handoff.md)) **and** every
section below must be checked and signed by the owner.

---

## 1. Owner approval checklist

- [ ] Reviewed [`docs/final-launch-handoff.md`](./final-launch-handoff.md)
- [ ] Reviewed [`docs/release-candidate-checklist.md`](./release-candidate-checklist.md)
- [ ] Reviewed [`docs/release-notes.md`](./release-notes.md)
- [ ] Reviewed latest [`docs/go-no-go-report.generated.json`](./go-no-go-report.generated.json) (decision = `GO`)
- [ ] Reviewed [`docs/release-status.generated.md`](./release-status.generated.md)

## 2. Manual production checks

- [ ] Production URL loads on desktop + mobile
- [ ] Sign-up + sign-in flows work end-to-end
- [ ] Business search returns results in target cities
- [ ] Review submission works and triggers moderation pipeline
- [ ] Account deletion request flow completes
- [ ] All five legal routes load unauthenticated
- [ ] `/release-notes` and `/sitemap.xml` resolve

## 3. Stripe live confirmation

- [ ] Stripe dashboard is in **Live** mode
- [ ] `STRIPE_SECRET_KEY` (live) set in Lovable Cloud
- [ ] `STRIPE_WEBHOOK_SECRET` (live) set in Lovable Cloud
- [ ] Webhook endpoint registered → `https://<project>.functions.supabase.co/stripe-webhook`
- [ ] One end-to-end live checkout + customer portal session verified
- [ ] Price IDs in `src/lib/billing.ts` match live Stripe prices

## 4. Domain / DNS / SSL confirmation

- [ ] Custom domain `qmaps.app` connected in Lovable
- [ ] DNS records propagated (A / CNAME as documented)
- [ ] SSL certificate status = **Active**
- [ ] `https://qmaps.app` redirects from `http://` automatically
- [ ] Canonical URLs in `<Seo>` reflect the live domain

## 5. Support mailbox confirmation

Daily monitoring confirmed for:

- [ ] `support@qmaps.app`
- [ ] `privacy@qmaps.app`
- [ ] `abuse@qmaps.app`
- [ ] `business@qmaps.app`

## 6. Rollback readiness

- [ ] Previous published version recorded for one-click rollback
- [ ] On-call contact agreed for first 72h post-launch
- [ ] Database migration freeze window agreed (no schema changes during launch)

---

## Final signature

| Field | Value |
|-------|-------|
| Release tag / version | _____________________________ |
| Owner name | _____________________________ |
| Owner signature | _____________________________ |
| Date (YYYY-MM-DD) | _____________________________ |
| Decision | ☐ GO 🚀  ☐ NO-GO 🛑 |
| Notes | _____________________________ |
