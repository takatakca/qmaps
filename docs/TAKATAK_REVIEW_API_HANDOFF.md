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

## Implemented review contract — REVEW, 2026-11-01

Code on `revew/review-api-handoff` now provides a QMAPS-owned adapter, not a sibling database connection. Both review functions require the existing server-only `x-qmaps-integration-secret` with `QMAPS_TAKATAK_INTEGRATION_SECRET` of at least 32 characters. The caller must be the trusted TAKATAK backend; no key or Supabase service role goes to a browser or agent prompt.

### Read current public reviews

`POST /functions/v1/takatak-list-reviews`, JSON:

```json
{
  "version": 1,
  "clientId": "TAKATAK workspace UUID",
  "businessId": "QMAPS business UUID",
  "limit": 50,
  "cursor": null
}
```

`limit` is 1–100. A next request uses the exact returned `nextCursor` object `{createdAt,id}`; preserve fractional timestamp precision. Pagination is descending `created_at`, then descending UUID. A successful response echoes `version/clientId/businessId` and returns `reviews`, `hasMore`, `nextCursor`. Each review has `{id,businessId,author,rating,body,createdAt,updatedAt,ownerReply,ownerRepliedAt}`. `author` is the explicit generic label `QMAPS customer`, not an invented display identity; private profile IDs are not exported.

The source business must be active and linked to that exact TAKATAK client. Only `visible`/`trusted` reviews with `hidden_at IS NULL` are returned. Hidden reasons, reviewer identifiers, contacts and internal moderation notes are never selected. The read has a 16KB streamed request limit, `private, no-store` responses and no direct URL fetching.

This is a current-public-review feed, not an immutable snapshot or deletion/tombstone stream. A hidden/deleted review vanishes from the feed. Never archive a prior record based on a failed, partial or capped scan. Existing signed deletion events remain relevant; a consumer doing snapshot reconciliation must wait for a fully successful enumeration and handle concurrent source changes honestly.

### Scoped public owner reply

Use the **new** mutation path `POST /functions/v1/takatak-reply-review-v2`:

```json
{
  "version": 1,
  "clientId": "TAKATAK workspace UUID",
  "businessId": "QMAPS business UUID",
  "reviewId": "QMAPS review UUID",
  "body": "Owner-approved public reply"
}
```

The response echoes `version/clientId/businessId/reviewId` and the persisted `ownerReply/ownerRepliedAt` only after the exact eligible source row was saved. A missing or mismatched workspace/business/review is `404`; no source edit is made. Comment max2000 characters. No autonomous publication is introduced. The old reply path is hardened through the same scoped handler and rejects old unscoped payloads.

**Rollout must use the new v2 path:** a previously deployed old handler ignores extra tenant IDs and could publish an arbitrary UUID before a new consumer notices the acknowledgement mismatch. A not-yet-deployed v2 path instead returns404 without a mutation. Deploy both read and v2 functions before enabling the consumer; do not silently fall back to the old mutation path. The link function also uses compare-and-set so an existing different tenant link cannot be reassigned by this integration.

### Evidence and activation limits

Local QMAPS validation passed: 435 tests in72files (12 new executable handler/store checks), full frontend typecheck, changed-boundary ESLint and production Vite build. The tests execute the actual adapter query filters against an in-memory Supabase-compatible store; they are not evidence of a live Supabase write or production database transaction. A focused branch CI workflow is included. No migration, secret, Edge Function deployment, frontend deployment or production acceptance test was executed here. Browser/agent callers must still go through the tenant-scoped V1 service, not raw privileged source credentials.

Installation evidence: frozen Bun install initially encountered two inaccessible historical private-cache tarball URLs; the local external dependency copy retained every committed version and integrity hash and changed only those tarball origins to public npm. Tracked manifests and lockfiles are unchanged. Focused CI uses the same isolated copy so the source lock remains reviewable.

— REVEW

### Source CI result and deployment boundary

Exact runtime source `6cc23f238556e38bf5ca2e29900dfac764d2e581` passed [focused CI](https://github.com/takatakca/qmaps/actions/runs/41298309788) in1m04s: locked dependency install, typecheck including the executable adapter, scoped lint, all435tests, production frontend build. The following signed note update changes no runtime code.

**A frontend/main deployment alone does not publish Supabase Edge Functions.** The authorized QMAPS project operator must separately deploy `takatak-list-reviews`, `takatak-reply-review-v2`, and the hardened old reply/link functions with the matching server-only secret. Confirm the correct project and make a real authorized read/reply round-trip before calling the connector live. No such deployment or production operation was performed in this session. Parent V1 CI can pin the exact source SHA above for cross-repository contract tests. — REVEW
