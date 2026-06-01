# Québec Data Reproducibility

_Last verified: 2026-05-19_

## Cities (1,090 rows)

- **Table**: `public.cities`
- **Schema migration**: `supabase/migrations/20260517020712_f77fd394-3f9f-4dfa-a88e-c3a66d04a3b7.sql`
- **Source of truth (frontend)**: `src/data/quebecCities.ts` (exports `QUEBEC_CITIES`, `QUEBEC_REGIONS`, `QUEBEC_MRCS`, `MONTREAL_BOROUGHS`)
- **Origin**: MAMH 2024–2025 financial profile (official Québec municipal list)
- **Re-seed procedure** (if needed in a fresh environment):
  1. Apply the migration above to create the table + RLS.
  2. Run `bun scripts/seed-cities.mjs` (regenerates from `quebecCities.ts`) — or paste the
     INSERT batch from the migration file into Lovable Cloud → SQL editor.
- **RLS**: public read; admin-only write.

## Categories (1,132 rows: 35 roots + 1,097 children)

- **Table**: `public.categories`
- **Source of truth (frontend)**: `src/data/quebecCategories.ts` (21 root sectors, 1,118 entries with parent/child links and stable slugs)
- **Reseed (automated)**:
  1. `node scripts/seed-categories.mjs` — writes `/tmp/qmaps-categories-seed.sql`.
     The SQL upserts by stable `slug` (`ON CONFLICT (slug) DO UPDATE`),
     resolves `parent_id` from the parent's slug so existing UUIDs are preserved,
     and runs total/duplicate/orphan integrity checks at the end.
  2. Paste the file into Lovable Cloud → SQL editor (service-role),
     or run `psql "$DATABASE_URL" -f /tmp/qmaps-categories-seed.sql`.
  3. Verify the four `SELECT` checks emitted at the bottom of the file:
     `total` ≥ 1,118, `roots` ≥ 21, `dup_slugs` = 0, `orphans` = 0.
- Re-running is safe and idempotent — no duplicates, no UUID churn.

## Integrity checks (run after any reseed)

```sql
-- expect 1,132
SELECT count(*) FROM categories;
-- expect 35
SELECT count(*) FROM categories WHERE parent_id IS NULL;
-- expect 0
SELECT count(*) FROM categories c
  WHERE c.parent_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM categories p WHERE p.id = c.parent_id);
-- expect 0
SELECT slug, count(*) FROM categories GROUP BY slug HAVING count(*) > 1;
```
