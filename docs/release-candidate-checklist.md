# QMAPS — Release Candidate Validation Checklist (Phase 13A)

_Last reviewed: 2026-04-25_

This checklist consolidates every gate from earlier phase docs into one
release-candidate sign-off. Use it for **each RC build** before tagging a
production publish. It mirrors the structure of `src/lib/launchChecks.ts`
so the in-app `/admin/launch-status` page and this doc stay aligned.

---

## 1. Environment & secrets

- [ ] `.env` populated locally (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`)
- [ ] `.env.example` matches required variables (see `docs/environment-setup.md`)
- [ ] Edge function secrets set in Lovable Cloud:
  - `STRIPE_SECRET_KEY` (live)
  - `STRIPE_WEBHOOK_SECRET` (live)
  - `LOVABLE_API_KEY` (auto-managed)
- [ ] No secrets committed to git history

## 2. Stripe / billing

- [ ] Stripe in **Live** mode
- [ ] Webhook endpoint registered → `https://<project>.functions.supabase.co/stripe-webhook`
- [ ] Live `STRIPE_WEBHOOK_SECRET` set
- [ ] Price IDs in `src/lib/billing.ts` match live prices
- [ ] End-to-end checkout + customer portal verified

## 3. Backend safety (Supabase / RLS)

- [ ] RLS enabled on every public table
- [ ] `supabase--linter` returns no critical warnings
- [ ] Stripe webhook reachable in live mode
- [ ] No reserved schema (`auth`, `storage`, `realtime`, `vault`) altered

## 4. SEO / PWA / legal

- [ ] `<Seo>` per route with unique title (<60) + description (<160)
- [ ] `public/robots.txt` references `/sitemap.xml`
- [ ] `public/manifest.webmanifest` valid (name, start_url, display, icons)
- [ ] All five legal routes load unauthenticated:
  - `/privacy`, `/terms`, `/cookies`, `/account-deletion-policy`, `/support-policy`
- [ ] Footers in `/settings` and `/more` link all five
- [ ] Canonicals use the live domain after publish

## 5. Mobile QA

- [ ] Walk `docs/mobile-qa-checklist.md` on real device
- [ ] Bottom nav tap targets ≥ 44×44 px
- [ ] Safe-area padding (`pb-safe`, `pt-safe`) respected on nav, sheets, modals
- [ ] No autozoom on input focus
- [ ] PWA installable on Android Chrome + iOS "Add to Home Screen"

## 6. Admin operational playbooks

- [ ] Reviews moderation — `docs/admin/reviews-playbook.md`
- [ ] Business claims — `docs/admin/business-claims-playbook.md`
- [ ] Account deletions — `docs/account-deletion-support-workflow.md`
- [ ] Sponsored campaigns — `docs/admin/sponsored-playbook.md`
- [ ] Billing & subscriptions — `docs/admin/billing-playbook.md`

## 7. Tests & build

- [ ] `bunx vitest run` — all green
- [ ] `bun run build` — succeeds, no fatal warnings
- [ ] GitHub Actions CI green on the release branch
- [ ] Smoke route inventory matches `docs/smoke-tests.md`

## 8. Rollback & on-call

- [ ] Previous published version recorded (for one-click rollback)
- [ ] On-call contact agreed for first 72h post-launch
- [ ] Support mailboxes monitored daily:
  - `support@qmaps.app`, `privacy@qmaps.app`, `abuse@qmaps.app`, `business@qmaps.app`
- [ ] Owner signed `docs/app-store-readiness.md`

---

**RC tag:** _________________  **Signed by:** _______________  **Date:** _________
