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
- QMAPS currently runs on its own auth, onboarding and listing system. No TAKATAK production sync exists.
- Future integration with TAKATAK Auth / TAKATAK Dashboard must go through a dedicated adapter/API/event boundary.
- QMAPS must not duplicate TAKATAK master identity, nor depend directly on another child application.
- UI only uses honest status labels (`StatusPill`: Connecté, Actif, Non configuré, Bientôt, À configurer). Never show a fake "connected" state.


## TAKATAK candidate matching adapter

Status: **CODE COMPLETE on feature branch; not production configured or verified**.

The first read-only server-to-server adapter is implemented as the Supabase Edge Function:

`takatak-match-businesses`

It exists to let TAKATAK ask QMAPS for candidate businesses for a service category and geographic need. R2F does **not** call this function directly.

### Request boundary

POST JSON, signed with product-specific HMAC credentials.

Headers:

```text
X-Integration-Id: <TAKATAK_QMAPS_INTEGRATION_ID>
X-Event-Id: <same value as body.requestId>
X-Timestamp: <unix seconds>
X-Signature: sha256=<HMAC hex>
```

Canonical signed value:

```text
<timestamp>.<eventId>.<rawBody>
```

The timestamp window is five minutes.

Required Edge Function secrets:

- `TAKATAK_QMAPS_INTEGRATION_ID`
- `TAKATAK_QMAPS_MATCHING_SECRET`
- standard Supabase `SUPABASE_URL`
- standard server-only `SUPABASE_SERVICE_ROLE_KEY`

Do not expose these to the browser.

### Version 1 payload

```json
{
  "version": 1,
  "requestId": "stable-correlation-id",
  "categorySlug": "plomberie",
  "city": "Montréal",
  "region": "QC",
  "postalCode": "H1H 1H1",
  "limit": 20
}
```

At least one of city, region or postalCode is required.

### Matching rules

1. The category must be an active QMAPS category.
2. Candidate businesses must explicitly offer the category through `merchant_service_categories`.
3. Businesses must be active and currently `open` or `seasonal`.
4. Existing QMAPS geographic semantics are preserved:
   - no service-area row configured → do not geographically filter the business;
   - otherwise every non-empty constraint on one service-area row must match;
   - postal prefix is more specific than city, then region.
5. Radius matching remains intentionally excluded until reliable coordinates exist for every request.

### Data minimization

The adapter returns only data TAKATAK needs for candidate selection:

- QMAPS business ID
- business name
- city / region / postal code
- claimed flag
- public rating / review count
- public status
- match scope

It does **not** return owner user IDs, phone numbers, email addresses, private messages, billing records or authentication data.

TAKATAK remains responsible for the R2F lead/project and final routing decision. QMAPS remains the source of its business/category/service-area data.

### Verification

`npm test` includes `src/test/takatakMatching.test.ts`, which verifies service-area semantics, specificity scoring, HMAC configuration references, and the privacy-minimized query surface.

Production status must remain **Not configured** until the Edge Function is deployed, secrets are installed through the approved secret manager, a real TAKATAK signed request succeeds in staging, and the result is verified.
