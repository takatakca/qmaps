
CREATE TABLE IF NOT EXISTS public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  type text,
  mrc text,
  region text,
  region_slug text,
  population integer NOT NULL DEFAULT 0,
  parent_city_slug text,
  latitude double precision,
  longitude double precision,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cities_region_slug ON public.cities (region_slug);
CREATE INDEX IF NOT EXISTS idx_cities_parent_city_slug ON public.cities (parent_city_slug);
CREATE INDEX IF NOT EXISTS idx_cities_population_desc ON public.cities (population DESC);

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cities readable by everyone"
ON public.cities FOR SELECT
USING (true);

CREATE POLICY "Admins can insert cities"
ON public.cities FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update cities"
ON public.cities FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete cities"
ON public.cities FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_cities_updated_at
BEFORE UPDATE ON public.cities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
