-- Phase 15F: structured claim requests table
CREATE TABLE IF NOT EXISTS public.business_claim_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  contact_name text NOT NULL,
  business_email text NOT NULL,
  business_phone text,
  message text,
  evidence_url text,
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bcr_business ON public.business_claim_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_bcr_user ON public.business_claim_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_bcr_status ON public.business_claim_requests(status);

ALTER TABLE public.business_claim_requests ENABLE ROW LEVEL SECURITY;

-- Validation trigger for status
CREATE OR REPLACE FUNCTION public.validate_business_claim_request()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'invalid status: %', NEW.status;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bcr_validate ON public.business_claim_requests;
CREATE TRIGGER trg_bcr_validate
  BEFORE INSERT OR UPDATE ON public.business_claim_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_business_claim_request();

-- RLS: users insert own
CREATE POLICY "Users can create own claim requests"
  ON public.business_claim_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Users read own
CREATE POLICY "Users can read own claim requests"
  ON public.business_claim_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins read all
CREATE POLICY "Admins can read all claim requests"
  ON public.business_claim_requests
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins update
CREATE POLICY "Admins can update claim requests"
  ON public.business_claim_requests
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
