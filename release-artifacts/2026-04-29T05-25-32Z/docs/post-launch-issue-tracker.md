# QMAPS — Post-Launch Issue Tracker

_Last reviewed: 2026-04-25_

Lightweight, file-based issue log used during the post-launch window
(first 72h and beyond, until a real issue tracker is wired up). One row
per issue. Severity follows
[`admin/incident-response-playbook.md`](./admin/incident-response-playbook.md).

> Status legend: `OPEN` · `IN_PROGRESS` · `BLOCKED` · `RESOLVED` · `WONT_FIX`
> Severity legend: `SEV1` · `SEV2` · `SEV3` · `SEV4`

---

## Active issues

| ID | Severity | Area | Description | Owner | Status | Created | Resolved | Notes |
|----|----------|------|-------------|-------|--------|---------|----------|-------|
|    |          |      |             |       |        |         |          |       |

## Resolved issues (rolling 30 days)

| ID | Severity | Area | Description | Owner | Status | Created | Resolved | Notes |
|----|----------|------|-------------|-------|--------|---------|----------|-------|
|    |          |      |             |       |        |         |          |       |

---

## Example rows (delete once real issues land)

| ID | Severity | Area | Description | Owner | Status | Created | Resolved | Notes |
|----|----------|------|-------------|-------|--------|---------|----------|-------|
| QM-001 | SEV2 | Billing | Webhook intermittently returns 500 on `invoice.paid` | @on-call | RESOLVED | 2026-04-26 | 2026-04-26 | Stripe dashboard replay, root cause: missing live secret; rotated. |
| QM-002 | SEV3 | Reviews | Legitimate review hidden by AI risk scoring | @moderation | RESOLVED | 2026-04-26 | 2026-04-27 | Restored from `/admin/review-moderation`; lowered auto-hide threshold. |
| QM-003 | SEV1 | Auth | Google OAuth callback fails for new users | @on-call | RESOLVED | 2026-04-27 | 2026-04-27 | Redirect URL mismatch on live domain; fixed in provider settings. |
| QM-004 | SEV3 | PWA | iOS splash screen color off | @design | OPEN | 2026-04-28 |  | Cosmetic; will ship in next release. |
| QM-005 | SEV2 | Sponsored | Off-policy campaign approved | @moderation | RESOLVED | 2026-04-28 | 2026-04-28 | Rejected, `admin_note` added, merchant notified. |

---

## How to file an issue

1. Pick the next free `QM-NNN` ID.
2. Severity per `admin/incident-response-playbook.md`.
3. One sentence in **Description** — what is broken from the user's POV.
4. Assign an **Owner** (must be a real human handle).
5. Set **Status = OPEN** and fill **Created**.
6. Update **Status / Resolved / Notes** as it progresses.
7. When `RESOLVED`, move the row to the Resolved table.

## How to close an issue

- Confirm the symptom is gone in production.
- Add a one-line root cause to **Notes**.
- If a permanent prevention is needed, link to:
  - the gate update in `scripts/launch-checks.mjs` or `scripts/go-no-go.mjs`, or
  - the playbook update under `docs/admin/`.
