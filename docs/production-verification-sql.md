# QMAPS — Production verification SQL snippets

_Last reviewed: 2026-04-26_

Read-only SELECT queries for verifying that production behavior reaches
the database as expected. Pair every row with the matching section in
[`production-verification-log.md`](./production-verification-log.md) and
record PASS / FAIL / BLOCKED there.

> All snippets are **read-only**. No INSERT, UPDATE, DELETE, DROP, ALTER,
> TRUNCATE, GRANT, REVOKE, or DDL is permitted in this document.

Run each query against the production database from the Lovable Cloud
admin console. Replace placeholders such as `<business_id>`, `<review_id>`,
`<user_id>`, `<request_id>`.

---

## 1. Sponsored impression / click events

Verifies that approved sponsored campaigns are recording impressions and
clicks (log section **5. Sponsored ads**).

```sql
-- Last 50 sponsored events for a campaign, newest first
SELECT id, campaign_id, business_id, event_type, placement, source,
       user_id, created_at
FROM sponsored_campaign_events
WHERE campaign_id = '<campaign_id>'
ORDER BY created_at DESC
LIMIT 50;
```

```sql
-- Hourly impression vs click counts in the last 24h
SELECT date_trunc('hour', created_at) AS hour,
       event_type,
       count(*) AS events
FROM sponsored_campaign_events
WHERE created_at > now() - interval '24 hours'
GROUP BY 1, 2
ORDER BY 1 DESC, 2;
```

## 2. `review_trust_scores` row after a new review

Verifies the trust scoring pipeline (log section **6. Review moderation**).

```sql
-- Trust score row created for a specific review
SELECT review_id, computed_by, risk_level, risk_score, trust_score,
       status, summary, created_at, updated_at
FROM review_trust_scores
WHERE review_id = '<review_id>';
```

```sql
-- 20 most recent trust scores
SELECT review_id, risk_level, risk_score, trust_score, status, created_at
FROM review_trust_scores
ORDER BY created_at DESC
LIMIT 20;
```

## 3. `review_moderation_actions` after hide / restore

Verifies that an admin hide or restore is audited.

```sql
-- All moderation actions on a specific review
SELECT id, review_id, actor_user_id, action,
       previous_status, new_status, reason, created_at
FROM review_moderation_actions
WHERE review_id = '<review_id>'
ORDER BY created_at DESC;
```

```sql
-- Last 50 moderation actions across the platform
SELECT id, review_id, actor_user_id, action,
       previous_status, new_status, created_at
FROM review_moderation_actions
ORDER BY created_at DESC
LIMIT 50;
```

## 4. `account_deletion_requests` row

Verifies the account deletion submission (log section **7. Account deletion**).

```sql
-- Specific user's deletion requests
SELECT id, user_id, status, reason, requested_at,
       processed_at, processed_by, updated_at
FROM account_deletion_requests
WHERE user_id = '<user_id>'
ORDER BY requested_at DESC;
```

```sql
-- All pending deletion requests
SELECT id, user_id, status, requested_at, updated_at
FROM account_deletion_requests
WHERE status = 'pending'
ORDER BY requested_at ASC;
```

## 5. `account_deletion_request_events` audit row

Verifies the audit trail for a deletion request.

```sql
-- Full event history for one deletion request
SELECT id, request_id, event_type,
       previous_status, new_status,
       actor_user_id, note, created_at
FROM account_deletion_request_events
WHERE request_id = '<request_id>'
ORDER BY created_at ASC;
```

## 6. `merchant_subscriptions` update

Verifies that a Stripe checkout actually updated the merchant plan
(log section **2. Stripe checkout + customer portal**).

```sql
-- Current subscription state for a business
SELECT business_id, user_id, plan, status,
       provider, provider_customer_id, provider_subscription_id,
       current_period_start, current_period_end,
       cancel_at_period_end, updated_at
FROM merchant_subscriptions
WHERE business_id = '<business_id>';
```

```sql
-- All non-free subscriptions, newest first
SELECT business_id, plan, status, current_period_end, updated_at
FROM merchant_subscriptions
WHERE plan <> 'free'
ORDER BY updated_at DESC
LIMIT 50;
```

## 7. `merchant_billing_events` webhook event

Verifies that the Stripe webhook persisted an event row
(log section **3. Stripe webhook deliveries**).

```sql
-- Last 50 webhook events across all businesses
SELECT id, business_id, user_id, event_type,
       provider, provider_event_id, created_at
FROM merchant_billing_events
ORDER BY created_at DESC
LIMIT 50;
```

```sql
-- Lookup a specific Stripe event by provider_event_id
SELECT id, business_id, event_type, provider, provider_event_id,
       metadata, created_at
FROM merchant_billing_events
WHERE provider_event_id = '<stripe_event_id>';
```
