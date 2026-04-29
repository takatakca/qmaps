# QMAPS — First 72 Hours Monitoring

_Last reviewed: 2026-04-25_

Hour-by-hour and day-by-day monitoring plan for the **first 72 hours**
after publishing QMAPS. Owned by the launch on-call. Pair with:

- [`../post-launch-checklist.md`](../post-launch-checklist.md)
- [`../production-verification-log.md`](../production-verification-log.md)
- [`../post-launch-issue-tracker.md`](../post-launch-issue-tracker.md)
- [`incident-response-playbook.md`](./incident-response-playbook.md)
- [`post-launch-daily-checks.md`](./post-launch-daily-checks.md)

> Anything not `PASS` becomes a row in the issue tracker.

---

## Hour 0 → 1 (publish window)

- [ ] Publish from Lovable; record published version ID for rollback
- [ ] `https://qmaps.app` loads (desktop + mobile)
- [ ] Sign-up + sign-in succeed end-to-end
- [ ] `/`, `/search`, `/more`, `/auth` render with no console errors
- [ ] One business detail page loads with reviews
- [ ] `/sitemap.xml`, `/robots.txt`, all five legal routes resolve
- [ ] `/admin/launch-status` is green
- [ ] On-call reachable; backup on-call notified
- [ ] Open `docs/production-verification-log.md` and start filling rows

## Hour 1 → 6

- [ ] Run `bun run go:no-go:report` against `main`; archive JSON
- [ ] Stripe live checkout: one real purchase verified
- [ ] Stripe webhook deliveries: 100% 2xx in dashboard
- [ ] Customer portal opens for an active subscriber
- [ ] One sponsored campaign serves on `/search` and a category page
- [ ] `sponsored_campaign_events` shows `impression` + `click`
- [ ] One new review submitted; `review_trust_scores` row written
- [ ] Edge function logs reviewed — no repeated 5xx
- [ ] Support mailboxes swept once
- [ ] Issue tracker reviewed; SEV1/SEV2 escalated immediately

## Day 1 (Hour 6 → 24)

- [ ] Walk [`post-launch-daily-checks.md`](./post-launch-daily-checks.md)
- [ ] Account deletion request flow tested with throwaway account
- [ ] PWA installable on Android Chrome + iOS Add-to-Home-Screen
- [ ] Mobile QA spot-check on a real device per `../mobile-qa-checklist.md`
- [ ] `production-verification-log.md` sections 1–10: no `FAIL` rows
- [ ] End-of-day handoff note posted

## Day 2

- [ ] Walk daily admin checks
- [ ] Compare error rate vs Day 1 (should be flat or down)
- [ ] Stripe failure rate < 2% of attempts; investigate any decline cluster
- [ ] No new SEV1/SEV2 in last 24h, or all mitigated
- [ ] Confirm no spam wave in reviews / sponsored / claims
- [ ] Issue tracker triaged; aged `OPEN` items have an owner

## Day 3 (closing the window)

- [ ] Walk daily admin checks
- [ ] All SEV1/SEV2 from the window are `RESOLVED`
- [ ] All sections of `production-verification-log.md` signed
- [ ] Owner re-confirms `final-owner-signoff.md` still valid
- [ ] Post-mortems filed for any incident
- [ ] Hand off to steady-state daily admin rotation

---

## Escalation rules

| Trigger | Action | Within |
|---------|--------|-------:|
| SEV1 detected | Page on-call + launch owner; start incident channel | 15 min |
| SEV2 detected | Notify on-call + launch owner | 30 min |
| SEV1 not mitigated | Escalate to backup on-call + owner | 1 hour |
| SEV2 not mitigated | Escalate to backup on-call | 4 hours |
| Stripe webhooks failing > 5 min | Treat as SEV1 (payments) | immediate |
| Auth completely broken | SEV1 — banner on `/`, notify users | immediate |
| Privacy/legal request stuck | SEV1/SEV2 — loop in legal owner | same day |

When in doubt, **escalate up one level**.

## End-of-window closure checklist

At T+72h, before standing down the heightened on-call:

- [ ] All sections of `production-verification-log.md` signed `PASS`
      (or have a `WONT_FIX` row in the issue tracker with rationale)
- [ ] `post-launch-issue-tracker.md` has zero `OPEN` SEV1/SEV2
- [ ] Latest `bun run go:no-go:report` JSON archived
- [ ] Steady-state owner of `post-launch-daily-checks.md` confirmed
- [ ] On-call rotation handoff notice sent
- [ ] Lessons-learned note appended to `release-notes.md` if applicable
