
-- =========================================================
-- Phase 3A: Projects Marketplace foundation (additive only)
-- Tables created BEFORE security-definer functions that reference them.
-- =========================================================

-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================================
-- 1. project_requests
-- =========================================================
CREATE TABLE IF NOT EXISTS public.project_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  city text,
  region text,
  postal_code text,
  latitude double precision,
  longitude double precision,
  budget_min numeric,
  budget_max numeric,
  urgency text NOT NULL DEFAULT 'flexible',
  preferred_contact_method text NOT NULL DEFAULT 'in_app',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_requests ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 2. project_request_media
-- =========================================================
CREATE TABLE IF NOT EXISTS public.project_request_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_request_id uuid NOT NULL REFERENCES public.project_requests(id) ON DELETE CASCADE,
  url text NOT NULL,
  media_type text NOT NULL DEFAULT 'photo',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_request_media ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 3. merchant_service_areas
-- =========================================================
CREATE TABLE IF NOT EXISTS public.merchant_service_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  region text,
  city text,
  postal_code_prefix text,
  radius_km integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.merchant_service_areas ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 4. merchant_service_categories
-- =========================================================
CREATE TABLE IF NOT EXISTS public.merchant_service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, category_id)
);

ALTER TABLE public.merchant_service_categories ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 5. project_quotes
-- =========================================================
CREATE TABLE IF NOT EXISTS public.project_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_request_id uuid NOT NULL REFERENCES public.project_requests(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL,
  message text,
  quoted_price_min numeric,
  quoted_price_max numeric,
  status text NOT NULL DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_quotes ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 6. project_quote_messages
-- =========================================================
CREATE TABLE IF NOT EXISTS public.project_quote_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.project_quotes(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_quote_messages ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- Security definer helpers (created AFTER referenced tables exist)
-- =========================================================

CREATE OR REPLACE FUNCTION public.user_owns_business(_user_id uuid, _business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = _business_id AND b.owner_user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.user_serves_category(_user_id uuid, _category_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.merchant_service_categories msc
    JOIN public.businesses b ON b.id = msc.business_id
    WHERE msc.category_id = _category_id
      AND b.owner_user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_quote(_user_id uuid, _quote_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_quotes q
    JOIN public.project_requests pr ON pr.id = q.project_request_id
    JOIN public.businesses b ON b.id = q.business_id
    WHERE q.id = _quote_id
      AND (pr.user_id = _user_id OR b.owner_user_id = _user_id)
  );
$$;

-- =========================================================
-- RLS Policies
-- =========================================================

-- project_requests
CREATE POLICY "Users can create own project requests"
  ON public.project_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project requests"
  ON public.project_requests FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own project requests"
  ON public.project_requests FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Project requests visible to owner or matching merchants"
  ON public.project_requests FOR SELECT
  USING (
    auth.uid() = user_id
    OR (category_id IS NOT NULL AND public.user_serves_category(auth.uid(), category_id))
  );

-- project_request_media
CREATE POLICY "Project media visible if request is visible"
  ON public.project_request_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_requests pr
      WHERE pr.id = project_request_media.project_request_id
        AND (
          pr.user_id = auth.uid()
          OR (pr.category_id IS NOT NULL AND public.user_serves_category(auth.uid(), pr.category_id))
        )
    )
  );

CREATE POLICY "Owners can add project media"
  ON public.project_request_media FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_requests pr
      WHERE pr.id = project_request_media.project_request_id
        AND pr.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete project media"
  ON public.project_request_media FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.project_requests pr
      WHERE pr.id = project_request_media.project_request_id
        AND pr.user_id = auth.uid()
    )
  );

-- merchant_service_areas
CREATE POLICY "Service areas readable by everyone"
  ON public.merchant_service_areas FOR SELECT
  USING (true);

CREATE POLICY "Owners can manage service areas"
  ON public.merchant_service_areas FOR ALL
  USING (public.user_owns_business(auth.uid(), business_id))
  WITH CHECK (public.user_owns_business(auth.uid(), business_id));

-- merchant_service_categories
CREATE POLICY "Service categories readable by everyone"
  ON public.merchant_service_categories FOR SELECT
  USING (true);

CREATE POLICY "Owners can manage service categories"
  ON public.merchant_service_categories FOR ALL
  USING (public.user_owns_business(auth.uid(), business_id))
  WITH CHECK (public.user_owns_business(auth.uid(), business_id));

-- project_quotes
CREATE POLICY "Quotes visible to project owner or quoting merchant"
  ON public.project_quotes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_requests pr
      WHERE pr.id = project_quotes.project_request_id
        AND pr.user_id = auth.uid()
    )
    OR public.user_owns_business(auth.uid(), business_id)
  );

CREATE POLICY "Merchants can create quotes for owned businesses"
  ON public.project_quotes FOR INSERT
  WITH CHECK (
    auth.uid() = sender_user_id
    AND public.user_owns_business(auth.uid(), business_id)
  );

CREATE POLICY "Merchants can update own quotes"
  ON public.project_quotes FOR UPDATE
  USING (public.user_owns_business(auth.uid(), business_id))
  WITH CHECK (public.user_owns_business(auth.uid(), business_id));

-- project_quote_messages
CREATE POLICY "Quote messages visible to quote participants"
  ON public.project_quote_messages FOR SELECT
  USING (public.can_access_quote(auth.uid(), quote_id));

CREATE POLICY "Quote participants can send messages"
  ON public.project_quote_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_user_id
    AND public.can_access_quote(auth.uid(), quote_id)
  );

-- =========================================================
-- Triggers
-- =========================================================
CREATE TRIGGER trg_project_requests_updated_at
BEFORE UPDATE ON public.project_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_project_quotes_updated_at
BEFORE UPDATE ON public.project_quotes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- Indexes
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_project_requests_user_id ON public.project_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_project_requests_category_status_created
  ON public.project_requests(category_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_request_media_request_id
  ON public.project_request_media(project_request_id);
CREATE INDEX IF NOT EXISTS idx_merchant_service_areas_business_id
  ON public.merchant_service_areas(business_id);
CREATE INDEX IF NOT EXISTS idx_merchant_service_categories_category_id
  ON public.merchant_service_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_merchant_service_categories_business_id
  ON public.merchant_service_categories(business_id);
CREATE INDEX IF NOT EXISTS idx_project_quotes_project_request_id
  ON public.project_quotes(project_request_id);
CREATE INDEX IF NOT EXISTS idx_project_quotes_business_id
  ON public.project_quotes(business_id);
CREATE INDEX IF NOT EXISTS idx_project_quote_messages_quote_id
  ON public.project_quote_messages(quote_id);
