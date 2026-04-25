CREATE TABLE IF NOT EXISTS public.business_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  user_id uuid,
  event_type text NOT NULL,
  source text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_events_event_type_check CHECK (event_type IN (
    'profile_view','phone_click','website_click','directions_click',
    'message_click','save_click','photo_view','project_start','quote_sent'
  ))
);

ALTER TABLE public.business_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_business_events_business ON public.business_events(business_id);
CREATE INDEX IF NOT EXISTS idx_business_events_type ON public.business_events(event_type);
CREATE INDEX IF NOT EXISTS idx_business_events_created_at ON public.business_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_events_business_created ON public.business_events(business_id, created_at DESC);

DROP POLICY IF EXISTS "Anyone can insert business events" ON public.business_events;
DROP POLICY IF EXISTS "Owners can read business events" ON public.business_events;
DROP POLICY IF EXISTS "Admins can read all business events" ON public.business_events;

CREATE POLICY "Anyone can insert business events"
ON public.business_events FOR INSERT
TO anon, authenticated
WITH CHECK (
  (user_id IS NULL AND auth.uid() IS NULL)
  OR (user_id = auth.uid())
);

CREATE POLICY "Owners can read business events"
ON public.business_events FOR SELECT
TO authenticated
USING (public.user_owns_business(auth.uid(), business_id));

CREATE POLICY "Admins can read all business events"
ON public.business_events FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));