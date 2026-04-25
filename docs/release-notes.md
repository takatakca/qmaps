# QMAPS — Release Notes

_Last updated: 2026-04-25_

## Current release candidate

QMAPS is in **release-candidate** mode. The platform is feature-complete
for first public launch, with all core consumer, merchant, and admin
flows wired against Lovable Cloud, plus a documented launch and
operations playbook set.

The in-app `/admin/launch-status` dashboard mirrors this checklist; run
`bun run launch:check` (or `:json`) for a machine-readable snapshot.

## Phases completed

| Phase | Theme | Highlights |
|------:|-------|-----------|
| 7 | **Payments / merchant billing** | Stripe checkout + customer portal edge functions, plan tiers, webhook reconciliation. |
| 8 | **Sponsored listings** | Merchant-owned campaigns, admin review workflow, placement events, RLS-isolated reads. |
| 9 | **Recommendations & review trust** | Personalized recommendations, similar businesses, AI-assisted review risk scoring with admin moderation. |
| 10 | **PWA, legal, account deletion** | Installable manifest + maskable icons, EN/FR legal pages, end-to-end account-deletion request flow with audit trail. |
| 11 | **Admin operational playbooks** | Reviews, claims, sponsored, billing, and deletion playbooks under `docs/admin/`. |
| 12 | **CI, env, performance, SEO** | GitHub Actions CI, `.env.example`, Vite manual chunking (~70% main-bundle reduction), per-route SEO + static asset tests. |
| 13 | **Release-candidate checks** | Shared `launchChecks.ts`, `/admin/launch-status`, `bun run launch:check[:json]`, RC checklist + release notes. |

## Manual checks still required before public launch

- Stripe live-mode keys and webhook secret set in Lovable Cloud
- Custom domain DNS + SSL active (`qmaps.app`)
- All four support mailboxes monitored daily
  (`support@`, `privacy@`, `abuse@`, `business@qmaps.app`)
- `docs/mobile-qa-checklist.md` walked on a real iOS + Android device
- Owner sign-off in `docs/app-store-readiness.md`
- Final lighthouse pass on the production domain

See `docs/release-candidate-checklist.md` for the full sign-off list.

## Rollback note

If a regression is detected after publish, restore the previous published
version from the Lovable project history. Database state is **not**
reverted automatically — review any in-flight migrations with
`supabase--linter` before re-publishing. No service worker is registered,
so clients pick up the rollback on next reload without cache invalidation
work.
