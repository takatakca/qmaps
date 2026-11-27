# QMAPS Release Status

_Generated: 2026-11-27T23:05:35.603Z_

**Project:** `vite_react_shadcn_ts` · **Version:** `0.0.0`

This report checks local repository files only. For deployed revisions and operational evidence, see [issue #17](https://github.com/takatakca/qmaps/issues/17).

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

- [Verify the web SHA and PostgreSQL API SHA separately in Coolify](DEPLOYMENT.md).
- [Verify authorized customer, merchant and administrator journeys](verification-authentifiee-qmaps.md).
- [Verify Checkout and webhook delivery in isolated Stripe Sandbox](preproduction-verification-stripe-sandbox.md). No live payment.
- Confirm receipt and monitoring for the QMAPS mailboxes at `qmaps.ca`.
- Real-device mobile QA walk completed
- Owner sign-off on `docs/app-store-readiness.md`

## Rollback

Follow the [Coolify rollback procedure](DEPLOYMENT.md#retour-arrière) for the affected web or API resource. Check schema compatibility before reverting the API. A deployment rollback does not revert PostgreSQL or withdraw a published directory batch.
