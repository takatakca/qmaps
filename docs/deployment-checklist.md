# QMAPS — Final Deployment Checklist (Phase 10G)

Walk this list **before every production publish**. Items are grouped by
ownership so a single human can sign off in one pass.

---

## 1. Backend (Lovable Cloud / Supabase)

- [ ] `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` populated in `.env`
- [ ] `.env.example` matches current required variables (see `docs/environment-setup.md`)
- [ ] All migrations applied (run `supabase--linter` for security warnings)
- [ ] RLS enabled on every public table (verify in Cloud dashboard)
- [ ] Edge functions deployed and reachable:
  - `analyze-review-risk`
  - `create-merchant-checkout-session`
  - `create-merchant-billing-portal-session`
  - `stripe-webhook`
- [ ] Edge function secrets set: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `LOVABLE_API_KEY`

## 2. Stripe (test → live switch)

- [ ] Stripe account in **Live** mode
- [ ] Live `STRIPE_SECRET_KEY` set in edge function secrets
- [ ] Live webhook endpoint registered → `https://<project>.functions.supabase.co/stripe-webhook`
- [ ] Live `STRIPE_WEBHOOK_SECRET` set
- [ ] Price IDs in `src/lib/billing.ts` match live prices
- [ ] Test a $0 / refundable subscription end-to-end
- [ ] Customer portal session opens with live data

## 3. Legal & support emails (must resolve)

- [ ] `support@qmaps.app` — general support
- [ ] `privacy@qmaps.app` — Loi 25 / privacy
- [ ] `abuse@qmaps.app` — DMCA / harmful content
- [ ] `business@qmaps.app` — merchant billing

## 4. Domain & SSL

- [ ] Custom domain connected (Project Settings → Domains)
- [ ] Both `qmaps.app` and `www.qmaps.app` added; one set as Primary
- [ ] DNS A records → `185.158.133.1`
- [ ] SSL status = **Active** in Lovable
- [ ] Open `https://qmaps.app/sitemap.xml` and confirm legal routes are listed

## 5. Public legal pages (live and linked)

- [ ] `/privacy` resolves, EN/FR toggle works
- [ ] `/terms` resolves
- [ ] `/cookies` resolves
- [ ] `/account-deletion-policy` resolves
- [ ] `/support-policy` resolves; mailto form opens email client
- [ ] Footer in `/settings` and `/more` links all five
- [ ] `/sitemap.xml` includes all five legal routes

## 6. Account deletion flow (end-to-end)

- [ ] Logged-in user can submit a request from `/settings/delete-account`
- [ ] Confirmation requires typing `DELETE`
- [ ] Duplicate active request is blocked
- [ ] Banner appears in `/settings` showing pending status
- [ ] Admin can approve / reject from `/admin/account-deletions`
- [ ] Audit events appear in expandable history

## 7. PWA / installability

- [ ] `public/manifest.webmanifest` linked from `index.html`
- [ ] `theme-color` matches manifest (`#cf1f1f`)
- [ ] Apple touch icon 180×180 referenced
- [ ] Maskable icon listed in manifest
- [ ] Lighthouse → Application → Manifest shows no errors
- [ ] Install prompt appears on Chrome Android (real device)
- [ ] "Add to Home Screen" works on iOS Safari
- [ ] **No service worker registered** (intentional — Lovable preview guidance)

## 8. SEO

- [ ] Each route has `<Seo>` with unique title (<60 chars) and description (<160 chars)
- [ ] Canonical URLs use the live domain after publishing
- [ ] `index.html` lang attribute matches default locale (`en`)
- [ ] `robots.txt` allows crawling of public routes
- [ ] OG image is at least 1200×630 and resolves on the live domain

## 9. Mobile UX (run on real device, viewport 360–414)

- [ ] All bottom-nav tap targets ≥ 44×44 px
- [ ] Safe-area padding applied on bottom nav and sticky headers (`pb-safe`, `pt-safe`)
- [ ] Legal pages readable without horizontal scroll
- [ ] Merchant dashboard tabs do not overflow
- [ ] Modals/sheets respect bottom inset
- [ ] No autozoom on input focus (`maximum-scale=5` + 16px font on inputs)

## 10. Performance / bundle

- [ ] `bun run build` succeeds
- [ ] `MerchantDashboard` chunk is code-split via `React.lazy`
- [ ] Heavy chart panels lazy-loaded
- [ ] Initial route fallback uses skeletons, not blank screen
- [ ] Lighthouse Performance ≥ 80 on `/` (mobile profile, throttled)

## 11. Tests

- [ ] `bunx vitest run` — all green
- [ ] Smoke route inventory matches `docs/smoke-tests.md`
- [ ] Manual walk of `docs/mobile-qa-checklist.md`

## 12. Final go/no-go

- [ ] Owner has signed `docs/app-store-readiness.md`
- [ ] Privacy policy URL listed in App Store / Play Console (when applicable)
- [ ] Support email confirmed monitored daily
- [ ] Rollback plan: previous published version known and accessible

---

**Last reviewed:** 2026-04-25 (Phase 10G)
