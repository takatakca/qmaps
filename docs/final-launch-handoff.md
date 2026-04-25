# QMAPS — Final Launch Handoff Pack

_Last reviewed: 2026-04-25_

This is the **single document to hand to the launch owner** when QMAPS is
ready to publish. It bundles the automated GO status, the manual checks
that still need a human, and the rollback plan.

---

## 1. Current automated status

- **Go / No-Go decision:** **GO 🚀** (4/4 steps passing)
- **Launch checks:** 16/16 passing
- **Tests:** all green (`bunx vitest run`)
- **Build:** clean (`bun run build`)
- **JSON report:** [`docs/go-no-go-report.generated.json`](./go-no-go-report.generated.json)

Refresh anytime with:

```bash
bun run go:no-go          # readable
bun run go:no-go:report   # writes JSON to docs/go-no-go-report.generated.json
```

## 2. Reference documents

| Purpose | Path |
|---------|------|
| Release candidate checklist | [`docs/release-candidate-checklist.md`](./release-candidate-checklist.md) |
| Go / No-Go command guide | [`docs/go-no-go.md`](./go-no-go.md) |
| Release status (stakeholder) | [`docs/release-status.md`](./release-status.md) |
| Generated release status snapshot | [`docs/release-status.generated.md`](./release-status.generated.md) |
| Release notes (public) | [`docs/release-notes.md`](./release-notes.md) |
| Owner sign-off form | [`docs/final-owner-signoff.md`](./final-owner-signoff.md) |
| App store readiness | [`docs/app-store-readiness.md`](./app-store-readiness.md) |
| Mobile QA checklist | [`docs/mobile-qa-checklist.md`](./mobile-qa-checklist.md) |

## 3. Admin operational playbooks

See [`docs/admin/README.md`](./admin/README.md) for the index. Direct links:

- Reviews moderation — `docs/admin/reviews-playbook.md`
- Business claims — `docs/admin/business-claims-playbook.md`
- Account deletions — `docs/account-deletion-support-workflow.md`
- Sponsored campaigns — `docs/admin/sponsored-playbook.md`
- Billing & subscriptions — `docs/admin/billing-playbook.md`

## 4. Public legal routes (must resolve in production)

- `/privacy`
- `/terms`
- `/cookies`
- `/account-deletion-policy`
- `/support-policy`
- `/release-notes`
- `/sitemap.xml`

## 5. Manual blockers still requiring human verification

- [ ] Stripe in **Live** mode + `STRIPE_WEBHOOK_SECRET` set in Lovable Cloud
- [ ] Custom domain `qmaps.app` connected, SSL **Active**
- [ ] Support mailboxes monitored daily:
      `support@`, `privacy@`, `abuse@`, `business@qmaps.app`
- [ ] `docs/mobile-qa-checklist.md` walked on real iOS + Android
- [ ] Owner signature recorded in [`docs/final-owner-signoff.md`](./final-owner-signoff.md)

## 6. Rollback plan

If a regression is detected after publish:

1. Restore the previous published version from the Lovable project
   history (one-click rollback).
2. Database state is **not** reverted automatically. Review any
   in-flight migrations with `supabase--linter` before re-publishing.
3. No service worker is registered, so clients pick up the rollback on
   their next reload.
4. Notify the on-call contact and post status in the support mailbox.

## 7. Post-launch on-call (first 72h)

- On-call contact: _____________________
- Escalation contact: _____________________
- Daily mailbox sweep owner: _____________________
