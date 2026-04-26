# QMAPS — Release Archive Index

_Last reviewed: 2026-04-25_

This is the **single index** of every document, log, and generated
report that ships with the QMAPS launch. Hand this page (or the archive
folder produced by `bun run release:archive`) to the launch owner /
client so nothing is missed.

The archive process itself is documented in
[`release-artifact-process.md`](./release-artifact-process.md).

---

## Recommended reading order

1. [`release-status.md`](./release-status.md) — current stakeholder snapshot
2. [`final-launch-handoff.md`](./final-launch-handoff.md) — owner handoff pack
3. [`final-owner-signoff.md`](./final-owner-signoff.md) — manual sign-off form
4. [`release-candidate-checklist.md`](./release-candidate-checklist.md) — RC gates
5. [`launch-checklist.md`](./launch-checklist.md) — production launch gates
6. [`post-launch-checklist.md`](./post-launch-checklist.md) — T+0 → T+72h
7. [`admin/first-72-hours-monitoring.md`](./admin/first-72-hours-monitoring.md) — hour-by-hour schedule
8. [`admin/incident-response-playbook.md`](./admin/incident-response-playbook.md) — when something breaks
9. [`production-verification-log.md`](./production-verification-log.md) — manual log
10. [`post-launch-issue-tracker.md`](./post-launch-issue-tracker.md) — running issue list

---

## 1. Launch gates

| Document | Path |
|----------|------|
| Release candidate checklist | [`release-candidate-checklist.md`](./release-candidate-checklist.md) |
| Production launch checklist | [`launch-checklist.md`](./launch-checklist.md) |
| Deployment checklist | [`deployment-checklist.md`](./deployment-checklist.md) |
| Go / No-Go command guide | [`go-no-go.md`](./go-no-go.md) |
| App store readiness | [`app-store-readiness.md`](./app-store-readiness.md) |
| Mobile QA checklist | [`mobile-qa-checklist.md`](./mobile-qa-checklist.md) |

## 2. Owner sign-off

| Document | Path |
|----------|------|
| Final launch handoff pack | [`final-launch-handoff.md`](./final-launch-handoff.md) |
| Final owner sign-off form | [`final-owner-signoff.md`](./final-owner-signoff.md) |
| Release status (stakeholder) | [`release-status.md`](./release-status.md) |
| Release status (generated snapshot) | [`release-status.generated.md`](./release-status.generated.md) |
| Release notes (public) | [`release-notes.md`](./release-notes.md) |

## 3. Legal / privacy

| Document | Path |
|----------|------|
| Account deletion policy | [`account-deletion-policy.md`](./account-deletion-policy.md) |
| Account deletion support workflow | [`account-deletion-support-workflow.md`](./account-deletion-support-workflow.md) |
| Public legal routes | `/privacy`, `/terms`, `/cookies`, `/account-deletion-policy`, `/support-policy` |

## 4. Admin playbooks

| Topic | Path |
|-------|------|
| Admin index | [`admin/README.md`](./admin/README.md) |
| Reviews moderation | [`admin/reviews-playbook.md`](./admin/reviews-playbook.md) |
| Business claims | [`admin/business-claims-playbook.md`](./admin/business-claims-playbook.md) |
| Sponsored campaigns | [`admin/sponsored-playbook.md`](./admin/sponsored-playbook.md) |
| Billing & subscriptions | [`admin/billing-playbook.md`](./admin/billing-playbook.md) |
| Incident response | [`admin/incident-response-playbook.md`](./admin/incident-response-playbook.md) |
| Daily admin checks | [`admin/post-launch-daily-checks.md`](./admin/post-launch-daily-checks.md) |

## 5. Post-launch monitoring

| Document | Path |
|----------|------|
| Post-launch checklist (T+0 → T+72h) | [`post-launch-checklist.md`](./post-launch-checklist.md) |
| First 72 hours monitoring schedule | [`admin/first-72-hours-monitoring.md`](./admin/first-72-hours-monitoring.md) |
| Daily admin checks | [`admin/post-launch-daily-checks.md`](./admin/post-launch-daily-checks.md) |
| Incident response playbook | [`admin/incident-response-playbook.md`](./admin/incident-response-playbook.md) |

## 6. Verification logs

| Document | Path |
|----------|------|
| Production verification log | [`production-verification-log.md`](./production-verification-log.md) |
| Post-launch issue tracker | [`post-launch-issue-tracker.md`](./post-launch-issue-tracker.md) |
| Phase 9 RLS regression notes | [`phase9-rls-regression.md`](./phase9-rls-regression.md) |
| Sponsored RLS regression notes | [`sponsored-rls-regression.md`](./sponsored-rls-regression.md) |
| Smoke tests | [`smoke-tests.md`](./smoke-tests.md) |

## 7. Generated reports

| Report | Path | Refresh command |
|--------|------|-----------------|
| Release status snapshot | [`release-status.generated.md`](./release-status.generated.md) | `bun run release:status:file` |
| Go / No-Go JSON report | [`go-no-go-report.generated.json`](./go-no-go-report.generated.json) | `bun run go:no-go:report` |
| Launch checks output (mirror) | [`launch-checks-output.md`](./launch-checks-output.md) | `bun run launch:check` |

## 8. Archive process

To produce a timestamped, owner-ready bundle of the documents above:

```bash
bun run release:archive
```

This writes a folder under `release-artifacts/<timestamp>/` containing
copies of every document, a `README.md` index, and a `manifest.json`.
See [`release-artifact-process.md`](./release-artifact-process.md) for
when to run it and what to send to the owner / client.
