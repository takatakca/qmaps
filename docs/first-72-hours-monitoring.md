# QMAPS — First 72 Hours Monitoring (Phase 16)

Active monitoring plan for the launch window. Pair with
`docs/admin/first-72-hours-monitoring.md` (operational hour-by-hour
schedule), `docs/post-deploy-smoke-test.md`, and
`docs/launch-issue-template.md`.

---

## Cadence

### Hours 0 → 6 (every hour)

For each hourly pass, walk this list:

- [ ] Production URL loads (desktop + mobile)
- [ ] Auth: sign-in succeeds
- [ ] Lovable Cloud → Auth logs: no error spike
- [ ] Lovable Cloud → Postgres logs: no error spike
- [ ] Lovable Cloud → Storage logs: no upload errors
- [ ] One business detail page loads with reviews + photos
- [ ] `/search` returns results
- [ ] Claim flow: submit → appears in `/admin/claims`
- [ ] `/admin/reports` reachable, no JS errors
- [ ] `/admin/audit-logs` shows recent admin activity
- [ ] `business_events` insertions visible (analytics)
- [ ] Edge function logs: no repeated 5xx
- [ ] Mobile spot-check (one real device)

### Day 1 → Day 3 (twice daily, AM + PM)

- [ ] Walk `docs/admin/post-launch-daily-checks.md`
- [ ] Compare error counts vs previous window
- [ ] Sweep support mailboxes (`support@`, `privacy@`, `abuse@`,
      `business@`)
- [ ] Triage `docs/post-launch-issue-tracker.md`
- [ ] Confirm zero open SEV1 / SEV2

## Signals to watch

| Signal | Source | Severity if failing |
|--------|--------|---------------------|
| Auth errors | Cloud auth logs | Critical |
| Database errors | Cloud postgres logs | Critical |
| Storage upload errors | Cloud storage logs | High |
| Business detail load errors | Browser console + reports | High |
| Search errors | Browser console + reports | High |
| Claim request errors | `/admin/claims` + logs | High |
| Admin moderation errors | `/admin/*` console | Medium → High |
| Analytics event insert errors | `business_events` row count flat | Medium |
| Performance issues | Browser perf, slow page reports | Medium |
| Mobile layout complaints | Support mailbox | Medium |
| User-reported bugs | Support mailbox | Per severity |

## Severity classification

Use `src/lib/launchMonitoring.ts → classifyLaunchIssue` for
programmatic checks. Manual mapping:

- **Critical** — app unusable, auth broken, admin broken, data leak,
  payment issue.
- **High** — business pages or search broken, uploads broken, claim
  flow broken.
- **Medium** — visual bugs, SEO metadata wrong, non-critical admin
  issue.
- **Low** — copy, spacing, minor UX issue.

## Escalation

| Trigger | Action | Within |
|---------|--------|-------:|
| Critical detected | Page on-call + owner; start incident channel | 15 min |
| High detected | Notify on-call + owner | 30 min |
| Critical not mitigated | Escalate to backup on-call + owner | 1 hour |
| High not mitigated | Escalate to backup on-call | 4 hours |

When in doubt, escalate one level up.

## Closing the window (T+72h)

- [ ] All smoke rows PASS in `docs/post-deploy-smoke-test.md`
- [ ] Zero open SEV1 / SEV2 in tracker
- [ ] Latest `bun run go:no-go:report` archived
- [ ] Hand off to steady-state owner of
      `docs/admin/post-launch-daily-checks.md`
