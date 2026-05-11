# Demo / Test Data Cleanup Plan (Phase 15J)

**Status:** Plan only. No automated deletion is performed by Lovable.
The owner must run any cleanup manually after exporting a backup.

## Principles

1. **Backup first.** Export `businesses`, `reviews`, `business_photos`,
   `business_menu_items`, `business_claim_requests`, `reports`, and
   `business_events` to CSV before any deletion.
2. **Soft-disable before deleting.** Prefer `is_active = false` over
   `DELETE` for businesses and categories so that audit trails and
   foreign keys remain intact.
3. **Prefer admin UI.** Use `/admin/businesses`, `/admin/reviews`,
   `/admin/categories`, etc. instead of raw SQL whenever possible.
4. **Never bulk-delete users.** Use the account deletion request flow.

## Identifying test data

### Businesses
Likely test rows:
- `name` matches `test`, `demo`, `sample`, `lorem`, `qmaps test`
- created by a known internal admin `user_id`
- `description ILIKE '%lorem ipsum%'`
- missing real address (`address IS NULL` OR `city IS NULL`)

```sql
-- READ-ONLY example (do not run blindly):
-- SELECT id, name, city, created_at, is_active
-- FROM public.businesses
-- WHERE name ILIKE ANY (ARRAY['%test%', '%demo%', '%sample%'])
--    OR description ILIKE '%lorem ipsum%';
```

### Reviews
- `comment ILIKE '%test%'` or very short comments (< 3 chars)
- `user_id` belongs to a known internal admin
- `rating = 0` (invalid)

### Photos / menu items
- `image_url` pointing at `placeholder.svg` or known stock URLs
- `business_id` already flagged as a test business

### Claims / reports / events
- Tied to a flagged test `business_id`
- `metadata->>'source' = 'test'` if present

## Safe cleanup workflow

1. Identify candidate IDs via the SELECTs above.
2. Export them to CSV (Lovable Cloud dashboard or `psql \copy`).
3. In `/admin/businesses`, set `is_active = false` for each candidate.
4. Re-run `bun run launch:check` and `bun run go:no-go:json`.
5. Only after a 7-day soak should hard `DELETE` be considered.

## Optional admin UI (deferred)

A future "Demo / Test Data Review" admin page could surface the SELECTs
above in read-only mode with an "Archive" (soft-disable) action. Phase
15J intentionally ships **no destructive admin UI**.

## Rollback

Soft-disabled rows can be reactivated by setting `is_active = true`.
Hard deletions are non-recoverable without the pre-cleanup CSV backup.
