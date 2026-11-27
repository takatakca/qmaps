# QMAPS — Final Launch Handoff Pack

_Last reviewed: 2026-11-27_

This is the **single document to hand to the launch owner** when QMAPS is
ready to publish. It bundles the automated GO status, the manual checks
that still need a human, and the rollback plan.

---

## 1. Current automated status

- The automated GO/NO-GO report covers repository checks only. It does not confirm a deployment, a working production account or a charge.
- Read the [latest evidence in issue #17](https://github.com/takatakca/qmaps/issues/17) and confirm green CI for the exact candidate SHA.
- Use the [Coolify deployment procedure](DEPLOYMENT.md#procédure-actuelle--coolify) to confirm the deployed web and API revisions independently.

Refresh anytime with:

```bash
bun run go:no-go          # readable
bun run go:no-go:report   # writes JSON to docs/go-no-go-report.generated.json
```

## 2. Reference documents

| Purpose | Path |
|---------|------|
| Current deployment and rollback | [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md#procédure-actuelle--coolify) |
| Go / No-Go command guide | [`docs/go-no-go.md`](./go-no-go.md) |
| Release status (stakeholder) | [`docs/release-status.md`](./release-status.md) |
| Generated release status snapshot | [`docs/release-status.generated.md`](./release-status.generated.md) |
| Release notes (public) | [`docs/release-notes.md`](./release-notes.md) |
| Owner sign-off form | [`docs/final-owner-signoff.md`](./final-owner-signoff.md) |
| Post-launch checklist (T+0 → T+72h) | [`docs/post-launch-checklist.md`](./post-launch-checklist.md) |
| First 72 hours monitoring | [`docs/admin/first-72-hours-monitoring.md`](./admin/first-72-hours-monitoring.md) |
| Production verification log | [`docs/production-verification-log.md`](./production-verification-log.md) |
| Authenticated PostgreSQL routes | [`docs/verification-authentifiee-qmaps.md`](./verification-authentifiee-qmaps.md) |
| Staging billing verification | [`docs/preproduction-verification-stripe-sandbox.md`](./preproduction-verification-stripe-sandbox.md) |
| Production verification — Mobile / PWA | [`docs/production-verification-mobile.md`](./production-verification-mobile.md) |
| Production verification — Email tests | [`docs/production-verification-email-tests.md`](./production-verification-email-tests.md) |
| Post-launch issue tracker | [`docs/post-launch-issue-tracker.md`](./post-launch-issue-tracker.md) |
| Incident response playbook | [`docs/admin/incident-response-playbook.md`](./admin/incident-response-playbook.md) |
| Daily admin checks | [`docs/admin/post-launch-daily-checks.md`](./admin/post-launch-daily-checks.md) |
| App store readiness | [`docs/app-store-readiness.md`](./app-store-readiness.md) |
| Mobile QA checklist | [`docs/mobile-qa-checklist.md`](./mobile-qa-checklist.md) |
| Release archive index | [`docs/release-archive-index.md`](./release-archive-index.md) |
| Release artifact process | [`docs/release-artifact-process.md`](./release-artifact-process.md) |

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

- [ ] The expected web revision is served over HTTPS on `qmaps.ca` and `www.qmaps.ca`. Verify the `qmaps.takatak.ca` alias too.
- [ ] The PostgreSQL API revision, pagination and anonymous `401` are confirmed. The web manifest alone does not satisfy this check.
- [ ] [Customer, merchant and administrator checks](verification-authentifiee-qmaps.md) use authorized test accounts.
- [ ] [Stripe Sandbox](preproduction-verification-stripe-sandbox.md) confirms Checkout, the signed webhook and persistence in isolated staging. No live payment for this verification.
- [ ] Support, privacy, abuse and business mailboxes at `qmaps.ca` receive messages and have a confirmed operator. See [issue #41](https://github.com/takatakca/qmaps/issues/41).
- [ ] `docs/mobile-qa-checklist.md` walked on real iOS + Android
- [ ] Owner signature recorded in [`docs/final-owner-signoff.md`](./final-owner-signoff.md)

## 6. Rollback plan

If a regression is detected, follow the [Coolify rollback procedure](DEPLOYMENT.md#retour-arrière). Restore only the affected web or API resource after checking schema compatibility. Database changes and a published directory batch require separate handling. Record the restored revision and results in issue #17.

## 7. Post-launch on-call (first 72h)

- On-call contact: _____________________
- Escalation contact: _____________________
- Daily mailbox sweep owner: _____________________
