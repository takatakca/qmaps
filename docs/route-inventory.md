# QMAPS — Route Inventory (Phase 15J)

Generated from `src/App.tsx`. Indexable = exposed in sitemap and crawlable.

## Public routes (indexable)

| Route | Auth | Indexable |
|---|---|---|
| `/` | none | ✅ |
| `/search` | none | ✅ |
| `/c/:categorySlug` | none | ✅ |
| `/city/:citySlug` | none | ✅ |
| `/city/:citySlug/:categorySlug` | none | ✅ |
| `/business/:id` | none | ✅ |
| `/release-notes` | none | ✅ |

## Legal routes (indexable)

| Route | Auth | Indexable |
|---|---|---|
| `/privacy` | none | ✅ |
| `/terms` | none | ✅ |
| `/cookies` | none | ✅ |
| `/account-deletion-policy` | none | ✅ |
| `/support-policy` | none | ✅ |

## Auth routes (not indexed)

| Route | Auth | Indexable |
|---|---|---|
| `/auth` | none | ❌ |
| `/reset-password` | none | ❌ |
| `/merchant/login` | none | ❌ |
| `/merchant/register` | none | ❌ |
| `/merchant/onboarding` | merchant | ❌ |

## Authenticated user routes (not indexed)

`/profile`, `/collections`, `/projects`, `/projects/:id`, `/more`,
`/notifications`, `/add-business`, `/add-review`, `/add-photo`,
`/my-reviews`, `/qr-code`, `/messages`, `/messages/new`,
`/messages/:id`, `/compliments`, `/events`, `/activity`,
`/added-businesses`, `/settings`, `/settings/*`, `/support`,
`/preferences`, `/edit-profile`, `/talk`, `/my-activity`.

All require sign-in. None should appear in the sitemap.

## Merchant routes (`ProtectedMerchantRoute`)

`/merchant`, `/merchant/home`, `/merchant/optimization`,
`/merchant/marketplace`, `/merchant/messages`, `/merchant/notifications`,
`/merchant/more`, `/merchant/ads`, `/merchant/host`, `/merchant/connect`,
`/merchant/upgrade`, `/merchant/highlights`, `/merchant/cta`,
`/merchant/business-info`, `/merchant/guest-manager`,
`/merchant/photos`, `/merchant/menu`, `/merchant/inbox`,
`/merchant/billing`, `/merchant/billing/plans`, `/merchant/leads`,
`/merchant/services`, `/merchant/analytics`, `/merchant/sponsored`.

Disallowed in `robots.txt`. Not in sitemap.

## Admin routes (`ProtectedAdminRoute`)

`/admin`, `/admin/reports`, `/admin/businesses`, `/admin/reviews`,
`/admin/photos`, `/admin/projects`, `/admin/sponsored`, `/admin/users`,
`/admin/review-moderation`, `/admin/account-deletions`,
`/admin/launch-status`, `/admin/claims`, `/admin/owner-transfers`,
`/admin/audit-logs`, `/admin/categories`.

Disallowed in `robots.txt`. Not in sitemap.

## Internal / generated

| Route | Purpose | Indexable |
|---|---|---|
| `/sitemap.xml` | XML sitemap | itself, not listed inside |
| `*` | NotFound 404 | ❌ |

## Verification

- `public/robots.txt` disallows `/admin`, `/merchant`, `/auth/callback`.
- `src/pages/Sitemap.tsx` only emits public + legal routes.
