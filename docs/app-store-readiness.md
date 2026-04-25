# QMAPS — App Store / Install Readiness (Phase 10B)

This document tracks what is required to ship QMAPS as an installable mobile
experience (PWA / TWA / iOS home-screen) and, eventually, to a public app
store. It is **a checklist, not a guarantee** — submission still requires
manual review by a human owner.

> Status: Foundation ready. No service worker is bundled (per Lovable preview
> guidance). Install + Add-to-Home-Screen work today; full offline support
> is intentionally deferred.

---

## 1. PWA / Web Manifest

- [x] `public/manifest.webmanifest` present
- [x] `name` = "QMAPS — Commerces & avis Montréal"
- [x] `short_name` = "QMAPS"
- [x] `description` populated (FR)
- [x] `start_url` = `/`
- [x] `scope` = `/`
- [x] `display` = `standalone`
- [x] `orientation` = `portrait`
- [x] `theme_color` = `#cf1f1f` (matches `<meta name="theme-color">`)
- [x] `background_color` = `#fafafa`
- [x] `lang` = `fr-CA`
- [x] Icons: 192, 512, maskable, apple-touch
- [ ] Replace SVG icon placeholders with branded PNG/WebP exports (designer)
- [ ] Add `screenshots[]` to manifest once marketing screenshots exist

## 2. Android (PWA / TWA)

- [x] HTTPS served (Lovable hosting)
- [x] Web manifest linked from `index.html`
- [x] Install criteria: name, short_name, icons, start_url, display
- [ ] Lighthouse PWA score ≥ 90 (run on published URL before submission)
- [ ] If shipping via Play Store: wrap with **Bubblewrap / TWA**
  - [ ] Digital Asset Links (`/.well-known/assetlinks.json`)
  - [ ] Signed APK / AAB
  - [ ] Privacy Policy URL
  - [ ] Data safety form (see §6)

## 3. iOS (Home-Screen install)

- [x] `apple-mobile-web-app-capable=yes`
- [x] `apple-mobile-web-app-status-bar-style=black-translucent`
- [x] `apple-mobile-web-app-title=QMAPS`
- [x] `apple-touch-icon` linked
- [x] Viewport `viewport-fit=cover` for safe-area
- [ ] Provide PNG `apple-touch-icon` 180×180 (currently SVG placeholder)
- [ ] Splash images per device (optional, deferred)

## 4. Screenshots needed (for store / marketing)

Take on a real device or 390×844 viewport, in both FR locales:

- [ ] Home `/`
- [ ] Search `/search` with results
- [ ] Business detail `/business/:id`
- [ ] Reviews tab on a business
- [ ] Projects directory `/projects`
- [ ] Merchant home `/merchant/home` (logged in as merchant)
- [ ] Merchant analytics `/merchant/analytics`
- [ ] Sponsored placement on `/`

## 5. Privacy & legal

- [x] Public Privacy Policy URL → `/privacy`
- [x] Public Terms of Service URL → `/terms`
- [x] Account deletion policy → `/account-deletion-policy`
- [x] Support policy → `/support-policy`
- [ ] Cookie / tracking disclosure
- [x] Children's policy (13+ in Terms §1)
- [x] Account deletion path (in-app **and** documented)

## 6. Data deletion / user rights

- [ ] In-app: "Delete my account" entry in `/settings`
- [ ] Email or form-based fallback path
- [ ] Document what is deleted vs. anonymized:
  - [ ] `profiles`
  - [ ] `reviews` (anonymize, do not delete; preserves business avg_rating)
  - [ ] `bookmarks`, `collections`, `collection_items`
  - [ ] `messages`, `conversations`
  - [ ] `notifications`
  - [ ] `recommendation_events`, `recommendation_feedback`
  - [ ] `business_claims` for unowned businesses
- [ ] Document retention window for moderation/audit data

## 7. Contact / support

- [x] Support page route `/support`
- [ ] Public support email (e.g. `support@qmaps.app`)
- [ ] Response-time SLA published
- [ ] Abuse / DMCA contact

## 8. Permissions used

QMAPS does **not** require dangerous permissions today.

| Permission | Used? | Where | Notes |
|---|---|---|---|
| Location | Optional | Home / Search nearby | Browser geolocation, opt-in |
| Camera   | No | — | Future: review/photo capture |
| Notifications | No | — | Future: merchant leads / messages |
| Storage | Local only | Auth session | Supabase auth tokens |

When new permissions are added, update this table **and** the privacy policy.

## 9. Known limitations

- **No service worker.** Per Lovable preview guidance, we do not register a
  service worker. Result: no offline page caching, no background sync, no
  push notifications. The app remains installable via the manifest.
- **Icons are SVG placeholders.** Functional, but should be replaced with
  branded PNG/WebP assets before formal store submission.
- **Splash screens not provided per iOS device size.** Optional; iOS will
  fall back to background_color + icon.

## 10. Submission checklist (final pass)

Before any store submission:

1. Run `bun run build` and deploy to the published URL.
2. Open Chrome DevTools → Lighthouse → PWA category on the published URL.
3. Verify install prompt appears on Android Chrome.
4. Verify "Add to Home Screen" works on iOS Safari.
5. Walk the **mobile QA checklist** (`docs/mobile-qa-checklist.md`).
6. Confirm privacy / terms / support URLs resolve.
7. Confirm account deletion path works end-to-end.
