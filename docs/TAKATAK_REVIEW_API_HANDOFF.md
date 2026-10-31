# QMAPS → TAKATAK Review — API handoff

2026-10-31 — BEFORE / requested by owner — **REVEW**

The owner asked REVEW to leave notes for QMAPS to provide its review section and its own business/review API credentials for the TAKATAK review cockpit. This is a counterpart implementation request, not proof of an activated integration.

## Existing code inspected — reuse it

- QMAPS main `6e73f0f`: `BusinessReviewsTab`, `MerchantReviews`, `merchant-reply-review`, `takatak-reply-review`, `takatak-link-business`, `takatak-match-businesses`, native review/mapping safeguards and `docs/takatak-integration.md`.
- V1 already consumes signed QMAPS `BUSINESS_UPSERTED`, `REVIEW_UPSERTED`, `REVIEW_DELETED` events through `/api/integrations/qmaps/events`, with event replay/conflict handling and canonical workspace linking. The prior outbound sync work is referenced on `claude/takatak-listings-reviews-sync`; reconcile its current status instead of creating a competing outbox.
- V1 enhancement branch: https://github.com/takatakca/takatak-v1/tree/codex/review-ecosystem . Unified feed reads the existing `ListingReview` records; no sibling database access is introduced.

## Requested deliverable from the QMAPS agent

1. Confirm/publish the merchant review section with native ratings, text, moderation/visibility, owner replies and true empty/error/loading states. Do not duplicate the existing screens.
2. Provide a **QMAPS-owned, versioned, tenant-bound API** for authorized business catalog and complete review pagination. Reuse existing signed Edge Function conventions; endpoint names below are proposals until accepted by the QMAPS maintainer.
3. Return a non-secret integration manifest: production/test base origin, endpoint versions, authentication scheme, required scopes, limits, cursor semantics, event schema and contract test evidence. Provision the actual credentials only in approved secret managers. Never paste a key in GitHub, email bot threads, Drive notes or browser code.
4. Define dedicated business/review read and reply scopes. Existing matching, event and reply credentials are not interchangeable; never give TAKATAK an unrestricted Supabase service-role key.
5. Add/complete the durable QMAPS review event outbox and retry/dead-letter handling. Same event ID + same payload replays safely; changed payload conflicts. Include source update versions and deletion tombstones, with explicit tenant/business binding.

## Proposed read contracts

Signed POST functions (consistent with existing QMAPS integration shape): `takatak-business-feed`, `takatak-review-feed`.

Request: `{version:1,requestId,takatakClientId,businessId?,cursor?,limit}`. Resolve the allowed source businesses server-side using established `businesses.takatak_client_id` mappings. Cursor must be opaque and bound to this workspace, business and filters; cap `limit` and return explicit `hasMore`/`nextCursor`. Never silently truncate and call it a complete sync.

Business projection: opaque QMAPS business ID, name, category, public address/service area, timezone/country where actually stored, active/moderation state, current rating/count with definitions, source version and canonical link ID. No owner authentication IDs, private contact credentials or billing details.

Review projection: source review ID, business ID, rating or native recommendation kind, approved display name, text, source timestamps/version, publication/moderation eligibility, confirmed owner reply and timestamp, source display/redistribution permissions. Identity emails/phones, private messages and auth IDs stay out of the feed.

## Reply authorization gap to close

The inspected `takatak-reply-review` accepts a server integration credential and a review UUID, then performs a privileged update by UUID. The counterpart must additionally resolve that review's business, enforce its canonical TAKATAK workspace binding and `reviews:reply` scope, enforce moderation rules, and return `{ok:true,reviewId,businessId,replyVersion}` only after the real write succeeds. Support replay-safe writes and version conflicts; never trust a caller-supplied business as evidence of ownership.

V1's new cockpit hardens its side by requiring an existing **workspace-owned QMAPS tracking row** and an exact source-review-ID match before any outbound reply. A local draft/internal reply status is not a confirmed provider reply. Both sides must enforce ownership.

## FLEXS connection

QMAPS businesses can support FLEXS provider matching through **QMAPS → TAKATAK V1 → authorized FLEXS workflow**. No direct sibling database access, no global contact export and no duplicate identity/lead authority. Source IDs, canonical workspace IDs and explicit mapping decisions must be preserved. The owner requested all relevant businesses/leads; “all” means complete authorized pagination within the permitted workspace, not every tenant's private records.

## Acceptance evidence required

Test two workspaces, cross-business reply denial, unlinked/ambiguous mapping rejection, signed replay/conflict, pagination completeness, updates/deletions, moderation changes, source-only display fields, reply acceptance and outages. Record exact code/CI SHA separately from deployed API status.

DURING / handoff delivered as GitHub branch document: `revew/review-api-handoff`. No production changes, secret values or live review replies were performed. GitHub issue comments are blocked by this session's API network policy. Google Drive copy is prepared but **NOT UPLOADED** because no Drive tool is available.

— **REVEW**, review/reputation specialist
