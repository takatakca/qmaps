-- merchant_subscriptions table
CREATE TABLE IF NOT EXISTS public.merchant_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  plan text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'free',
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id)
);

CREATE INDEX IF NOT EXISTS idx_merchant_subscriptions_business ON public.merchant_subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_merchant_subscriptions_user ON public.merchant_subscriptions(user_id);

ALTER TABLE public.merchant_subscriptions ENABLE ROW LEVEL SECURITY;

-- Owners can read their own business subscriptions
CREATE POLICY "Owners can read own subscriptions"
  ON public.merchant_subscriptions
  FOR SELECT
  TO authenticated
  USING (public.user_owns_business(auth.uid(), business_id));

-- Admins can read all
CREATE POLICY "Admins can read all subscriptions"
  ON public.merchant_subscriptions
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert subscriptions
CREATE POLICY "Admins can insert subscriptions"
  ON public.merchant_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can update subscriptions
CREATE POLICY "Admins can update subscriptions"
  ON public.merchant_subscriptions
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger: keep updated_at fresh
CREATE TRIGGER update_merchant_subscriptions_updated_at
  BEFORE UPDATE ON public.merchant_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- merchant_billing_events table
CREATE TABLE IF NOT EXISTS public.merchant_billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid,
  event_type text NOT NULL,
  provider text,
  provider_event_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_merchant_billing_events_business ON public.merchant_billing_events(business_id);
CREATE INDEX IF NOT EXISTS idx_merchant_billing_events_created ON public.merchant_billing_events(created_at DESC);

ALTER TABLE public.merchant_billing_events ENABLE ROW LEVEL SECURITY;

-- Owners can read their own events
CREATE POLICY "Owners can read own billing events"
  ON public.merchant_billing_events
  FOR SELECT
  TO authenticated
  USING (public.user_owns_business(auth.uid(), business_id));

-- Admins can read all events
CREATE POLICY "Admins can read all billing events"
  ON public.merchant_billing_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Owners can insert events for their own businesses (client-side logging)
CREATE POLICY "Owners can insert own billing events"
  ON public.merchant_billing_events
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_owns_business(auth.uid(), business_id));

-- Admins can insert any
CREATE POLICY "Admins can insert any billing events"
  ON public.merchant_billing_events
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));