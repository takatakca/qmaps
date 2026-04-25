-- Account deletion requests table
CREATE TABLE public.account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reason text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid,
  internal_note text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Status validation trigger (avoid CHECK on text for flexibility)
CREATE OR REPLACE FUNCTION public.validate_account_deletion_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('pending','processing','completed','canceled','rejected') THEN
    RAISE EXCEPTION 'Invalid account deletion status: %', NEW.status;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_account_deletion_status
BEFORE INSERT OR UPDATE ON public.account_deletion_requests
FOR EACH ROW EXECUTE FUNCTION public.validate_account_deletion_status();

CREATE INDEX idx_account_deletion_requests_user ON public.account_deletion_requests(user_id);
CREATE INDEX idx_account_deletion_requests_status ON public.account_deletion_requests(status);

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Users: insert their own request
CREATE POLICY "Users can create own deletion requests"
ON public.account_deletion_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users: read their own requests
CREATE POLICY "Users can read own deletion requests"
ON public.account_deletion_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins: read all
CREATE POLICY "Admins can read all deletion requests"
ON public.account_deletion_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins: update all
CREATE POLICY "Admins can update deletion requests"
ON public.account_deletion_requests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));