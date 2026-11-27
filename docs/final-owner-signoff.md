# QMAPS — Final Owner Sign-Off

_Last reviewed: 2026-11-27_

Use this form for the final launch decision, not as an additional approval
for an already authorized deployment. Review the automated results and
production evidence separately. See the [launch handoff](final-launch-handoff.md).

---

## 1. Owner approval checklist

- [ ] Reviewed [`docs/final-launch-handoff.md`](./final-launch-handoff.md)
- [ ] Reviewed the [Coolify deployment procedure](DEPLOYMENT.md)
- [ ] Reviewed [`docs/release-notes.md`](./release-notes.md)
- [ ] Reviewed latest [`docs/go-no-go-report.generated.json`](./go-no-go-report.generated.json) (decision = `GO`)
- [ ] Reviewed [`docs/release-status.generated.md`](./release-status.generated.md)
- [ ] Reviewed [`docs/production-verification-log.md`](./production-verification-log.md) and the verification companions:
  - [`docs/verification-authentifiee-qmaps.md`](./verification-authentifiee-qmaps.md)
  - [`docs/preproduction-verification-stripe-sandbox.md`](./preproduction-verification-stripe-sandbox.md)
  - [`docs/production-verification-mobile.md`](./production-verification-mobile.md)
  - [`docs/production-verification-email-tests.md`](./production-verification-email-tests.md)

## 2. Manual production checks

- [ ] Production URL loads on desktop + mobile
- [ ] Sign-up + sign-in flows work end-to-end
- [ ] Business search returns results in target cities
- [ ] Review submission works and triggers moderation pipeline
- [ ] Account deletion request flow completes
- [ ] All five legal routes load unauthenticated
- [ ] `/release-notes` and `/sitemap.xml` resolve

## 3. Stripe Sandbox verification

- [ ] Isolated QMAPS staging and its authorized Stripe Sandbox match.
- [ ] Checkout, customer portal and signed webhook pass in Sandbox, including persistence and duplicate delivery.
- [ ] No real payment was made during verification. Any future Live activation or payment needs separate authorization.

## 4. Domain / DNS / SSL confirmation

- [ ] `qmaps.ca` and `www.qmaps.ca` serve the expected web revision over HTTPS.
- [ ] API image revision confirmed independently on the API host and the web routes.
- [ ] Canonical URLs in `<Seo>` reflect the live domain.

## 5. Support mailbox confirmation

Daily monitoring confirmed for:

- [ ] `support@qmaps.ca`
- [ ] `privacy@qmaps.ca`
- [ ] `abuse@qmaps.ca`
- [ ] `business@qmaps.ca`

## 6. Rollback readiness

- [ ] Previous successful web and API deployments recorded separately.
- [ ] On-call contact agreed for first 72h post-launch
- [ ] The responsible operator has checked the rollback plan against the schema in place.

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
