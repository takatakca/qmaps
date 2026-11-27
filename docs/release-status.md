# QMAPS — Release Status (stakeholder-facing)

_Last reviewed: 2026-11-27_

This document is the **single page to share with non-technical
stakeholders** (founders, ops, partners) when reporting where the
release stands. A machine-generated snapshot of the same shape lives in
`docs/release-status.generated.md` (run `bun run release:status:file`
to refresh it).

---

## 1. Current release-candidate status

The QMAPS site is live. The site, PostgreSQL API, directory publication,
authenticated roles, billing and native applications each require their own
evidence. Follow [issue #17](https://github.com/takatakca/qmaps/issues/17)
for the latest verified status. A passing local or GitHub report does
not confirm that any component has been deployed.

## 2. Latest verification results

| Gate | Command | Expected |
|------|---------|----------|
| Static launch checks | `bun run launch:check` | 16/16 pass |
| Unit & smoke tests | `bunx vitest run` | all green |
| Production build | `bun run build` | succeeds, no fatal warnings |
| GitHub Actions CI | (push / PR) | green on release branch |

For machine-readable JSON: `bun run launch:check:json`.
For a generated markdown snapshot: `bun run release:status`.
For the full release gate JSON: [`docs/go-no-go-report.generated.json`](./go-no-go-report.generated.json)
(refresh with `bun run go:no-go:report`).

For the launch owner handoff pack and final sign-off form, see:

- [`docs/final-launch-handoff.md`](./final-launch-handoff.md)
- [`docs/final-owner-signoff.md`](./final-owner-signoff.md)
- [`docs/release-archive-index.md`](./release-archive-index.md)
- [`docs/release-artifact-process.md`](./release-artifact-process.md)

## 3. Manual launch blockers

- [ ] Confirm the deployed web and API SHA separately and verify pagination on the [existing Coolify deployment](DEPLOYMENT.md).
- [ ] Exercise the [authorized customer, merchant and admin accounts](verification-authentifiee-qmaps.md).
- [ ] Confirm Checkout and webhook behavior in [Stripe Sandbox in staging](preproduction-verification-stripe-sandbox.md). No real payment.
- [ ] Confirm receipt and monitoring of the support, privacy, abuse and business mailboxes at `qmaps.ca`.
- [ ] `docs/mobile-qa-checklist.md` walked on real iOS + Android
- [ ] Owner sign-off in `docs/app-store-readiness.md`

## 4. Key URLs and routes

| Surface | Route |
|---------|-------|
| Home | `/` |
| Legal hub | `/privacy`, `/terms`, `/cookies`, `/account-deletion-policy`, `/support-policy` |
| Release notes (public) | `/release-notes` |
| Sitemap | `/sitemap.xml` |
| Admin launch dashboard | `/admin/launch-status` |
| Merchant billing | `/merchant/billing`, `/merchant/billing/plans` |

## 5. Admin operational playbooks

- Reviews moderation — `docs/admin/reviews-playbook.md`
- Business claims — `docs/admin/business-claims-playbook.md`
- Account deletions — `docs/account-deletion-support-workflow.md`
- Sponsored campaigns — `docs/admin/sponsored-playbook.md`
- Billing & subscriptions — `docs/admin/billing-playbook.md`
- Incident response — `docs/admin/incident-response-playbook.md`
- Daily admin checks — `docs/admin/post-launch-daily-checks.md`

## 5b. Post-launch operations

- Post-launch checklist (T+0 → T+72h) — [`docs/post-launch-checklist.md`](./post-launch-checklist.md)
- First 72 hours monitoring — [`docs/admin/first-72-hours-monitoring.md`](./admin/first-72-hours-monitoring.md)
- Production verification log — [`docs/production-verification-log.md`](./production-verification-log.md)
- Production verification companions:
  - [`docs/verification-authentifiee-qmaps.md`](./verification-authentifiee-qmaps.md) (PostgreSQL API)
  - [`docs/preproduction-verification-stripe-sandbox.md`](./preproduction-verification-stripe-sandbox.md)
  - [`docs/production-verification-mobile.md`](./production-verification-mobile.md)
  - [`docs/production-verification-email-tests.md`](./production-verification-email-tests.md)
- Post-launch issue tracker — [`docs/post-launch-issue-tracker.md`](./post-launch-issue-tracker.md)
- Incident response playbook — [`docs/admin/incident-response-playbook.md`](./admin/incident-response-playbook.md)
- Daily admin checks — [`docs/admin/post-launch-daily-checks.md`](./admin/post-launch-daily-checks.md)

## 6. Rollback plan

Restore only the affected web or API resource according to the [Coolify
rollback procedure](DEPLOYMENT.md#retour-arrière). A deployment rollback
does not revert PostgreSQL or withdraw a published directory batch.
