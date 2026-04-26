# QMAPS — Release Artifact Process

_Last reviewed: 2026-04-25_

This document explains how to produce, sign, and archive the QMAPS
launch artifact bundle. Pair with
[`release-archive-index.md`](./release-archive-index.md) (the index of
documents that go into the bundle).

---

## 1. When to run `bun run release:archive`

Run it at these moments:

1. **Before owner sign-off** — produce a fresh bundle, hand it to the
   launch owner with [`final-owner-signoff.md`](./final-owner-signoff.md).
2. **At T+0 (publish moment)** — capture the exact state of docs and
   generated reports at the time of go-live.
3. **At T+72h** — capture the post-launch state including the
   verification log and any tracked issues.
4. **After every material doc change** during the launch window.

The script is idempotent: each run writes to a new
`release-artifacts/<timestamp>/` folder, so previous bundles are
preserved.

## 2. What `release:archive` produces

```
release-artifacts/
└── 2026-04-25T18-00-00Z/
    ├── README.md          # human-readable index
    ├── manifest.json      # machine-readable file list + timestamp
    ├── release-status.md
    ├── release-status.generated.md
    ├── release-notes.md
    ├── final-launch-handoff.md
    ├── final-owner-signoff.md
    ├── launch-checklist.md
    ├── release-candidate-checklist.md
    ├── deployment-checklist.md
    ├── app-store-readiness.md
    ├── post-launch-checklist.md
    ├── production-verification-log.md
    ├── post-launch-issue-tracker.md
    ├── go-no-go-report.generated.json
    └── admin/
        ├── README.md
        ├── reviews-playbook.md
        ├── business-claims-playbook.md
        ├── sponsored-playbook.md
        ├── billing-playbook.md
        ├── incident-response-playbook.md
        ├── post-launch-daily-checks.md
        └── first-72-hours-monitoring.md
```

## 3. What to send to the owner / client

Send the **most recent** `release-artifacts/<timestamp>/` folder. The
owner needs:

1. The folder itself (zip it before emailing if needed).
2. A pointer to [`final-owner-signoff.md`](./final-owner-signoff.md)
   inside the bundle — that is the form they sign.
3. The current Go / No-Go decision from
   [`go-no-go-report.generated.json`](./go-no-go-report.generated.json).

## 4. Documents that need a manual signature before launch

These documents have signature / sign-off fields that **must** be
filled in by a human before publishing:

- [`final-owner-signoff.md`](./final-owner-signoff.md) — owner approval
- [`production-verification-log.md`](./production-verification-log.md) — final verifier sign-off
- [`app-store-readiness.md`](./app-store-readiness.md) — owner sign-off

The archive script captures whatever state these files are in. If they
are unsigned in the bundle, **the launch is not approved**.

## 5. What to archive after T+72h

After the first 72 hours have elapsed and the launch window is closed
(see [`admin/first-72-hours-monitoring.md`](./admin/first-72-hours-monitoring.md)):

1. Run `bun run release:archive` one final time to capture the
   post-launch state.
2. Make sure the following are filled in inside that final bundle:
   - [`production-verification-log.md`](./production-verification-log.md) — all rows completed
   - [`post-launch-issue-tracker.md`](./post-launch-issue-tracker.md) — issues moved to the resolved table
   - [`final-owner-signoff.md`](./final-owner-signoff.md) — signed
3. Tag this bundle as the **canonical launch record** and store it
   alongside the project's permanent records.

## 6. `release:archive:clean` (optional)

To remove old archive folders, delete them manually:

```bash
rm -rf release-artifacts/<old-timestamp>
```

There is no destructive script wrapper — this is intentional. Archive
folders are cheap to keep and provide an audit trail.

## 7. Related

- [`release-archive-index.md`](./release-archive-index.md) — what is in the bundle
- [`final-launch-handoff.md`](./final-launch-handoff.md) — owner handoff pack
- [`final-owner-signoff.md`](./final-owner-signoff.md) — sign-off form
- [`go-no-go.md`](./go-no-go.md) — gate command
