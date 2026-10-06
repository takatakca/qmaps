# QMAPS — Front page real listings & TAKATAK integration notes

## Data source
The homepage renders **real rows only** from `public.businesses` (RLS public read of
active listings), joined to `business_categories -> categories` for a display label.
No mock/demo business is rendered anywhere on `/`.

Hook: `src/hooks/useHomeListings.ts`
- Filters: `is_active = true`, `status in (open, temporarily_closed, seasonal)`
- Sections derived client-side: `restaurants`, `popular`, `services`, `recent`, `essentials`
- Ranking: `avg_rating * 10 + min(reviews_count, 100) / 10`

Fields consumed by the card (`BusinessListingCard`):
`id, name, city, address, avg_rating, reviews_count, price_level, status, is_open,
is_active, is_claimed, image_url, photos, created_at`.

## Empty / no-photo behaviour
- No photo → category-based gradient + Lucide icon (`src/lib/listingVisuals.ts`).
- Empty section → honest empty message + category shortcuts + "Enregistrer votre entreprise" CTA.
  Never a fake business card.

## Language
`src/i18n/language.ts` holds a tiny FR/EN/ES store (localStorage `qmaps.lang`),
used by the homepage header switcher. Default: `fr` (Québec French).

## Header auth menu
`QuickAuthMenu` exposes Google OAuth (Lovable managed), email sign-in and the
SMS verification entry point (Twilio Verify, available after sign-in). No mock states.

## GROUPE TAKATAK ecosystem boundary (developer note)
- QMAPS is a child application of the GROUPE TAKATAK ecosystem (public marketplace + merchant discovery).
- QMAPS currently runs on its own auth, onboarding and listing system. A listings/reviews sync to TAKATAK is implemented but **disabled by default** (see below); nothing is sent until it is enabled.
- Future integration with TAKATAK Auth / TAKATAK Dashboard must go through a dedicated adapter/API/event boundary.
- QMAPS must not duplicate TAKATAK master identity, nor depend directly on another child application.
- UI only uses honest status labels (`StatusPill`: Connecté, Actif, Non configuré, Bientôt, À configurer). Never show a fake "connected" state.

## Listings & reviews sync to TAKATAK (contract v1)

QMAPS stays the source of truth. Business and review changes are queued and pushed to TAKATAK V1, which shows them in the linked client's Local Listings and Reviews dashboards.

- Contract: `takatak-v1` → `docs/QMAPS_LISTINGS_REVIEWS_SYNC.md`.
- Endpoint: `POST https://takatak.ca/api/integrations/qmaps/events`.

**Migration `20261006130000_takatak_listings_reviews_outbox.sql`:**
- `takatak_sync_settings` holds a single switch, `enabled`, which defaults to **false**.
- `takatak_outbox` is a private queue that `anon` and `authenticated` cannot read.
- Triggers on `businesses` (relevant columns only) and `reviews`:
  - Insert/edit → `REVIEW_UPSERTED`.
  - Delete or `moderation_status = 'hidden'` → `REVIEW_DELETED`.
  - Reaction counters never queue events.
- Triggers never raise: a queue failure only logs a warning, and the QMAPS write always succeeds.
- Reviewer privacy: only "First name + initial" leaves QMAPS. Email and account ids never do.
- Helpers (service role only):
  - `claim_takatak_outbox`
  - `mark_takatak_outbox_processed`
  - `mark_takatak_outbox_failed`: exponential backoff up to 6 h, and `dead` after a permanent 4xx or 12 attempts
  - `takatak_backfill()`

**Edge function `takatak-sync-outbox`:** claims queued events, signs each body (HMAC-SHA256 of `timestamp.eventId.body`), posts it to TAKATAK, then marks it processed or failed. It requires the `x-sync-runner-secret` header.

**Activation:**
1. Function secrets:
   - `TAKATAK_QMAPS_SYNC_URL`
   - `TAKATAK_QMAPS_SYNC_CLIENT_ID`
   - `TAKATAK_QMAPS_SYNC_WEBHOOK_SECRET` (identical to TAKATAK's `QMAPS_SYNC_*`)
   - `TAKATAK_SYNC_RUNNER_SECRET`
2. On TAKATAK, link each business to its client workspace:
   ```
   npm run qmaps:link -- --client <uuid> --business <uuid>
   ```
3. Turn the sync on:
   ```sql
   UPDATE public.takatak_sync_settings SET enabled = true WHERE id = 1;
   ```
   Optionally queue existing data with `SELECT public.takatak_backfill();`.
4. Schedule the function (e.g. every minute) with the runner secret header.

**Verified (2026-10-06):**
- **Database:** on PostgreSQL 16 with the exact QMAPS `profiles`/`businesses`/`categories`/`business_categories`/`reviews` definitions, the migration applied and re-ran cleanly, and:
  - while disabled, nothing was queued
  - a review queued the review plus the business rating update
  - reaction-only updates were ignored
  - hiding a review queued `REVIEW_DELETED`
  - no reviewer email or id appeared in the payloads
  - a broken queue did not block a business insert
  - claim, retry and dead-letter worked
  - `anon` was denied
- **End to end:** queued events were delivered with this signing scheme to a real TAKATAK V1 server, and all 5 were processed into the linked client's listing and reviews.
- The Deno function itself was not executed here (no Deno runtime). Its logic was mirrored by the test sender against the same SQL helpers.
