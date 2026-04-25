-- =========================================================================
-- Phase 9A — Recommendation foundation
-- =========================================================================

-- 1. recommendation_events
CREATE TABLE IF NOT EXISTS public.recommendation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  session_id text NULL,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category_id uuid NULL REFERENCES public.categories(id) ON DELETE SET NULL,
  city text NULL,
  event_type text NOT NULL,
  source text NULL,
  weight numeric NOT NULL DEFAULT 1,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT recommendation_events_event_type_check CHECK (event_type IN (
    'business_view','search_click','category_view','city_view',
    'bookmark_add','bookmark_remove','review_create','photo_view',
    'sponsored_click','directions_click','phone_click','website_click',
    'recommendation_impression','recommendation_click','recommendation_dismiss'
  ))
);

CREATE INDEX IF NOT EXISTS idx_rec_events_user_created ON public.recommendation_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rec_events_business_created ON public.recommendation_events (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rec_events_category ON public.recommendation_events (category_id);
CREATE INDEX IF NOT EXISTS idx_rec_events_city ON public.recommendation_events (city);
CREATE INDEX IF NOT EXISTS idx_rec_events_type ON public.recommendation_events (event_type);
CREATE INDEX IF NOT EXISTS idx_rec_events_session ON public.recommendation_events (session_id);
CREATE INDEX IF NOT EXISTS idx_rec_events_created ON public.recommendation_events (created_at DESC);

ALTER TABLE public.recommendation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert recommendation events"
  ON public.recommendation_events FOR INSERT TO anon, authenticated
  WITH CHECK (
    ((user_id IS NULL) AND (auth.uid() IS NULL))
    OR (user_id = auth.uid())
  );

CREATE POLICY "Users can read own recommendation events"
  ON public.recommendation_events FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all recommendation events"
  ON public.recommendation_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));


-- 2. user_preference_profiles
CREATE TABLE IF NOT EXISTS public.user_preference_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  top_category_ids uuid[] NOT NULL DEFAULT '{}',
  top_cities text[] NOT NULL DEFAULT '{}',
  price_preference integer NULL,
  avg_rating_preference numeric NULL,
  last_computed_at timestamptz NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preference_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preference profile"
  ON public.user_preference_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all preference profiles"
  ON public.user_preference_profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert preference profiles"
  ON public.user_preference_profiles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update preference profiles"
  ON public.user_preference_profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_user_preference_profiles_updated
  BEFORE UPDATE ON public.user_preference_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 3. business_recommendation_scores
CREATE TABLE IF NOT EXISTS public.business_recommendation_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  score numeric NOT NULL DEFAULT 0,
  reason_codes text[] NOT NULL DEFAULT '{}',
  reasons jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text NOT NULL DEFAULT 'rules',
  computed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_brs_user_score ON public.business_recommendation_scores (user_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_brs_business ON public.business_recommendation_scores (business_id);
CREATE INDEX IF NOT EXISTS idx_brs_computed ON public.business_recommendation_scores (computed_at DESC);

ALTER TABLE public.business_recommendation_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own recommendation scores"
  ON public.business_recommendation_scores FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all recommendation scores"
  ON public.business_recommendation_scores FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert recommendation scores"
  ON public.business_recommendation_scores FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update recommendation scores"
  ON public.business_recommendation_scores FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));


-- 4. recommendation_feedback
CREATE TABLE IF NOT EXISTS public.recommendation_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  recommendation_source text NULL,
  feedback_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT recommendation_feedback_type_check CHECK (feedback_type IN (
    'clicked','saved','dismissed','not_interested','already_visited','irrelevant'
  ))
);

CREATE INDEX IF NOT EXISTS idx_rec_feedback_user ON public.recommendation_feedback (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rec_feedback_business ON public.recommendation_feedback (business_id);
CREATE INDEX IF NOT EXISTS idx_rec_feedback_type ON public.recommendation_feedback (feedback_type);

ALTER TABLE public.recommendation_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert recommendation feedback"
  ON public.recommendation_feedback FOR INSERT TO anon, authenticated
  WITH CHECK (
    ((user_id IS NULL) AND (auth.uid() IS NULL))
    OR (user_id = auth.uid())
  );

CREATE POLICY "Users can read own recommendation feedback"
  ON public.recommendation_feedback FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all recommendation feedback"
  ON public.recommendation_feedback FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));


-- =========================================================================
-- Phase 9B — Review trust foundation
-- =========================================================================

-- Safe additive columns on reviews (idempotent)
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'visible',
  ADD COLUMN IF NOT EXISTS hidden_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS hidden_by uuid NULL,
  ADD COLUMN IF NOT EXISTS hidden_reason text NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reviews_moderation_status_check'
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_moderation_status_check
      CHECK (moderation_status IN ('visible','hidden','needs_review','trusted'));
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_reviews_moderation_status ON public.reviews (moderation_status);

-- 1. review_moderation_signals (admin-only)
CREATE TABLE IF NOT EXISTS public.review_moderation_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  signal_type text NOT NULL,
  severity text NOT NULL DEFAULT 'low',
  score numeric NOT NULL DEFAULT 0,
  explanation text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT review_moderation_signals_severity_check CHECK (severity IN ('low','medium','high','critical')),
  CONSTRAINT review_moderation_signals_type_check CHECK (signal_type IN (
    'duplicate_text','repeated_phrase','extreme_rating','new_account',
    'burst_activity','review_velocity','same_business_pattern',
    'short_low_context','suspicious_language','merchant_conflict',
    'user_reported','ai_flagged','admin_flagged','trusted_history'
  ))
);

CREATE INDEX IF NOT EXISTS idx_rms_review ON public.review_moderation_signals (review_id);
CREATE INDEX IF NOT EXISTS idx_rms_type ON public.review_moderation_signals (signal_type);
CREATE INDEX IF NOT EXISTS idx_rms_severity ON public.review_moderation_signals (severity);
CREATE INDEX IF NOT EXISTS idx_rms_score ON public.review_moderation_signals (score DESC);
CREATE INDEX IF NOT EXISTS idx_rms_created ON public.review_moderation_signals (created_at DESC);

ALTER TABLE public.review_moderation_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all review moderation signals"
  ON public.review_moderation_signals FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert review moderation signals"
  ON public.review_moderation_signals FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete review moderation signals"
  ON public.review_moderation_signals FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));


-- 2. review_trust_scores
CREATE TABLE IF NOT EXISTS public.review_trust_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL UNIQUE REFERENCES public.reviews(id) ON DELETE CASCADE,
  trust_score numeric NOT NULL DEFAULT 1,
  risk_score numeric NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'low',
  status text NOT NULL DEFAULT 'visible',
  summary text NULL,
  computed_by text NOT NULL DEFAULT 'rules',
  reviewed_by uuid NULL,
  reviewed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rts_risk_level_check CHECK (risk_level IN ('low','medium','high','critical')),
  CONSTRAINT rts_status_check CHECK (status IN ('visible','needs_review','hidden','trusted','dismissed','restored'))
);

CREATE INDEX IF NOT EXISTS idx_rts_review ON public.review_trust_scores (review_id);
CREATE INDEX IF NOT EXISTS idx_rts_risk_level ON public.review_trust_scores (risk_level);
CREATE INDEX IF NOT EXISTS idx_rts_status ON public.review_trust_scores (status);
CREATE INDEX IF NOT EXISTS idx_rts_risk_score ON public.review_trust_scores (risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_rts_updated ON public.review_trust_scores (updated_at DESC);

ALTER TABLE public.review_trust_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all trust scores"
  ON public.review_trust_scores FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert trust scores"
  ON public.review_trust_scores FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update trust scores"
  ON public.review_trust_scores FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Merchants can read trust status for own business reviews"
  ON public.review_trust_scores FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.reviews r
    JOIN public.businesses b ON b.id = r.business_id
    WHERE r.id = review_trust_scores.review_id
      AND b.owner_user_id = auth.uid()
  ));

CREATE TRIGGER trg_review_trust_scores_updated
  BEFORE UPDATE ON public.review_trust_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 3. review_moderation_actions (admin audit log)
CREATE TABLE IF NOT EXISTS public.review_moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  actor_user_id uuid NOT NULL,
  action text NOT NULL,
  reason text NULL,
  previous_status text NULL,
  new_status text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rma_action_check CHECK (action IN (
    'mark_needs_review','mark_trusted','hide_review','restore_review',
    'dismiss_flags','add_note','recompute_score'
  ))
);

CREATE INDEX IF NOT EXISTS idx_rma_review ON public.review_moderation_actions (review_id);
CREATE INDEX IF NOT EXISTS idx_rma_actor ON public.review_moderation_actions (actor_user_id);
CREATE INDEX IF NOT EXISTS idx_rma_action ON public.review_moderation_actions (action);
CREATE INDEX IF NOT EXISTS idx_rma_created ON public.review_moderation_actions (created_at DESC);

ALTER TABLE public.review_moderation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read moderation actions"
  ON public.review_moderation_actions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert moderation actions"
  ON public.review_moderation_actions FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND actor_user_id = auth.uid()
  );