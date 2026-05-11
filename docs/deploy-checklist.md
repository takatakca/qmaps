# QMAPS — Deploy Checklist (Phase 16)

Operational checklist for the launch publish. Companion to
`docs/deployment-checklist.md` (which tracks env-level configuration)
and `docs/launch-deployment-report.md` (which records the run).

> **No secret values in this file.** Reference names only.

---

## 1. Pre-deploy

- [ ] `bunx vitest run` — 263+/263+ pass
- [ ] `bun run launch:check` — 16/16 pass
- [ ] `bun run go:no-go` — decision **GO**
- [ ] `bun run build` — succeeds
- [ ] `docs/launch-deployment-report.md` updated with current results
- [ ] `docs/final-owner-signoff.md` signed by owner
- [ ] Manual gates in `docs/launch-deployment-report.md` §3 all signed
- [ ] No open SEV1 / SEV2 in `docs/post-launch-issue-tracker.md`
- [ ] Previous published version ID recorded for rollback

## 2. Deploy steps

1. From the Lovable editor, click **Publish → Update**.
2. Wait for the publish job to finish.
3. Record the new published version ID in
   `docs/launch-deployment-report.md` §1.
4. Capture the published URL (e.g. `https://qmaps.lovable.app` or
   custom domain).
5. Walk `docs/post-deploy-smoke-test.md` immediately.

## 3. Post-deploy smoke

Run the entire `docs/post-deploy-smoke-test.md`. Any FAIL row that
maps to severity **critical** or **high** triggers rollback.

## 4. Rollback

- **Approver:** launch owner (or backup on-call if owner unreachable
  for > 15 min during a SEV1).
- **Steps:**
  1. In Lovable, open the publish dialog → **Version history**.
  2. Select the previously published version recorded in §2 step 3.
  3. Click **Republish this version**.
  4. Re-run `docs/post-deploy-smoke-test.md` against the rolled-back
     URL.
  5. File a post-mortem entry in `docs/post-launch-issue-tracker.md`
     using `docs/launch-issue-template.md`.

## 5. Where to monitor

| Signal | Where |
|--------|-------|
| Frontend errors | Browser console on production URL; user-reported via support mailboxes |
| Auth / DB errors | Lovable Cloud → Logs (auth, postgres) |
| Edge function logs | Lovable Cloud → Functions → per-function logs |
| Storage errors | Lovable Cloud → Storage → bucket logs |
| Stripe events | Stripe dashboard → Events / Webhooks (live mode) |
| Analytics events | `business_events` table via admin views |
| Admin activity | `/admin/audit-logs` |
| Launch readiness | `/admin/launch-status` (static gate links) |

## 6. Deferred security warnings

See `docs/security-hardening-notes.md`. None are launch blockers.
Track follow-up in `docs/post-launch-backlog.md`.

## 7. Forbidden during deploy window

- No schema migrations
- No secret rotation
- No category / role changes
- No bulk data writes
- No new feature merges
