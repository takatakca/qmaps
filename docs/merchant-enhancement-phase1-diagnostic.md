# Merchant Enhancement Pass — Phase 1: Diagnostic Report

**Date:** 2026-05-15
**Scope:** Read-only audit of the merchant / professional surface. No code changed.
**Context:** Reopening the Phase 16 release lock to execute a 7-phase merchant stabilization pass.

---

## Inventory: what exists today

### Merchant routes (from `src/App.tsx`)

All under `ProtectedMerchantRoute` (requires `merchant` or `admin` role) except auth/onboarding:

| Route | Component | Purpose |
|---|---|---|
| `/merchant/login`, `/merchant/register` | `MerchantAuth` | Auth |
| `/merchant/onboarding` | `MerchantOnboarding` | Create first business |
| `/merchant` | `MerchantDashboard` | Legacy dashboard (kept) |
| `/merchant/home` | `MerchantHome` | Bottom-nav tab 1 |
| `/merchant/optimization` | `MerchantOptimization` | Bottom-nav tab 2 |
| `/merchant/marketplace` | `MerchantMarketplace` | Bottom-nav tab 3 ("Vitrine") |
| `/merchant/messages` | `MerchantMessages` | Bottom-nav tab 4 |
| `/merchant/notifications` | `MerchantNotifications` | Bottom-nav tab 5 |
| `/merchant/more` | `MerchantMore` | Bottom-nav tab 6 ("Menu" = hamburger) |
| `/merchant/menu` | `MerchantMenu` | Food menu editor (linked from Business Info) |
| `/merchant/business-info` | `MerchantBusinessInfo` | Master section editor |
| `/merchant/photos` | `MerchantPhotos` | Photo manager |
| `/merchant/ads`, `/host`, `/connect`, `/upgrade`, `/highlights`, `/cta`, `/guest-manager`, `/inbox`, `/billing`, `/billing/plans`, `/leads`, `/services`, `/analytics`, `/sponsored` | various | Specialized tools |

### Bottom nav (`src/components/MerchantBottomNav.tsx`)

6 tabs: Accueil · Optimiser · Vitrine · Messages · Alertes · **Menu** (→ `/merchant/more`).
The "Menu" label here means *hamburger menu* (more screen), not the food menu. The food menu lives at `/merchant/menu`, reached only from `MerchantBusinessInfo`.

### Business Info sections (`MerchantBusinessInfo`)

11 sections, each opens a dedicated modal and persists to `businesses`:

1. Informations de base → `EditBasicInfoModal`
2. Catégories → `EditCategoryModal`
3. Heures d'ouverture → `EditHoursModal`
4. Heures spéciales → `EditSpecialHoursModal` (writes `special_hours` jsonb)
5. Adresse → `EditAddressModal`
6. Photos → `/merchant/photos`
7. Menu (food) → `/merchant/menu`
8. Spécialités → `EditSpecialtiesModal`
9. Historique → `EditHistoryModal`
10. Commodités et plus → `EditAmenitiesModal`
11. Paiements / langues / accessibilité → `EditAttributesModal`

---

## Findings — what is broken, static, or risky

### 🔴 Real bugs / placeholders

| # | Area | Finding | Severity |
|---|---|---|---|
| F1 | `MerchantBottomNav` | `unreadMessages` and `unreadNotifs` are hard-coded to `0`. A working `useUnreadCounts` hook already exists and is used by the public `BottomNav`. Trivial wiring miss. | **Medium** — UX regression vs. consumer side |
| F2 | `MerchantOnboarding.handleFinish` | Inserts a new `businesses` row with no duplicate guard. A merchant who revisits `/merchant/onboarding` (or double-submits) creates a second business they own. No unique constraint on `(owner_user_id)` and no pre-check. | **High** — data integrity |
| F3 | `EditAmenitiesModal` strings | Some hard-coded category titles (e.g. `"Family amenities"`) and copy in English ("Select the amenities you offer…") leak through. Should be French to match the rest of QMAPS. | **Low** — i18n consistency |
| F4 | `MerchantHome` greeting / public sync | Some Vitrine fields (CTA, highlights, guest manager) live in dedicated pages; need to verify each writes to a column the public `BusinessDetail` actually reads. | **Medium** — needs Phase 3 audit |

### 🟡 Architectural issues (not bugs, but called out by user)

| # | Area | Finding |
|---|---|---|
| A1 | `businesses.amenities` is `text[]` | `EditAmenitiesModal` parses a flat `text[]` back into grouped chips at read time (see `parseAmenities`). This works but is fragile: any string drift or admin edit breaks grouping, and there's no controlled vocabulary in the DB. A structured `business_attributes (business_id, key, value)` table would be cleaner. |
| A2 | Status model | `is_open` + `is_active` booleans encode 5 logical states. Works (`EditStatusModal` already does this), but "seasonal" and "temporarily_closed" collapse to the same row state — the public side cannot distinguish them. A single `status` enum column would be more honest. |
| A3 | Dual-role accounts | Already supported via `user_roles` table (one user can hold both `user` and `merchant`). What's *missing* is a UX path: the consumer auth page does not surface "I'm also a merchant," and `MerchantAuth` doesn't detect that the email is already a consumer and offer to add the merchant role on the existing account. Today it just calls `signUp` which fails on duplicate email. |
| A4 | Badge sources | `useUnreadCounts` queries `messages` + `notifications` directly with `.is_read = false` filtered by user. Realtime subscription is in place. Safe to reuse on merchant side. |

### 🟢 Already correct (no action needed)

- **Routes `/merchant/menu` vs `/merchant/more`** are intentional and distinct. Renaming either would break links from `MerchantBusinessInfo` and `CompletenessCard`. **Recommendation: keep both, only relabel the bottom-nav tab if confusion persists** (e.g. "Plus" instead of "Menu").
- **No "Yelp" wording remains** in `src/`, `public/`, or `index.html` (`rg -i yelp` returns 0 hits).
- **Status modal** (`EditStatusModal`) already covers all 5 states the user listed.
- **Structured attributes** for payments/languages/accessibility already use dedicated `text[]` columns (`payment_methods`, `languages`, `accessibility`) — not loose text.
- **Public visibility** is enforced by RLS: `businesses` SELECT policy requires `is_active = true OR auth.uid() = owner_user_id`. Hidden status (sets `is_active = false`) correctly removes business from public listing.
- **Special hours** persist to `special_hours` jsonb. Tests exist (`src/test/specialHours.test.ts`).
- **Merchant subscriptions / billing / Stripe webhook** are wired and tested.

---

## Backend / schema risks if we proceed

| Phase | Schema change required? | Risk |
|---|---|---|
| Phase 2 (route cleanup) | None | Low — relabel only |
| Phase 3 (Marketplace hardening) | None expected | Low — verify column-by-column public read |
| Phase 4 (structured amenities) | **Yes** — new `business_attributes` table OR new jsonb column. Migration + backfill from existing `amenities` text[]. | **Medium** — backfill needed; reviews/recommendations don't depend on this column |
| Phase 5 (status system) | **Optional** — could add `status` enum column; backwards-compat with `is_open`/`is_active` derivation. | Medium if we change semantics; low if additive |
| Phase 6 (dual-role auth) | None | Low — UX only; roles already in `user_roles` |
| Phase 7 (final test pass) | None | Low |

**Will require user action before merging:**
- Phase 4 migration approval
- Phase 5 migration approval (if we add `status` enum)
- Re-running Phase 15J / 16 release lock after all phases land

**Will NOT require user action:**
- Phase 2, 3, 6, 7 (code-only)
- No new secrets needed
- No Stripe / edge function changes

---

## Files affected (predicted)

### Phase 2 — routing
- `src/components/MerchantBottomNav.tsx` (relabel "Menu" → "Plus", or keep)
- `src/test/smoke-routes.test.ts` (already covers `/merchant/more`)

### Phase 3 — Marketplace public sync audit
- `src/pages/MerchantMarketplace.tsx`, `MerchantHighlights.tsx`, `MerchantCTA.tsx`, `MerchantGuestManager.tsx`
- `src/pages/BusinessDetail.tsx` (verify reads)

### Phase 4 — amenities
- New migration: `business_attributes` table + RLS
- `src/components/merchant/info/EditAmenitiesModal.tsx`
- `src/components/merchant/MerchantOverview.tsx` (reads)
- `src/lib/businessCompleteness.ts`

### Phase 5 — status
- Optional migration adding `status` enum
- `src/components/merchant/info/EditStatusModal.tsx`
- `src/lib/searchFilters.ts` (filter by status)

### Phase 6 — auth
- `src/pages/MerchantAuth.tsx`
- `src/hooks/useAuth.tsx` (helper to add role to existing account)

### Phase 7 — tests
- New: `src/test/merchantOnboarding.test.ts`, `merchantBadges.test.ts`, expand existing.

---

## Confirmation: nothing was changed in Phase 1

This phase is read-only. No files edited, no migrations run, no tests added. The release-lock state from Phase 16 is unchanged at the code level until Phase 2 begins.

---

## Recommended phase ordering

Given the release was already GO, I recommend:

1. **Phase 2 first** (lowest-risk, no schema): nav + routes
2. **Phase 6** (auth dual-role) — also no schema
3. **Phase 3** (Marketplace sync audit) — code-only
4. **Phase 5** (status, additive) — small migration
5. **Phase 4** (structured amenities) — biggest migration, do last before tests
6. **Phase 7** — full regression + re-lock

Awaiting confirmation to proceed to Phase 2.
