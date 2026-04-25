# QMAPS — Release Status (stakeholder-facing)

_Last reviewed: 2026-04-25_

This document is the **single page to share with non-technical
stakeholders** (founders, ops, partners) when reporting where the
release stands. A machine-generated snapshot of the same shape lives in
`docs/release-status.generated.md` (run `bun run release:status:file`
to refresh it).

---

## 1. Current release-candidate status

QMAPS is in **release-candidate** mode. All Phase 7–13 deliverables are
merged. Remaining work before public launch is operational
(Stripe live keys, DNS, support mailbox monitoring, real-device QA
sign-off).

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

## 3. Manual launch blockers

- [ ] Stripe in **Live** mode + `STRIPE_WEBHOOK_SECRET` set
- [ ] Custom domain `qmaps.app` connected, SSL **Active**
- [ ] Support mailboxes monitored daily:
      `support@`, `privacy@`, `abuse@`, `business@qmaps.app`
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
- Incident response playbook — [`docs/admin/incident-response-playbook.md`](./admin/incident-response-playbook.md)
- Daily admin checks — [`docs/admin/post-launch-daily-checks.md`](./admin/post-launch-daily-checks.md)

## 6. Rollback plan

If a regression is detected after publish:

1. Restore the previous published version from the Lovable project
   history (one-click rollback).
2. Database state is **not** reverted automatically. Review any
   in-flight migrations with `supabase--linter` before re-publishing.
3. No service worker is registered, so clients pick up the rollback on
   their next reload.
4. Notify the on-call contact and post status in the support mailbox.
