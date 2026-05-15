ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS attributes jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_businesses_attributes ON public.businesses USING gin (attributes);