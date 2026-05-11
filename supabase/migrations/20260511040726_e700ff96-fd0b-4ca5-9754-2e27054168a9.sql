-- Special hours for businesses (date-keyed overrides)
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS special_hours jsonb;

-- Menu items table
CREATE TABLE IF NOT EXISTS public.business_menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price_cents integer,
  currency text NOT NULL DEFAULT 'CAD',
  category text,
  photo_url text,
  is_available boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_menu_items_business
  ON public.business_menu_items(business_id, sort_order);

ALTER TABLE public.business_menu_items ENABLE ROW LEVEL SECURITY;

-- Public can read available items belonging to active businesses
CREATE POLICY "Menu items readable by everyone when available"
ON public.business_menu_items
FOR SELECT
USING (
  is_available = true
  AND EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = business_menu_items.business_id AND b.is_active = true
  )
);

-- Owners (and admins) can read all their items, including unavailable
CREATE POLICY "Owners and admins can read all menu items"
ON public.business_menu_items
FOR SELECT
USING (
  public.user_owns_business(auth.uid(), business_id)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Owners and admins can insert menu items"
ON public.business_menu_items
FOR INSERT
WITH CHECK (
  public.user_owns_business(auth.uid(), business_id)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Owners and admins can update menu items"
ON public.business_menu_items
FOR UPDATE
USING (
  public.user_owns_business(auth.uid(), business_id)
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  public.user_owns_business(auth.uid(), business_id)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Owners and admins can delete menu items"
ON public.business_menu_items
FOR DELETE
USING (
  public.user_owns_business(auth.uid(), business_id)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- Updated-at trigger
DROP TRIGGER IF EXISTS update_business_menu_items_updated_at ON public.business_menu_items;
CREATE TRIGGER update_business_menu_items_updated_at
BEFORE UPDATE ON public.business_menu_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();