-- Reports table for moderation
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id uuid NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open',
  reviewed_by uuid,
  reviewed_at timestamptz,
  internal_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reports_target_type_check CHECK (target_type IN (
    'business','review','business_photo','review_photo','user','project_request','project_quote','message'
  )),
  CONSTRAINT reports_status_check CHECK (status IN ('open','reviewing','resolved','dismissed'))
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_target_type ON public.reports(target_type);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);

-- Drop existing policies if rerun
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;

CREATE POLICY "Users can create reports"
ON public.reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_user_id);

CREATE POLICY "Users can view own reports"
ON public.reports FOR SELECT
TO authenticated
USING (auth.uid() = reporter_user_id);

CREATE POLICY "Admins can view all reports"
ON public.reports FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reports"
ON public.reports FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
DROP TRIGGER IF EXISTS update_reports_updated_at ON public.reports;
CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Admin moderation policies on existing tables (additive, not replacing existing ones)
DROP POLICY IF EXISTS "Admins can update businesses" ON public.businesses;
CREATE POLICY "Admins can update businesses"
ON public.businesses FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete reviews" ON public.reviews;
CREATE POLICY "Admins can delete reviews"
ON public.reviews FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete business photos" ON public.business_photos;
CREATE POLICY "Admins can delete business photos"
ON public.business_photos FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete review photos" ON public.review_photos;
CREATE POLICY "Admins can delete review photos"
ON public.review_photos FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can read all project requests" ON public.project_requests;
CREATE POLICY "Admins can read all project requests"
ON public.project_requests FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can read all profiles for moderation" ON public.profiles;
-- profiles already public read, no extra needed

-- Allow admins to insert merchant role on claim approval (user_roles already restricts insert to self)
DROP POLICY IF EXISTS "Admins can insert any role" ON public.user_roles;
CREATE POLICY "Admins can insert any role"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));