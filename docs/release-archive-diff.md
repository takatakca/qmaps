# QMAPS — Release Archive Diff Guide

_Last reviewed: 2026-04-25_

Each run of `bun run release:archive` produces a new timestamped folder
under `release-artifacts/`. This guide explains how to compare two
archives so you can tell **what actually changed** between them
(important content changes) versus **what trivially changed**
(generated timestamps).

---

## 1. Quick recursive diff

```bash
diff -ru release-artifacts/<older-timestamp> release-artifacts/<newer-timestamp>
```

Add `--brief` to only see which files differ:

```bash
diff -ruq release-artifacts/<older-timestamp> release-artifacts/<newer-timestamp>
```

Exclude the generated metadata files for a cleaner signal:

```bash
diff -ru \
  --exclude=manifest.json \
  --exclude=README.md \
  --exclude=release-status.generated.md \
  --exclude=go-no-go-report.generated.json \
  release-artifacts/<older> release-artifacts/<newer>
```

## 2. What differences matter

| Difference | Importance | Why |
|------------|-----------:|-----|
| `manifest.json` `generated_at` | low | Always changes; cosmetic |
| `README.md` heading timestamp | low | Mirror of `generated_at` |
| `release-status.generated.md` "_Generated:_" line | low | Cosmetic |
| `go-no-go-report.generated.json` `duration_ms` | low | Per-run timing variance |
| `go-no-go-report.generated.json` `decision` | **HIGH** | GO ↔ NO-GO transition |
| `go-no-go-report.generated.json` `passed` / `failed` | **HIGH** | Gate health |
| Any change in `final-owner-signoff.md` | **HIGH** | Owner sign-off state |
| Any change in `production-verification-log.md` | **HIGH** | Manual verification state |
| Any change in `post-launch-issue-tracker.md` | medium | New / resolved issues |
| Any change in `release-notes.md` | medium | What is shipped |
| Any change in checklists or playbooks | medium | Process changes |
| Any change in `release-archive-index.md` | medium | What is bundled |

## 3. Decision differences only

To compare just the gate decisions between two archives:

```bash
jq '.decision, .passed, .failed' \
  release-artifacts/<older>/go-no-go-report.generated.json \
  release-artifacts/<newer>/go-no-go-report.generated.json
```

## 4. Manifest file-list diff

To see which **files** were added or removed between archives (e.g., a
playbook was added):

```bash
diff \
  <(jq -r '.files[].path' release-artifacts/<older>/manifest.json | sort) \
  <(jq -r '.files[].path' release-artifacts/<newer>/manifest.json | sort)
```

## 5. When to compare archives

- Before sending a fresh bundle to the owner — confirm what changed
  since the last bundle they signed.
- During post-launch (T+72h) — compare the launch-time bundle to the
  T+72h bundle to see all manual log entries that were filled in.
- During incident review — compare the bundle from before the incident
  to one taken after mitigation.

## 6. Related

- [`release-archive-index.md`](./release-archive-index.md)
- [`release-artifact-process.md`](./release-artifact-process.md)
- [`owner-handoff-email-template.md`](./owner-handoff-email-template.md)
