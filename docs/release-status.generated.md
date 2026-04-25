# QMAPS Release Status

_Generated: 2026-04-25T15:32:45.726Z_

**Project:** `vite_react_shadcn_ts` · **Version:** `0.0.0`

## Launch checks

**16/16 passed**

| Status | Check |
|--------|-------|
| ✅ | robots.txt exists |
| ✅ | robots.txt references sitemap |
| ✅ | manifest.webmanifest exists |
| ✅ | manifest.name present |
| ✅ | manifest.short_name present |
| ✅ | manifest.start_url present |
| ✅ | manifest.display present |
| ✅ | manifest.icons present |
| ✅ | legal page: src/pages/legal/Privacy.tsx |
| ✅ | legal page: src/pages/legal/Terms.tsx |
| ✅ | legal page: src/pages/legal/Cookies.tsx |
| ✅ | legal page: src/pages/legal/AccountDeletionPolicy.tsx |
| ✅ | legal page: src/pages/legal/SupportPolicy.tsx |
| ✅ | doc: docs/release-candidate-checklist.md |
| ✅ | doc: docs/deployment-checklist.md |
| ✅ | doc: docs/app-store-readiness.md |

## Documentation snapshot

| Status | File |
|--------|------|
| ✅ | `docs/release-notes.md` |
| ✅ | `docs/launch-checklist.md` |
| ✅ | `docs/release-candidate-checklist.md` |
| ✅ | `docs/deployment-checklist.md` |
| ✅ | `docs/app-store-readiness.md` |

## Manual launch blockers

- Stripe in **Live** mode + webhook secret set
- Custom domain DNS + SSL active (`qmaps.app`)
- Support mailboxes monitored daily
- Real-device mobile QA walk completed
- Owner sign-off on `docs/app-store-readiness.md`

## Rollback

Restore the previous published version from the Lovable project history. Database state is **not** reverted automatically — review in-flight migrations with the Supabase linter before re-publishing. No service worker is registered, so clients pick up the rollback on next reload.
