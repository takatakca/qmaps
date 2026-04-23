
Build QMAPS incrementally on top of the current Lovable/Vite app without deleting or regenerating anything. Keep `src/main.tsx`, `src/App.tsx`, existing routes, current Supabase integration, existing merchant flows, and all current pages/components intact. Only add new files and apply minimal surgical edits where required.

1. Existing files/components to reuse
- App shell and boot: `src/main.tsx`, `src/App.tsx`, `index.html`
- Auth foundation: `src/hooks/useAuth.tsx`, `src/pages/Auth.tsx`, `src/pages/ResetPassword.tsx`
- Consumer discovery flow: `src/pages/Index.tsx`, `src/pages/Search.tsx`, `src/pages/BusinessDetail.tsx`, `src/components/SearchBar.tsx`, `src/components/CategoryRow.tsx`, `src/components/BusinessCard.tsx`
- Navigation: `src/components/BottomNav.tsx`, `src/components/MerchantBottomNav.tsx`
- Consumer account screens: `src/pages/Profile.tsx`, `src/pages/Collections.tsx`, `src/pages/Notifications.tsx`, `src/pages/Activity.tsx`, `src/pages/Messages.tsx`
- Review/photo entry points: `src/pages/AddReview.tsx`, `src/pages/AddPhoto.tsx`
- Merchant foundation: `src/components/ProtectedMerchantRoute.tsx`, `src/pages/MerchantDashboard.tsx`, `src/pages/MerchantOnboarding.tsx`, `src/pages/MerchantMarketplace.tsx`, `src/pages/MerchantOptimization.tsx`, existing merchant info modals
- Existing backend entities already live: `profiles`, `user_roles`, `businesses`, `categories`, `business_categories`, `reviews`, `bookmarks`, photo bucket, rating trigger, role helper

2. Existing files that need minimal edits
- `index.html` — replace placeholder title/meta with QMAPS/Takatak metadata only
- `src/App.tsx` — append new routes for new screens; preserve all existing routes
- `src/components/BottomNav.tsx` — carefully expand to the requested bottom-tab IA while preserving current links
- `src/pages/Index.tsx` — enhance into search home with nearby/trending/featured sections using existing query patterns
- `src/pages/Search.tsx` — add distance/open-now filters and improved result composition
- `src/pages/AddReview.tsx` and `src/pages/AddPhoto.tsx` — keep current picker UX, add true nearby suggestions and next-step submission flows
- `src/pages/BusinessDetail.tsx` — enrich with categories, media, related businesses, messaging/project CTA wiring
- `src/pages/Profile.tsx`, `src/pages/Collections.tsx`, `src/pages/Notifications.tsx`, `src/pages/Activity.tsx`, `src/pages/Messages.tsx` — connect current placeholder UIs to live tables
- `src/pages/Projects.tsx` — turn existing QMAPS Projects landing screen into the service marketplace entry point
- `src/pages/MerchantDashboard.tsx`, `src/pages/MerchantOnboarding.tsx`, `src/pages/MerchantOptimization.tsx`, `src/pages/MerchantMarketplace.tsx` — extend current merchant experience rather than replace it
- `src/hooks/useAuth.tsx` — only if needed for profile hydration / role refresh improvements, preserving current auth behavior

3. New frontend files to add
Phase 1
- Shared data hooks/utilities:
  - `src/lib/business.ts` for business/category/result mapping
  - `src/lib/geo.ts` for distance formatting and geolocation helpers
  - `src/hooks/useNearbyBusinesses.ts`
- Review/photo flows:
  - `src/components/business/NearbyBusinessPicker.tsx`
  - `src/components/reviews/ReviewComposer.tsx`
  - `src/components/media/BusinessMediaUploader.tsx`
- Search/home enhancements:
  - `src/components/home/NearbySection.tsx`
  - `src/components/home/FeaturedBusinesses.tsx`
  - `src/components/home/TrendingCollections.tsx`
  - `src/components/search/SearchFiltersSheet.tsx`

Later phases
- Collections: collection detail/create/edit components and pages
- Messaging: conversation list/thread/composer components
- Activity feed: reusable feed cards and filter tabs
- Projects marketplace: request form, quote list, lead inbox, service-category cards
- Merchant leads/claims/admin placeholders: additive pages only

4. Additive backend migrations to create next
Phase 1 migrations only
- Migration A: extend existing schema for search and media
  - add `category_type` to `categories`
  - add geo/search support to `businesses` (geography point or equivalent generated location column, indexes, optional search vector/trigram support)
  - add validation/indexes for `businesses`, `reviews`, `bookmarks`, `business_categories`
- Migration B: add media tables
  - `review_photos`
  - `business_photos`
  - RLS for owner/uploader writes and public reads where appropriate
- Migration C: add business hours and structured amenities if needed
  - `business_hours`
  - optional `business_amenities` only if keeping a normalized model alongside current `businesses.amenities`
  - preserve existing `businesses.amenities` compatibility during rollout
- Migration D: add claim workflow foundation
  - `business_claims`
  - RLS for submitter, merchant/admin review access
- Migration E: strengthen ratings/search backend
  - trigger/index additions only; keep existing rating trigger and enhance rather than replace it

Later phase migrations
- `collections`, `collection_items`
- `notifications`
- `follows`, `review_reactions`
- `conversations`, `conversation_participants`, `messages`
- `events`
- `project_requests`, `project_request_media`, `merchant_service_areas`, `merchant_service_categories`, `project_quotes`, `project_quote_messages`
- `reports`
All new tables must get RLS, role-safe policies, and ownership rules. Roles stay in the separate `user_roles` table.

5. Implementation sequence
Phase 1: safe additive core
- Audit existing routes/types and preserve them
- Update metadata to QMAPS/Takatak
- Improve auth UX only where missing: forgot password polish, optional profile completion, keep current email/password flow
- Upgrade search home and search results using existing `businesses/categories/business_categories/reviews/bookmarks`
- Add nearby business picker powered by geolocation helper and backend distance query/fallback
- Make Add Review and Add Photo fully functional with persistence and media upload
- Keep bookmarks working and reuse them in profile/collections bridge state

Phase 2: consumer social/content
- Add real collections tables and connect current Collections page
- Replace mock notifications with live notifications
- Replace static activity feed with live All/Friends/Nearby feed
- Add follow/reaction foundations

Phase 3: messaging + merchant completion
- Add direct messaging tables/UI
- Add business claims workflow
- Add structured hours/amenities persistence where needed
- Extend existing merchant dashboard/marketplace instead of rebuilding

Phase 4: Projects marketplace
- Build on existing `src/pages/Projects.tsx`
- Add service categories, request form, merchant lead inbox, quotes, responses
- Connect project matching to merchant categories/service areas
- Keep branding QMAPS only

6. Key design/engineering rules for implementation
- Never delete existing pages, routes, migrations, or current merchant UI
- Prefer adapters/helpers over rewrites
- Preserve current `businesses` table compatibility while normalizing new features
- Do not edit generated Supabase client/types manually
- Add only new migrations under `supabase/migrations`
- Keep mobile-first layout and current component vocabulary
- Rebrand any leftover non-QMAPS text encountered during minimal edits
- For large scope, ship by phase; do not attempt the entire Yelp-equivalent platform in one destructive pass

7. What will sync and remain compatible
- Existing business cards, business detail, merchant pages, and bookmarks remain functional during expansion
- Current auth and role logic remain in place and are extended, not replaced
- Existing merchant marketplace and optimization work continues while new tables/features are introduced
- Existing data in `businesses`, `reviews`, `bookmarks`, `categories`, and `business_categories` remains valid

8. Confirmation
- Nothing existing will be deleted
- No current migration will be replaced
- No blank starter or regenerated app shell will be introduced
- Work will proceed as additive, minimal, and reversible changes on the current codebase only
