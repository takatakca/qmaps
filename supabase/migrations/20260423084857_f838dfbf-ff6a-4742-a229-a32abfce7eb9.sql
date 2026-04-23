CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS category_type TEXT NOT NULL DEFAULT 'business';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'categories_category_type_check'
  ) THEN
    ALTER TABLE public.categories
    ADD CONSTRAINT categories_category_type_check
    CHECK (category_type IN ('business', 'service'));
  END IF;
END $$;

ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS location geography(Point, 4326),
ADD COLUMN IF NOT EXISTS search_document tsvector;

UPDATE public.businesses
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE location IS NULL;

CREATE OR REPLACE FUNCTION public.sync_business_derived_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  NEW.search_document :=
    setweight(to_tsvector('simple', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.address, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(NEW.city, '')), 'C');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS businesses_sync_derived_fields ON public.businesses;
CREATE TRIGGER businesses_sync_derived_fields
BEFORE INSERT OR UPDATE OF name, description, address, city, latitude, longitude
ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.sync_business_derived_fields();

UPDATE public.businesses
SET search_document =
  setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(address, '')), 'C') ||
  setweight(to_tsvector('simple', coalesce(city, '')), 'C')
WHERE search_document IS NULL;

CREATE INDEX IF NOT EXISTS idx_businesses_location ON public.businesses USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_businesses_search_document ON public.businesses USING GIN (search_document);
CREATE INDEX IF NOT EXISTS idx_businesses_name_trgm ON public.businesses USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_business_categories_category_business ON public.business_categories (category_id, business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_business ON public.reviews (user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_business_user ON public.bookmarks (business_id, user_id);

CREATE TABLE IF NOT EXISTS public.review_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'photo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.review_photos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'review_photos' AND policyname = 'Review photos readable by everyone'
  ) THEN
    CREATE POLICY "Review photos readable by everyone"
    ON public.review_photos
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'review_photos' AND policyname = 'Users can add own review photos'
  ) THEN
    CREATE POLICY "Users can add own review photos"
    ON public.review_photos
    FOR INSERT
    WITH CHECK (
      auth.uid() = user_id
      AND EXISTS (
        SELECT 1 FROM public.reviews r
        WHERE r.id = review_id AND r.user_id = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'review_photos' AND policyname = 'Users can delete own review photos'
  ) THEN
    CREATE POLICY "Users can delete own review photos"
    ON public.review_photos
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_review_photos_review_id ON public.review_photos (review_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.business_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'photo',
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.business_photos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'business_photos' AND policyname = 'Business photos readable by everyone'
  ) THEN
    CREATE POLICY "Business photos readable by everyone"
    ON public.business_photos
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'business_photos' AND policyname = 'Users can add business photos'
  ) THEN
    CREATE POLICY "Users can add business photos"
    ON public.business_photos
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'business_photos' AND policyname = 'Users can delete own business photos'
  ) THEN
    CREATE POLICY "Users can delete own business photos"
    ON public.business_photos
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_business_photos_business_id ON public.business_photos (business_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL,
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT business_hours_day_of_week_check CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT business_hours_unique_day UNIQUE (business_id, day_of_week)
);

ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'business_hours' AND policyname = 'Business hours readable by everyone'
  ) THEN
    CREATE POLICY "Business hours readable by everyone"
    ON public.business_hours
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'business_hours' AND policyname = 'Owners can manage business hours'
  ) THEN
    CREATE POLICY "Owners can manage business hours"
    ON public.business_hours
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.businesses b
        WHERE b.id = business_hours.business_id AND b.owner_user_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.businesses b
        WHERE b.id = business_hours.business_id AND b.owner_user_id = auth.uid()
      )
    );
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_business_hours_updated_at ON public.business_hours;
CREATE TRIGGER update_business_hours_updated_at
BEFORE UPDATE ON public.business_hours
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.business_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT business_claims_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

ALTER TABLE public.business_claims ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'business_claims' AND policyname = 'Users can read own business claims'
  ) THEN
    CREATE POLICY "Users can read own business claims"
    ON public.business_claims
    FOR SELECT
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'business_claims' AND policyname = 'Users can create own business claims'
  ) THEN
    CREATE POLICY "Users can create own business claims"
    ON public.business_claims
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'business_claims' AND policyname = 'Admins can manage business claims'
  ) THEN
    CREATE POLICY "Admins can manage business claims"
    ON public.business_claims
    FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_business_claims_updated_at ON public.business_claims;
CREATE TRIGGER update_business_claims_updated_at
BEFORE UPDATE ON public.business_claims
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();