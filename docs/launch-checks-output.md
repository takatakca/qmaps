# QMAPS — Launch checks output formats

The `scripts/launch-checks.mjs` runner verifies static launch-blocking
artifacts (PWA manifest, robots, legal pages, docs). It supports two
output modes that share the same exit code (non-zero on any failure).

## Text mode (default)

```bash
bun run launch:check
```

Example output:

```
QMAPS launch checks
===================
✅  robots.txt exists
✅  robots.txt references sitemap
✅  manifest.webmanifest exists
✅  manifest.name present
✅  manifest.short_name present
✅  manifest.start_url present
✅  manifest.display present
✅  manifest.icons present
✅  legal page: src/pages/legal/Privacy.tsx
✅  legal page: src/pages/legal/Terms.tsx
✅  legal page: src/pages/legal/Cookies.tsx
✅  legal page: src/pages/legal/AccountDeletionPolicy.tsx
✅  legal page: src/pages/legal/SupportPolicy.tsx
✅  doc: docs/release-candidate-checklist.md
✅  doc: docs/deployment-checklist.md
✅  doc: docs/app-store-readiness.md

16/16 passed.
```

## JSON mode

```bash
bun run launch:check:json
```

Emits a single JSON object on stdout (no extra logs), suitable for
piping into other tooling or CI status reporters.

```json
{
  "passed": 16,
  "failed": 0,
  "total": 16,
  "checks": [
    { "name": "robots.txt exists", "ok": true },
    { "name": "robots.txt references sitemap", "ok": true },
    { "name": "manifest.webmanifest exists", "ok": true },
    { "name": "manifest.name present", "ok": true },
    { "name": "manifest.short_name present", "ok": true },
    { "name": "manifest.start_url present", "ok": true },
    { "name": "manifest.display present", "ok": true },
    { "name": "manifest.icons present", "ok": true },
    { "name": "legal page: src/pages/legal/Privacy.tsx", "ok": true },
    { "name": "legal page: src/pages/legal/Terms.tsx", "ok": true },
    { "name": "legal page: src/pages/legal/Cookies.tsx", "ok": true },
    { "name": "legal page: src/pages/legal/AccountDeletionPolicy.tsx", "ok": true },
    { "name": "legal page: src/pages/legal/SupportPolicy.tsx", "ok": true },
    { "name": "doc: docs/release-candidate-checklist.md", "ok": true },
    { "name": "doc: docs/deployment-checklist.md", "ok": true },
    { "name": "doc: docs/app-store-readiness.md", "ok": true }
  ]
}
```

Failed checks include a `detail` field where useful:

```json
{ "name": "robots.txt references sitemap", "ok": false, "detail": "expected `Sitemap: /sitemap.xml`" }
```

## Exit codes

| Code | Meaning |
|------|---------|
| `0`  | All checks passed |
| `1`  | One or more checks failed (text mode prints summary to stderr) |
