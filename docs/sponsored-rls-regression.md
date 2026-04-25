# Sponsored campaigns — RLS regression checklist

Manual queries to verify `sponsored_campaigns` and `sponsored_campaign_events`
policies after schema changes. Run with the appropriate JWT (anon, owner,
non-owner, admin) using Supabase's SQL editor or `set request.jwt.claims`.

> All checks below assume the Phase 8 + Phase 8B policies are deployed.

## 1. anon cannot read draft campaign
Expect: 0 rows.
```sql
-- as anon
SELECT id FROM public.sponsored_campaigns WHERE status = 'draft';
```

## 2. anon CAN read approved + active campaign
Expect: ≥1 row when an approved campaign exists with `starts_at <= now()` and
`ends_at IS NULL OR ends_at >= now()`.
```sql
-- as anon
SELECT id FROM public.sponsored_campaigns
WHERE status = 'approved'
  AND (starts_at IS NULL OR starts_at <= now())
  AND (ends_at  IS NULL OR ends_at  >= now());
```

## 3. owner cannot self-approve
Expect: error / 0 rows updated. The UPDATE policy restricts allowed transitions
to `draft / pending_review / paused / ended`, so an owner setting `status =
'approved'` violates the WITH CHECK clause.
```sql
-- as the business owner
UPDATE public.sponsored_campaigns
SET status = 'approved'
WHERE id = '<owned-campaign-id>';
```

## 4. event insert MUST fail when business_id mismatches the campaign
Expect: `new row violates row-level security policy`.
```sql
INSERT INTO public.sponsored_campaign_events
  (campaign_id, business_id, event_type, placement)
VALUES
  ('<approved-campaign-id>', '<DIFFERENT-business-id>', 'impression', 'home');
```

## 5. event insert MUST fail for draft / pending campaigns
Expect: RLS violation.
```sql
INSERT INTO public.sponsored_campaign_events
  (campaign_id, business_id, event_type, placement)
VALUES
  ('<draft-campaign-id>', '<matching-business-id>', 'impression', 'home');
```

## 6. owner CAN read own events
Expect: rows visible.
```sql
-- as the business owner
SELECT id, event_type, placement
FROM public.sponsored_campaign_events
WHERE business_id = '<owned-business-id>';
```

## 7. non-owner CANNOT read events
Expect: 0 rows.
```sql
-- as a different authenticated user (not owner, not admin)
SELECT id FROM public.sponsored_campaign_events
WHERE business_id = '<other-owners-business-id>';
```

## 8. admin CAN read everything
Expect: all rows visible.
```sql
-- as admin
SELECT count(*) FROM public.sponsored_campaigns;
SELECT count(*) FROM public.sponsored_campaign_events;
```

## Notes
- `sponsored_campaign_events` has **no UPDATE / DELETE policies** by design —
  the audit trail is append-only.
- Public SELECT on `sponsored_campaigns` is intentionally limited to
  `status = 'approved'` within the active date window.
- Approval/rejection/pause/end are admin-only via the `Admins can update all
  campaigns` policy.
