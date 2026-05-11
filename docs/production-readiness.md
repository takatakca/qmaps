# Production Readiness (Phase 15I)

## Environment variables (managed by Lovable Cloud)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- Stripe / billing secrets are stored as Supabase function secrets (do not expose).

Never commit secret values. The `.env` file is auto-managed.

## Supabase tables in active use
businesses, business_hours, business_menu_items, business_photos,
business_categories, business_claims, business_claim_requests,
business_owner_transfer_requests, business_events,
business_recommendation_scores, categories, reviews, reports, profiles,
user_roles, bookmarks, collections, collection_items, follows,
conversations, conversation_participants, messages, notifications,
project_requests, project_quotes, project_quote_messages,
project_request_media, recommendation_events, recommendation_feedback,
merchant_subscriptions, merchant_billing_events, merchant_service_areas,
merchant_service_categories, account_deletion_requests,
account_deletion_request_events, admin_audit_logs.

## Storage buckets
- `photos` — business photos, menu item images (public read; owner write).

## Public routes
`/`, `/search`, `/c/:slug`, `/business/:id`, `/auth`, `/sitemap`, legal pages.

## Merchant routes (`ProtectedMerchantRoute`)
`/merchant`, `/merchant/info`, `/merchant/photos`, `/merchant/menu`,
`/merchant/billing`, `/merchant/leads`, `/merchant/analytics`, etc.

## Admin routes (`ProtectedAdminRoute`)
`/admin`, `/admin/reports`, `/admin/businesses`, `/admin/reviews`,
`/admin/review-moderation`, `/admin/photos`, `/admin/projects`,
`/admin/sponsored`, `/admin/users`, `/admin/account-deletions`,
`/admin/launch-status`, `/admin/claims`, `/admin/owner-transfers`,
`/admin/audit-logs`, `/admin/categories`.

## RLS assumptions
- Public users may read only `is_active` businesses, non-hidden reviews,
  active categories, public collections.
- Authenticated users may write rows scoped to `auth.uid()`.
- Merchants may write data scoped to businesses they own
  (`user_owns_business`).
- Admins (`has_role(auth.uid(), 'admin')`) hold elevated privileges and
  every privileged action writes to `admin_audit_logs`.

## Build & validation
```bash
bun install
bunx vitest run
bun run launch:check
bun run go:no-go:json
bun run build
```

## Rollback
- Frontend: redeploy a previous published version from the Lovable
  publish dialog.
- DB: migrations are additive; revert by hand-crafting a follow-up
  migration if needed. No destructive migrations have been shipped in
  Phases 15B–15I.

## Known infrastructure warnings (deferred)
See `docs/security-hardening-notes.md` for full context:
- PostGIS / pg_trgm in `public` schema
- `spatial_ref_sys` RLS-disabled (PostGIS-managed)
- Public EXECUTE on SECURITY DEFINER helpers used by RLS
- Postgres minor version upgrade available

## Final launch section (Phase 15J)

### Required checks before deploy
1. `bunx vitest run` — all tests green (≥263 expected after 15J).
2. `bun run launch:check` — 16/16.
3. `bun run go:no-go:json` — decision = `GO`.
4. `bun run build` — succeeds with no error output.
5. Manual mobile pass — `docs/mobile-screenshot-checklist.md`.
6. Final regression review — `docs/final-regression-report.md`.

### Deploy command
Frontend is deployed via the Lovable **Publish** dialog. Edge functions
deploy automatically when pushed.

### Post-deploy smoke tests
- Load `/`, `/search`, a known `/business/:id`, `/release-notes`.
- Sign in as a test user, view `/profile`, sign out.
- Sign in as admin, open `/admin`, `/admin/audit-logs`.
- Verify `robots.txt`, `sitemap.xml`, `manifest.webmanifest` resolve.

### Rollback steps
1. In the Lovable publish dialog, select a previous published version
   and republish.
2. If a migration is suspected, do **not** roll back the database
   automatically — open an incident per
   `docs/admin/incident-response-playbook.md`.

### Launch approver
- Product owner (sign-off via `docs/final-owner-signoff.md`).
- Backup approver: technical lead.

### Known deferred warnings
See `docs/security-hardening-notes.md`:
- PostGIS / pg_trgm in `public` schema
- `spatial_ref_sys` RLS-disabled (PostGIS-managed)
- Public EXECUTE on SECURITY DEFINER helpers used by RLS
- Postgres minor version upgrade available

### Monitoring plan
- First 72h: follow `docs/admin/first-72-hours-monitoring.md`.
- Daily: follow `docs/admin/post-launch-daily-checks.md`.
- Use `src/lib/launchMonitoring.ts` helpers for any future status UI.

### Emergency contacts
Stored privately by the owner. Do **not** commit personal contact info
to the repo. Placeholders:

- On-call engineer: _to fill in privately_
- Product owner: _to fill in privately_
- Stripe support: dashboard → Help
- Lovable / hosting support: in-app
