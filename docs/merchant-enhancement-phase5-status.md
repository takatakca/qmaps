# Phase 5 — Business status enum

**Scope respected**: status only, no amenities work, no redesign, Phase 16
launch lock preserved.

## Schema change

A single additive column on `businesses`:

```sql
ALTER TABLE public.businesses
  ADD COLUMN status text NOT NULL DEFAULT 'open';

ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_status_check
  CHECK (status IN ('open','temporarily_closed','permanently_closed','seasonal','hidden'));

CREATE INDEX idx_businesses_status ON public.businesses(status);
```

`is_open` and `is_active` are intentionally **kept** so all existing
RLS policies, search filters, "Open now" pills, and consumer code keep
working without modification.

## Backfill

```sql
UPDATE public.businesses
SET status = CASE
  WHEN is_active = false THEN 'hidden'
  WHEN is_open   = false THEN 'temporarily_closed'
  ELSE 'open'
END
WHERE status = 'open'
  AND (is_active = false OR is_open = false);
```

This is a pure relabel — every row's visibility is exactly what it was
before. Two states (`seasonal`, `permanently_closed`) cannot be inferred
from the legacy booleans, so they remain unset until merchants pick them
explicitly via the editor.

## Public visibility (verified)

| Status | `is_active` | `is_open` | Public profile | Search/RLS | Public label |
|---|---|---|---|---|---|
| `open` | true | true | visible | included | none |
| `temporarily_closed` | true | false | visible | included | "Temporairement fermé" banner |
| `seasonal` | true | false | visible | included | "Saisonnier / En pause" banner |
| `permanently_closed` | false | false | hidden | excluded | n/a (RLS hides) |
| `hidden` | false | false | hidden | excluded | n/a (RLS hides) |

The existing `Businesses readable by everyone` RLS policy
(`is_active = true OR auth.uid() = owner_user_id`) already enforces this;
no policy changes were required.

## Files changed

- **Schema** — `businesses.status` text column + CHECK + index + backfill (one migration).
- **`src/lib/businessStatus.ts`** *(new)* — single source of truth: `BusinessStatus` type, `BUSINESS_STATUS_VALUES`, `STATUS_LABELS`, `readBusinessStatus`, `flagsForStatus`, `deriveLegacyStatus`, `isPubliclyVisibleStatus`.
- **`src/components/merchant/info/EditStatusModal.tsx`** — reads/writes `status` via the helper; writes `is_open`/`is_active` from `flagsForStatus(...)` so the boolean contract is never broken; loading-aware close.
- **`src/components/business/BusinessInfoTab.tsx`** — accepts optional `status`, renders a banner for `temporarily_closed`, `seasonal`, `permanently_closed`. (Hidden businesses never reach this view because RLS filters them out.)
- **`src/pages/BusinessDetail.tsx`** — passes `status` derived via `readBusinessStatus(business)` into the Info tab.
- **`src/pages/MerchantMarketplace.tsx`** — replaces ad-hoc 3-state pill with the canonical `STATUS_LABELS[currentStatus]` rendering, so all 5 states display correctly (including `seasonal` and `permanently_closed`, previously collapsed).
- **`src/test/businessStatus.test.ts`** *(new)* — 8 assertions covering the value set, legacy derivation, fallback precedence, flag mapping, public-visibility contract, and that `seasonal` ≠ `temporarily_closed`.

## Tests

- `businessStatus.test.ts` — 8/8 passing.
- `merchantCategoryEditor.test.ts` — 5/5 passing (no regression).
- `merchantNav.test.ts` — 9/9 passing (no route regression).

## Rollback

The change is fully additive:

- Drop the column to revert (no FKs, no consumers depend on it being present
  thanks to `readBusinessStatus`'s legacy fallback).
- Reverting the code alone is also safe — the column simply becomes unused.

## Confirmation

- No existing business row's visibility changed (backfill is a pure relabel).
- Pre-existing RLS, search, and "Open now" behavior are byte-identical.
- The 3 pre-existing unrelated test failures (`seo-assets`, build scripts)
  remain isolated; not in scope for this phase.

## Next

Awaiting review before **Phase 4** — amenities table + backfill.
