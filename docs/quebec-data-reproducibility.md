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
- **Source of truth (frontend)**: `src/data/quebecCategories.ts` (21 root sectors, ~1,118 entries with parent/child links and stable slugs)
- **Seed strategy**: applied via service-role SQL in batches `/tmp/cb_01.sql … /tmp/cb_10.sql`,
  using `ON CONFLICT (slug) DO NOTHING` to preserve existing IDs.
- **Re-seed procedure** (fresh environment):
  1. Ensure `categories` table exists (created in earlier migration).
  2. Run `bun scripts/seed-categories.mjs` to regenerate batches from `quebecCategories.ts`.
  3. Execute the generated SQL in Lovable Cloud → SQL editor (service-role).
  4. Verify: `SELECT count(*) FROM categories;` should return ≥ 1,132.

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
