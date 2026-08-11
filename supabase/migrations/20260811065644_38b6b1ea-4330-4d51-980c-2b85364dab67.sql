ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.phone_verification_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  phone TEXT NOT NULL,
  action TEXT NOT NULL,
  channel TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pva_phone_created ON public.phone_verification_attempts (phone, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pva_user_created ON public.phone_verification_attempts (user_id, created_at DESC);

GRANT ALL ON public.phone_verification_attempts TO service_role;
ALTER TABLE public.phone_verification_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role only" ON public.phone_verification_attempts FOR ALL TO service_role USING (true) WITH CHECK (true);