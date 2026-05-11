
-- Admin audit logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit logs"
  ON public.admin_audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert audit logs"
  ON public.admin_audit_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND admin_user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON public.admin_audit_logs (target_type, target_id);

-- Owner transfer requests
CREATE TABLE IF NOT EXISTS public.business_owner_transfer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  claim_request_id uuid NULL,
  current_owner_user_id uuid NULL,
  requested_owner_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reason text NULL,
  admin_note text NULL,
  reviewed_by uuid NULL,
  reviewed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_owner_transfer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all owner transfer requests"
  ON public.business_owner_transfer_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Involved users can read own transfer requests"
  ON public.business_owner_transfer_requests FOR SELECT TO authenticated
  USING (auth.uid() = current_owner_user_id OR auth.uid() = requested_owner_user_id);

CREATE POLICY "Admins can insert owner transfer requests"
  ON public.business_owner_transfer_requests FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update owner transfer requests"
  ON public.business_owner_transfer_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Validate status with a trigger (avoid CHECK with future-modifiable enum)
CREATE OR REPLACE FUNCTION public.validate_transfer_request_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('pending','approved','rejected') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_transfer_request_status ON public.business_owner_transfer_requests;
CREATE TRIGGER trg_validate_transfer_request_status
  BEFORE INSERT OR UPDATE ON public.business_owner_transfer_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_transfer_request_status();

CREATE INDEX IF NOT EXISTS idx_owner_transfer_requests_status ON public.business_owner_transfer_requests (status);
CREATE INDEX IF NOT EXISTS idx_owner_transfer_requests_business ON public.business_owner_transfer_requests (business_id);
