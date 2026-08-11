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
