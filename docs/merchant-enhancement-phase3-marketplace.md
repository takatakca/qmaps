# Phase 3 — Marketplace / Vitrine functional hardening

**Scope respected**: no schema changes, no redesign, no feature expansion,
`/merchant/more` and `/merchant/menu` untouched, Phase 16 launch lock preserved.

## Sections audited (`MerchantMarketplace.tsx`)

| Section | State before | State after |
|---|---|---|
| Cover photo upload | Saved, but DB-update errors swallowed | Errors surfaced, file input reset |
| Add photo | Same as above | Errors surfaced, file input reset |
| Header / business name | OK (via `EditBasicInfoModal`) | OK + trim, null-on-empty, saving state |
| Categories | Editor opened **but no Add UI**, "Save" was a no-op, "Modifier" per-row was actually a delete | Full toggle list with search, diff-based insert/delete on `business_categories`, dirty-aware Save |
| CTA card | Hardcoded "10% de réduction" demo copy, links to `/merchant/cta` | Untouched (no schema for CTA — Phase 4/5) |
| Address | Backend-connected via `EditAddressModal` | Untouched |
| Phone / website | Backend-connected via `EditBasicInfoModal` | Trim + null normalization, saving state, modal re-syncs on prop change |
| Menu link field | Free-text input that **was never saved** | Removed; replaced with a button that opens `/merchant/menu` editor |
| Amenities | Backend-connected (text[]) | Untouched (Phase 4 will restructure) |
| Hours (display block) | Showed **hardcoded** "Ouvert 24 heures / 9:00 - 17:00" regardless of real data | Now renders `business.hours` text or empty-state CTA |
| Hours (editor) | Backend-connected via `EditHoursModal` | Untouched |
| Special hours | Backend-connected (`special_hours` jsonb) | Untouched |
| Specialties | Backend-connected via `EditSpecialtiesModal` (writes `description`) | Untouched |
| History | Modal **silently dropped** year + history input (no DB column) | Replaced with explicit "Bientôt disponible" notice — no input is shown that won't persist |
| Photos & videos | Backend-connected (`photos` text[]) | Error handling on upload |
| Slideshow / Highlights | Locked upgrade placeholders | Untouched |
| Status | Backend-connected via `EditStatusModal` | Untouched |

## Public sync (`/business/:id`) — verified

The public profile reads directly from `businesses` (and joined tables) so any
field persisted above flows through unchanged:

- `name`, `phone`, `website`, `address`, `city`, `region`, `postal_code`,
  `latitude`/`longitude`, `hours`, `special_hours`, `description` (specialties),
  `photos`, `image_url`, `is_open`, `is_active`, `is_claimed`,
  `payment_methods`, `languages`, `accessibility`, `amenities` —
  all already RLS-readable when `is_active = true`.
- `business_categories` (now properly written by the fixed editor) is exposed
  publicly via the `Business categories readable by all` policy.

## Fields still blocked by schema (Phase 4 / 5)

- **Menu link** — no `menu_link` column. Workflow now points to the dedicated
  `/merchant/menu` item editor, which already persists.
- **History / founded year** — no columns. Modal is now an honest stub.
- **CTA / promo banner** — no `cta_*` columns. Existing `/merchant/cta` page
  not modified in this phase.
- **Verification badge** — `is_claimed` is read-only from this surface; claim
  flow lives elsewhere and is unchanged.

## Files changed

- `src/components/merchant/info/EditBasicInfoModal.tsx` — drop unsaved
  `menuLink` input; add trim/null/saving state; re-sync on prop change.
- `src/components/merchant/info/EditCategoryModal.tsx` — full rewrite: search
  + toggle list, diff-based insert/delete, dirty-aware Save, loading state.
- `src/components/merchant/info/EditHistoryModal.tsx` — replace fake form
  with explicit "coming soon" notice; no more silent drops.
- `src/pages/MerchantMarketplace.tsx` — render real `business.hours`;
  surface DB-update errors on photo + cover upload; remove dead `parseHours`.
- `src/test/merchantCategoryEditor.test.ts` — new test pinning the fixes.

## Tests

- `src/test/merchantCategoryEditor.test.ts` — 5 assertions, all passing.
- `src/test/merchantNav.test.ts` — re-ran, still passing (no route regression,
  `/merchant/more` ≠ `/merchant/menu` still enforced).

## Pre-existing unrelated failures (carried, not addressed)

Same 3 from Phase 6 (`seo-assets`, build-script tests). Out of scope.

## Next

Awaiting review before **Phase 5** (status enum, optional) or
**Phase 4** (amenities table + backfill, schema change).
