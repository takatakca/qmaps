# QMAPS — Mobile QA Checklist (Phase 10B)

Run through this on a real device (or DevTools 390×844) before any release.
Pair with `docs/smoke-tests.md` for behaviour coverage and
`docs/app-store-readiness.md` for store submission.

---

## 0. Setup

- [ ] Test on iOS Safari (latest)
- [ ] Test on Android Chrome (latest)
- [ ] Test on a low-end Android (slow network) at least once per release
- [ ] Throttle to "Slow 4G" in DevTools for one full pass

## 1. Guest flows

- [ ] `/` loads, hero/featured/nearby render, no console errors
- [ ] Bottom nav visible above iOS home indicator (safe-area)
- [ ] Tap targets ≥ 44px (BottomNav, MerchantBottomNav)
- [ ] Sponsored slot shows "Sponsorisé" badge, tap → business detail
- [ ] `/search` opens, filters sheet pads above iOS home indicator
- [ ] `/business/:id` hero, tabs (info/reviews/ask/menu) all reachable
- [ ] `/projects` directory loads read-only
- [ ] `/c/:slug` and `/city/:slug` load without layout shift

## 2. Auth (login / signup)

- [ ] `/auth` renders form, keyboard does not cover submit button
- [ ] Email signup works; verification email arrives
- [ ] Login persists across app reopen (PWA installed mode)
- [ ] Logout clears session
- [ ] Protected routes redirect to `/auth` when logged out

## 3. Search

- [ ] Typing in search bar does not lag on low-end device
- [ ] Filters sheet opens, scroll works inside sheet
- [ ] Result tap navigates to business detail
- [ ] Back button returns to search with state intact
- [ ] `search_click` event tracked (verify in network tab once)

## 4. Business detail

- [ ] Hero image loads, lazy loading not blocking layout
- [ ] Bookmark heart toggles, optimistic UI
- [ ] Review tab loads; hidden reviews **never** appear publicly
- [ ] "Ask" tab can submit a question (if logged in)
- [ ] Share sheet opens, copy link works
- [ ] Report button reachable, opens dialog

## 5. Reviews

- [ ] `/add-review` requires login; reachable from business detail
- [ ] Star rating tappable on small screens
- [ ] Submit creates review; counts update on business detail
- [ ] Reactions work (useful/funny/cool)

## 6. Projects

- [ ] `/projects` lists requests
- [ ] "Start project" sheet opens, scroll works, submit succeeds
- [ ] Merchant: project leads visible only for matching categories

## 7. Merchant dashboard

- [ ] `/merchant/home` loads with owned business
- [ ] Merchant bottom nav respects safe-area
- [ ] `/merchant/business-info` edit modals open without overflow
- [ ] `/merchant/analytics` chart fits viewport, no horizontal scroll
- [ ] `/merchant/sponsored` create + submit draft works
- [ ] `/merchant/billing/plans` renders even without Stripe configured

## 8. Admin access (must be blocked on mobile for non-admins)

- [ ] As regular user, `/admin` redirects (does not flash content)
- [ ] As regular user, `/admin/review-moderation` redirects
- [ ] As admin, all `/admin/*` routes load
- [ ] Admin pages do not appear in bottom nav for non-admins

## 9. Offline banner

- [ ] DevTools → Network → Offline → banner appears at top
- [ ] Banner respects `pt-safe` (does not collide with notch)
- [ ] Re-enable network → banner disappears
- [ ] Sensitive admin pages not cached (no SW present, so N/A — verify no SW registered)

## 10. Safe-area / layout

- [ ] No content hidden behind iOS notch on `/`
- [ ] No content hidden behind iOS home indicator on `/messages/:id`
- [ ] Sheets/dialogs scroll internally; submit buttons visible
- [ ] Modal close buttons reachable with one thumb
- [ ] Landscape: app remains usable (orientation locked to portrait in manifest)

## 11. Performance

- [ ] First load on 4G < 5s to interactive
- [ ] Lazy chunks load on route change without blank flash
- [ ] Skeleton fallback visible during route transitions
- [ ] No console errors during a full guest → auth → merchant walkthrough

## 12. Install / PWA

- [ ] Android Chrome shows "Install app" prompt after engagement
- [ ] Installed app launches in standalone mode (no browser chrome)
- [ ] iOS "Add to Home Screen" uses correct icon + title
- [ ] App icon respects safe area (maskable variant)

---

## Sign-off

| Tester | Device | Date | Pass? | Notes |
|---|---|---|---|---|
|  |  |  |  |  |
