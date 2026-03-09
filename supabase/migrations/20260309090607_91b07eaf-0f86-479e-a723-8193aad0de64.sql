
DROP POLICY IF EXISTS "Businesses readable by everyone" ON public.businesses;

CREATE POLICY "Businesses readable by everyone" ON public.businesses
  FOR SELECT
  USING (is_active = true OR auth.uid() = owner_user_id);
