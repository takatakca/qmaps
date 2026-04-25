# Go / No-Go Gate

## Purpose

The `go:no-go` command is the **final pre-launch gate**. It runs every
automated verification step in sequence and gives a single binary answer:

- **GO 🚀** — everything passed; the build is ready to ship.
- **NO-GO 🛑** — one or more steps failed; fix the issues before publishing.

## When to run it

| Moment | Why |
|--------|-----|
| Before every release candidate tag | Confirm the branch is green end-to-end |
| After any change to `public/`, SEO, or legal pages | Static launch checks may be affected |
| After updating Stripe webhooks or billing edge functions | Build + test coverage must stay green |
| Before cutting a custom-domain or app-store release | Snapshot must reflect the exact state being shipped |

## How it works

```bash
bun run go:no-go
```

The script executes four steps **in order**, stopping none early (so you see
every failure at once):

1. **Launch checks** (`bun run launch:check`) — robots.txt, manifest, legal pages, required docs.
2. **Tests** (`bunx vitest run`) — unit + smoke tests.
3. **Build** (`bun run build`) — Vite production bundle, no fatal warnings.
4. **Release status snapshot** (`bun run release:status:file`) — regenerates `docs/release-status.generated.md`.

Each step prints `PASS ✅` or `FAIL ❌`. At the end you get:

```
Final decision: GO 🚀
```

or

```
Final decision: NO-GO 🛑
```

## Exit code

| Code | Meaning |
|------|---------|
| `0` | All four steps passed — safe to proceed. |
| `1` | At least one step failed — investigate and re-run. |

CI pipelines (including the GitHub Actions workflow) can rely on this code
to block merges when the gate is red.

## After a GO

1. Review `docs/release-status.generated.md` for the latest snapshot.
2. Walk the manual blockers in `docs/release-status.md`.
3. Publish from the Lovable dashboard.

## After a NO-GO

1. Read the failing step’s output above the summary.
2. Fix the root cause (code, tests, missing doc, or broken asset).
3. Re-run `bun run go:no-go` until it turns green.

## CLI flags (Phase 13G)

The script accepts additional flags for CI/automation:

| Flag | Purpose |
|------|---------|
| `--json` | Emit a machine-readable JSON report to stdout instead of the readable summary. |
| `--out <path>` | Write the JSON report to `<path>` (implies `--json` for the file content). |
| `--fail-fast` | Stop at the first failing step instead of running all four. |

### Examples

```bash
# Readable, human-friendly output (default)
bun run go:no-go

# JSON to stdout (CI-friendly)
bun run go:no-go:json

# Write a JSON report file
bun run go:no-go:report
# → docs/go-no-go-report.generated.json
```

### JSON shape

```json
{
  "decision": "GO",
  "passed": 4,
  "failed": 0,
  "total": 4,
  "duration_ms": 12345,
  "steps": [
    {
      "name": "Launch checks",
      "ok": true,
      "duration_ms": 120,
      "command": "bun run launch:check"
    }
  ]
}
```

`decision` is `"GO"` only when every step passed; otherwise `"NO-GO"`. The
process exit code mirrors the decision (`0` = GO, `1` = NO-GO).
