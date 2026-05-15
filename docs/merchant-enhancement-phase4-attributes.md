# Phase 4 — Amenities & Attributes System

Riskiest enhancement phase. Replaces the flat `amenities` text array with a
structured per-key attributes document, while keeping the legacy array
mirrored so nothing existing breaks.

## Schema / migration

Single migration:

```sql
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS attributes jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_businesses_attributes
  ON public.businesses USING gin (attributes);
```

- Default `'{}'::jsonb` → existing rows untouched.
- GIN index added so future filtering by attribute is cheap.
- No RLS changes; column inherits `businesses` policies.
- Linter warnings returned by the migration tool are all pre-existing
  (unrelated SECURITY DEFINER and "Extension in Public" warnings).

## Storage shape

```
businesses.attributes = {
  "boolean": { "<label>": true|false, ... },
  "single":  { "<group_id>": "<value>", ... },
  "multi":   { "<group_id>": ["<value>", ...], ... }
}
```

`group_id` values: `accessibility`, `amenities`, `diversity`, `eco_friendly`,
`family_amenities`, `food_ordering`, `miscellaneous`, `payments_boolean`,
`reservations`, `seating`, `services`, `other`, `accepted_cards`, `parking`,
`alcohol`, `wifi`, `large_party_gratuity`, `tip`.

## Backfill / backward compatibility

No SQL backfill — chosen for safety. Instead:

- **Read**: `parseAttributes()` reads `businesses.attributes`; if empty, it
  parses the legacy `amenities` array (`label` → boolean, `groupId::value` →
  choice). Pre-Phase-4 rows continue to render correctly on every public
  surface with zero data movement.
- **Write**: every save writes the structured JSON **and** mirrors a sorted
  legacy flat array into `amenities`. Old code that reads `amenities`
  (e.g. `BusinessVibeSection`, search filters) keeps working.

This means the migration is fully reversible: dropping the column does not
lose any data because every save is also written to the legacy array.

## Files changed

- New: `src/lib/businessAttributes.ts` — schema, parse, sanitize, serialize,
  display helpers.
- New: `src/test/businessAttributes.test.ts` — 16 tests.
- New: `supabase/migrations/<phase4 timestamp>.sql` — adds `attributes` column.
- Edited: `src/components/merchant/info/EditAmenitiesModal.tsx` — rebuilt
  around the structured state, added the **Miscellaneous** group, explicit
  Yes/No tri-state per option (unset / yes / no), grouped chip selectors,
  loading / dirty / saving / error / saved-notice states, save mirrors to
  both columns.
- Edited: `src/components/business/BusinessInfoTab.tsx` — accepts optional
  `attributes`, prefers structured display labels, falls back to legacy
  array when absent.
- Edited: `src/pages/BusinessDetail.tsx` — passes `attributes` down to
  `BusinessInfoTab`.

Untouched (intentionally):
- `/merchant/more`, `/merchant/menu` — out of scope.
- `EditAttributesModal` (payments/languages/accessibility chips writing to
  dedicated text[] columns) — left alone; not part of the amenities system.
- `BusinessVibeSection`, search filters — keep reading legacy `amenities`,
  which is still populated.

## Behavior

- All required groups render with all required options.
- Each Yes/No row tracks three states (unset, yes, no) and persists per key.
- Single-select groups (Wi-Fi, Alcohol, Large parties gratuity, Tip)
  collapse to one stored value.
- Multi-select groups (Accepted Cards, Parking) handle the `None` sentinel
  by clearing the rest.
- Save button is disabled until the user makes a real change.
- After save, the baseline is reset so dirty tracking is correct without a
  reload; refresh confirms persistence (round-trip parse test verifies this).
- Public profile renders `Drive-Thru`, `Wi-Fi: Free`, `Parking: Valet,
  Garage`, etc. — empty input renders nothing (no crash).

## Tests run

```
src/test/businessAttributes.test.ts        16 passed
src/test/businessStatus.test.ts             8 passed
src/test/merchantCategoryEditor.test.ts     5 passed
src/test/merchantOnboarding.test.ts         7 passed
src/test/merchantNav.test.ts                9 passed
src/test/smoke-routes.test.ts              63 passed
                                          ───────────
                                          108 passed
```

The 3 pre-existing unrelated failures (`seo-assets`, build scripts) remain
isolated and untouched.

## Known limitations

- Backfill is lazy (on next save). Until a merchant opens the editor and
  saves, `attributes` stays `'{}'` and reads fall back to the legacy array.
  Acceptable because public display is identical either way.
- No bulk admin UI for editing attributes across many businesses.
- The "Payments" boolean group only carries `Accepts cash` — full payment
  method chips remain in the separate `payment_methods` text[] column /
  `EditAttributesModal` to avoid scope creep.

## Rollback plan

1. Set `EditAmenitiesModal.handleSave` to skip the `attributes` field
   (one-line change) — writes revert to `amenities`-only.
2. If schema rollback is needed: `ALTER TABLE public.businesses DROP COLUMN
   attributes;` — no data lost because everything is mirrored to
   `amenities`.

## Phase 16 launch lock

- Public URLs and their RLS policies untouched.
- `business.amenities` continues to receive every selection.
- `BusinessVibeSection` and existing search filters unchanged.
