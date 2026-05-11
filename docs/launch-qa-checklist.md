# Launch QA Checklist (Phase 15I)

Use this checklist before each public release.

## Public pages
- [ ] `/` renders, hero loads, CTAs work
- [ ] `/search` returns results, filters/sort persist in URL
- [ ] `/c/:slug` (category page) loads
- [ ] `/business/:id` loads, photos/menu/reviews tabs work
- [ ] 404 page renders for unknown routes

## Search
- [ ] Text query works
- [ ] Category filter works
- [ ] City filter works
- [ ] Sort by distance / rating / popularity works
- [ ] Empty state appears when no results

## Business detail
- [ ] Hours render (current + special hours)
- [ ] Menu items render with prices, currency, availability
- [ ] Photos render with lazy loading & fallback on broken URL
- [ ] Reviews render with star ratings
- [ ] "Revendiquer" CTA visible for unclaimed businesses
- [ ] `menu_view` analytics fired

## Merchant portal
- [ ] Auth → onboarding → home flow works
- [ ] Edit info, hours, attributes, special hours
- [ ] Photo manager: upload, reorder, set cover
- [ ] Menu manager: add/edit/delete with image upload
- [ ] Analytics cards show 7-day data
- [ ] Completeness card reflects fields filled

## Admin portal
- [ ] Dashboard counters load (claims, transfers, reports, audits)
- [ ] Categories CRUD (create, edit, deactivate, reactivate)
- [ ] Reviews moderation: hide, restore, mark reviewed
- [ ] Reports moderation: review, dismiss
- [ ] Claims & owner transfers approval
- [ ] Audit logs page filters & list

## Auth
- [ ] Sign up, sign in, password reset flow
- [ ] Email verification gate
- [ ] Google OAuth (if enabled)
- [ ] Sign out

## Claim & verification flow
- [ ] User can submit claim request with valid data
- [ ] Duplicate pending request blocked
- [ ] Admin approve creates ownership / transfer request
- [ ] Trust badges update post-approval

## Photos & menu uploads
- [ ] File size validation
- [ ] Supabase Storage upload succeeds
- [ ] Failure path shows user-friendly toast

## SEO
- [ ] `<title>` and meta description set per page
- [ ] OG/Twitter tags present
- [ ] Canonical link present
- [ ] `robots.txt` disallows `/admin`, `/merchant`, `/auth/callback`
- [ ] `/sitemap` route generates XML

## Mobile QA (≤414px)
- [ ] Bottom nav usable
- [ ] Forms scroll above keyboard
- [ ] Modals fit viewport
- [ ] Tap targets ≥44px

## Security / RLS
- [ ] Non-admin cannot reach `/admin/*`
- [ ] Non-merchant cannot reach `/merchant/*`
- [ ] Public can read only `is_active` businesses & visible reviews
- [ ] Admins-only writes audit log entries

## Performance
- [ ] First image hero is eager / high priority
- [ ] Subsequent images lazy
- [ ] Admin & merchant routes lazy-loaded
- [ ] No console errors on landing

## Known deferred
- PostGIS extension in `public` schema
- Postgres minor upgrade
- SECURITY DEFINER public EXECUTE on RLS helpers
  (See `docs/security-hardening-notes.md`.)
