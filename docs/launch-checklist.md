# QMAPS — Phase 11 Production Launch Checklist

_Last reviewed: 2026-04-25_

This is the **single-page launch dashboard**. Walk through each section in
order before the public production launch. For ongoing pre-publish checks,
see `docs/deployment-checklist.md`.

---

## 1. Environment & secrets

- [ ] `.env` populated:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - `VITE_SUPABASE_PROJECT_ID`
- [ ] `.env.example` kept in sync with required variables (see `docs/environment-setup.md`)
- [ ] Edge function secrets configured:
  - `STRIPE_SECRET_KEY` (live)
  - `STRIPE_WEBHOOK_SECRET` (live)
  - `LOVABLE_API_KEY` (auto-managed)
- [ ] No secret values committed to source

## 2. Public legal & support routes (must resolve in production)

| Route | Purpose |
|-------|---------|
| `/privacy` | Privacy policy (EN/FR) |
| `/terms` | Terms of service (EN/FR) |
| `/cookies` | Cookies & tracking disclosure (EN/FR) |
| `/account-deletion-policy` | Deletion policy (EN/FR) |
| `/support-policy` | Support policy + mailto contact form |
| `/sitemap.xml` | Includes all five legal routes |

- [ ] All routes load without auth
- [ ] EN/FR toggle persists across pages
- [ ] Footers in `/settings` and `/more` link all five

## 3. Support email mailboxes (monitored daily)

- [ ] `support@qmaps.app`
- [ ] `privacy@qmaps.app`
- [ ] `abuse@qmaps.app`
- [ ] `business@qmaps.app`

## 4. Admin operational playbooks (linked from `docs/admin/`)

- [ ] Reviews moderation — `docs/admin/reviews-playbook.md`
- [ ] Business claims — `docs/admin/business-claims-playbook.md`
- [ ] Account deletions — `docs/account-deletion-support-workflow.md`
- [ ] Sponsored campaigns — `docs/admin/sponsored-playbook.md`
- [ ] Billing & subscriptions — `docs/admin/billing-playbook.md`

## 5. Backend safety

- [ ] RLS enabled on every public table
- [ ] `supabase--linter` returns no critical warnings
- [ ] Stripe webhook reachable in live mode

## 6. Frontend / PWA

- [ ] Manifest validated, icons referenced (192/512/maskable + 180 apple)
- [ ] Theme color matches manifest
- [ ] Lighthouse PWA = installable
- [ ] No service worker registered (intentional)

## 7. SEO

- [ ] `<Seo>` set per route
- [ ] Canonicals use the live domain
- [ ] `robots.txt` allows crawling of public routes

## 8. Tests & build

- [ ] `bunx vitest run` — all green
- [ ] `bun run build` — succeeds, no fatal warnings
- [ ] GitHub Actions CI passes on the release branch

## 9. Final go/no-go

- [ ] Owner signed `docs/app-store-readiness.md`
- [ ] Rollback plan documented (previous published version known)
- [ ] On-call contact agreed for first 72h post-launch

---

**Sign-off:** _________________________  **Date:** ____________
