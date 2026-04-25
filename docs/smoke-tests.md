# QMaps — Production Smoke Test Checklist (Phase 9A)

Lightweight, manual + automated smoke coverage for the main app surfaces.
Run after every notable deploy. Programmatic part lives in
`src/test/smoke-routes.test.ts` and asserts the routes below are wired in
`src/App.tsx`. The behavioural checks are manual until a full E2E harness
(Playwright/Cypress) is added in a later phase.

For RLS-specific regression, see `docs/sponsored-rls-regression.md` and the
**Phase 9B** section at the bottom of this file.

---

## How to run the route inventory test

```bash
bunx vitest run src/test/smoke-routes.test.ts
```

The test fails if any route in `SMOKE_ROUTES` (below) is missing from
`App.tsx`. When you add new top-level routes, mirror them here.

---

## Phase 9A — Behavioural smoke flows

### 1. Guest browsing (no auth)

| # | Route | Expect |
|---|---|---|
| 1 | `/` | Home renders, featured + nearby + trending sections, no console errors |
| 2 | `/search` | Search bar usable, filters open, results render |
| 3 | `/business/:id` | Business detail loads (hero, info, reviews, ask, menu tabs) |
| 4 | `/c/:categorySlug` | Category page lists businesses, SEO `<title>` matches category |
| 5 | `/city/:citySlug` | City page lists businesses |
| 6 | `/city/:citySlug/:categorySlug` | Combined city+category filters work |
| 7 | `/sitemap.xml` | XML output served, contains city + category URLs |
| 8 | `/projects` | Project request directory loads (read-only) |
| 9 | Sponsored slot on `/` | At most N approved active campaigns shown, "Sponsorisé" badge visible |
| 10 | Click sponsored card | Navigates to `/business/:id`, click event recorded |

### 2. Authenticated user

Pre-req: signed in via `/auth`.

| # | Action | Expect |
|---|---|---|
| 1 | Bookmark a business | Heart toggles; row appears under `/collections` |
| 2 | Write a review (`/add-review`) | Saved; visible on business detail; counts update |
| 3 | React to a review | Reaction count updates instantly |
| 4 | Create a collection | Visible in `/collections`; can add a business |
| 5 | `/notifications` | Lists own notifications; mark-as-read works |
| 6 | `/messages` → `/messages/new` → `/messages/:id` | Conversation create + send + receive |
| 7 | `/my-reviews`, `/my-activity` | Show only the current user's data |
| 8 | `/edit-profile`, `/settings/*` | Save settings, no cross-user leakage |

### 3. Merchant flows

Pre-req: signed in as merchant (claimed business).

| # | Route | Expect |
|---|---|---|
| 1 | `/merchant` / `/merchant/home` | Dashboard renders with owned business |
| 2 | `/merchant/business-info` | Edits persist (name, hours, address, amenities) |
| 3 | `/merchant/services` | Service categories + areas save |
| 4 | `/merchant/leads` | Project leads visible only for matching categories |
| 5 | `/merchant/analytics` | Impressions/views chart loads, no 401 |
| 6 | `/merchant/billing` | Plan + subscription state visible |
| 7 | `/merchant/billing/plans` | Plan list; checkout button calls edge fn |
| 8 | `/merchant/sponsored` | Lists own campaigns; can create draft + submit |
| 9 | `/merchant/photos`, `/merchant/inbox`, `/merchant/notifications` | Owner-scoped data only |

### 4. Admin flows

Pre-req: signed in as admin (`user_roles.role = 'admin'`).

| # | Route | Expect |
|---|---|---|
| 1 | `/admin` | Dashboard counts render |
| 2 | `/admin/reports` | Open/closed reports list; status update works |
| 3 | `/admin/businesses` | All businesses visible, edit works |
| 4 | `/admin/reviews` | Delete review works |
| 5 | `/admin/photos` | Delete photo works |
| 6 | `/admin/projects` | All project requests visible |
| 7 | `/admin/users` | List users, role assignment works |
| 8 | `/admin/sponsored` | Pending campaigns; approve/reject (with mandatory note)/pause/end |

### 5. Stripe / billing fallback

| # | Scenario | Expect |
|---|---|---|
| 1 | Stripe secrets **not** configured | Plans page renders informational placeholder; no JS error |
| 2 | Click "Upgrade" without provider | Toast/inline message, no edge-fn 500 spam |
| 3 | Configured + checkout returns 200 | Redirect to Stripe checkout URL |
| 4 | Webhook receives `checkout.session.completed` | `merchant_subscriptions.status` flips to `active` |
| 5 | Webhook receives `customer.subscription.deleted` | Status → `canceled`, `cancel_at_period_end` updated |

### 6. SEO routes

| # | Route | Expect |
|---|---|---|
| 1 | `/c/:slug` | `<title>` + meta description from `Seo` component, matches category |
| 2 | `/city/:slug` | Title contains city name, canonical points to public URL |
| 3 | `/business/:id` | Title = business name; JSON-LD present (LocalBusiness) |
| 4 | `/sitemap.xml` | `Content-Type` ≈ XML; lists categories + cities; lazy 200 |

---

## Phase 9B — RLS regression checklist

Most queries live in `docs/sponsored-rls-regression.md`. Additional
cross-feature checks:

### Messages / notifications

```sql
-- As user A (set request.jwt.claims.sub), reading user B's messages must return 0 rows
SELECT count(*) FROM public.messages WHERE sender_id = '<USER_B_ID>';

-- As user A, inserting a notification for user B must fail
INSERT INTO public.notifications (user_id, title, body, type)
VALUES ('<USER_B_ID>', 'x', 'y', 'system');  -- expect: no INSERT policy → fail
```

### Businesses / merchant edits

```sql
-- Merchant A cannot UPDATE merchant B's business
UPDATE public.businesses SET name = 'hacked' WHERE id = '<BIZ_OF_B>';
-- expect: 0 rows updated (RLS Using auth.uid() = owner_user_id)
```

### Sponsored campaigns

```sql
-- Owner cannot self-approve (status check on UPDATE WITH CHECK)
UPDATE public.sponsored_campaigns SET status = 'approved' WHERE id = '<OWN_CAMPAIGN>';
-- expect: violates RLS → fail

-- Public anon SELECT only sees approved + active
SET ROLE anon;
SELECT id, status FROM public.sponsored_campaigns;
-- expect: only rows with status='approved' AND date window valid

-- Event insert with mismatched business_id must fail
INSERT INTO public.sponsored_campaign_events
  (campaign_id, business_id, event_type)
VALUES ('<CAMP_ID>', '<OTHER_BIZ_ID>', 'impression');
-- expect: violates RLS → fail
```

### Admin reach

```sql
-- As admin, can SELECT every campaign and every report
SELECT count(*) FROM public.sponsored_campaigns;  -- expect: full count
SELECT count(*) FROM public.reports;              -- expect: full count
```

---

## Phase 9C — Performance checklist (deferred)

Queued for later; tracked here so it's not forgotten.

- Lazy-load `pages/admin/*` via `React.lazy` + `<Suspense>`.
- Lazy-load `pages/Merchant*` (heavy dashboards).
- Lazy-load `pages/MerchantBilling*` (Stripe SDK is already edge-side, but
  the billing pages pull big subtrees).
- Lazy-load chart-heavy pages (`MerchantAnalytics`).
- Consider `manualChunks` for `react`, `radix`, `supabase`, `stripe`.
- Confirm no public discovery page imports an admin or merchant page.
