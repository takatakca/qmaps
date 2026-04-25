# Phase 9 — RLS regression checklist

Manual SQL test cases for the recommendation + review-trust tables.
Run as the appropriate role. All tests must pass before declaring Phase 9 stable.

## 1. recommendation_events (anon insert)
```sql
-- as anon: should succeed
insert into public.recommendation_events (business_id, event_type, user_id)
values ('<biz>', 'business_view', null);
```

## 2. recommendation_events (anon spoof user)
```sql
-- as anon: must FAIL (RLS rejects)
insert into public.recommendation_events (business_id, event_type, user_id)
values ('<biz>', 'business_view', '<some-user-id>');
```

## 3. recommendation_events (authenticated, own id)
```sql
-- as authed user: succeeds when user_id = auth.uid()
insert into public.recommendation_events (business_id, event_type, user_id)
values ('<biz>', 'business_view', auth.uid());
```

## 4. recommendation_events (authenticated, other id)
```sql
-- must FAIL (RLS rejects)
insert into public.recommendation_events (business_id, event_type, user_id)
values ('<biz>', 'business_view', '<other-user-id>');
```

## 5. review_moderation_signals — normal user
```sql
-- as authed non-admin: returns 0 rows
select * from public.review_moderation_signals limit 1;
```

## 6. review_moderation_signals — merchant
```sql
-- as merchant who owns business of the review: still returns 0 rows
select * from public.review_moderation_signals limit 1;
```

## 7. review_moderation_signals — admin
```sql
-- as admin: returns rows
select * from public.review_moderation_signals limit 1;
```

## 8. review_trust_scores — normal user update
```sql
-- as authed non-admin: must FAIL
update public.review_trust_scores set status = 'hidden' where review_id = '<id>';
```

## 9. review_trust_scores — admin update
```sql
-- as admin: succeeds
update public.review_trust_scores set status = 'trusted' where review_id = '<id>';
```

## 10. review_moderation_actions — admin audit row
```sql
-- as admin: succeeds, actor_user_id = auth.uid()
insert into public.review_moderation_actions (review_id, actor_user_id, action)
values ('<id>', auth.uid(), 'add_note');
```

## Notes
- `review_trust_scores` exposes a merchant-only read policy limited to reviews on their own businesses, with no raw signal access.
- `recommendation_feedback` mirrors `recommendation_events` insert rules.
- `business_recommendation_scores` and `user_preference_profiles` writes are admin-only; reads are owner-or-admin.
- The reviews table gained `moderation_status` (default `visible`), `hidden_at`, `hidden_by`, `hidden_reason`. Existing review behavior is unchanged.
