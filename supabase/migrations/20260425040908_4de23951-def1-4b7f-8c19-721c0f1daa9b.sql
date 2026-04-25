
-- ============================================================
-- Sponsored campaigns foundation
-- ============================================================

CREATE TABLE IF NOT EXISTS public.sponsored_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  placement text NOT NULL DEFAULT 'all',
  headline text,
  description text,
  target_city text,
  target_category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  daily_budget_cents integer,
  starts_at timestamptz,
  ends_at timestamptz,
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sponsored_campaigns_status_check
    CHECK (status IN ('draft','pending_review','approved','paused','rejected','ended')),
  CONSTRAINT sponsored_campaigns_placement_check
    CHECK (placement IN ('home','search','category','city','business_detail','all'))
);

CREATE INDEX IF NOT EXISTS idx_sponsored_campaigns_business ON public.sponsored_campaigns(business_id);
CREATE INDEX IF NOT EXISTS idx_sponsored_campaigns_user ON public.sponsored_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_sponsored_campaigns_status ON public.sponsored_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_sponsored_campaigns_placement_status ON public.sponsored_campaigns(placement, status);
CREATE INDEX IF NOT EXISTS idx_sponsored_campaigns_target_city ON public.sponsored_campaigns(target_city);
CREATE INDEX IF NOT EXISTS idx_sponsored_campaigns_target_category ON public.sponsored_campaigns(target_category_id);

CREATE TRIGGER trg_sponsored_campaigns_updated_at
BEFORE UPDATE ON public.sponsored_campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.sponsored_campaigns ENABLE ROW LEVEL SECURITY;

-- Owners: read their own
CREATE POLICY "Owners can read own campaigns"
ON public.sponsored_campaigns FOR SELECT TO authenticated
USING (user_owns_business(auth.uid(), business_id));

-- Admins: read all
CREATE POLICY "Admins can read all campaigns"
ON public.sponsored_campaigns FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Public: read approved active campaigns (for display)
CREATE POLICY "Public can read approved active campaigns"
ON public.sponsored_campaigns FOR SELECT TO anon, authenticated
USING (
  status = 'approved'
  AND (starts_at IS NULL OR starts_at <= now())
  AND (ends_at IS NULL OR ends_at >= now())
);

-- Owners: insert campaigns for businesses they own, only as draft/pending_review
CREATE POLICY "Owners can insert own campaigns"
ON public.sponsored_campaigns FOR INSERT TO authenticated
WITH CHECK (
  user_owns_business(auth.uid(), business_id)
  AND auth.uid() = user_id
  AND status IN ('draft','pending_review')
);

-- Owners: update their own draft/pending/paused campaigns, but cannot set approved/rejected
CREATE POLICY "Owners can update own campaigns"
ON public.sponsored_campaigns FOR UPDATE TO authenticated
USING (
  user_owns_business(auth.uid(), business_id)
  AND status IN ('draft','pending_review','paused')
)
WITH CHECK (
  user_owns_business(auth.uid(), business_id)
  AND status IN ('draft','pending_review','paused','ended')
);

-- Admins: update all
CREATE POLICY "Admins can update all campaigns"
ON public.sponsored_campaigns FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- Events
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sponsored_campaign_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.sponsored_campaigns(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid,
  event_type text NOT NULL,
  placement text,
  source text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sponsored_campaign_events_event_type_check
    CHECK (event_type IN ('impression','click'))
);

CREATE INDEX IF NOT EXISTS idx_sponsored_events_campaign ON public.sponsored_campaign_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sponsored_events_business ON public.sponsored_campaign_events(business_id);
CREATE INDEX IF NOT EXISTS idx_sponsored_events_type ON public.sponsored_campaign_events(event_type);
CREATE INDEX IF NOT EXISTS idx_sponsored_events_created_at ON public.sponsored_campaign_events(created_at);

ALTER TABLE public.sponsored_campaign_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events but only for currently approved campaigns
CREATE POLICY "Anyone can insert events for approved campaigns"
ON public.sponsored_campaign_events FOR INSERT TO anon, authenticated
WITH CHECK (
  (((user_id IS NULL) AND (auth.uid() IS NULL)) OR (user_id = auth.uid()))
  AND EXISTS (
    SELECT 1 FROM public.sponsored_campaigns c
    WHERE c.id = sponsored_campaign_events.campaign_id
      AND c.status = 'approved'
      AND (c.starts_at IS NULL OR c.starts_at <= now())
      AND (c.ends_at IS NULL OR c.ends_at >= now())
  )
);

-- Owners can read events for their businesses
CREATE POLICY "Owners can read own campaign events"
ON public.sponsored_campaign_events FOR SELECT TO authenticated
USING (user_owns_business(auth.uid(), business_id));

-- Admins can read all
CREATE POLICY "Admins can read all campaign events"
ON public.sponsored_campaign_events FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
