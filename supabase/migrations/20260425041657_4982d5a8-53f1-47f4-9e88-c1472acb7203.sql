-- Phase 8B: Harden sponsored_campaign_events INSERT to require business_id match
DROP POLICY IF EXISTS "Anyone can insert events for approved campaigns" ON public.sponsored_campaign_events;

CREATE POLICY "Anyone can insert events for approved campaigns"
ON public.sponsored_campaign_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (((user_id IS NULL) AND (auth.uid() IS NULL)) OR (user_id = auth.uid()))
  AND EXISTS (
    SELECT 1
    FROM public.sponsored_campaigns c
    WHERE c.id = sponsored_campaign_events.campaign_id
      AND c.status = 'approved'
      AND c.business_id = sponsored_campaign_events.business_id
      AND (c.starts_at IS NULL OR c.starts_at <= now())
      AND (c.ends_at IS NULL OR c.ends_at >= now())
  )
);