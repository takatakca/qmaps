CREATE TABLE public.account_deletion_request_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.account_deletion_requests(id) ON DELETE CASCADE,
  actor_user_id uuid,
  event_type text NOT NULL,
  previous_status text,
  new_status text,
  note text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_account_deletion_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.event_type NOT IN ('created','status_changed','note_added') THEN
    RAISE EXCEPTION 'Invalid event_type: %', NEW.event_type;
  END IF;
  IF NEW.previous_status IS NOT NULL
     AND NEW.previous_status NOT IN ('pending','processing','completed','canceled','rejected') THEN
    RAISE EXCEPTION 'Invalid previous_status: %', NEW.previous_status;
  END IF;
  IF NEW.new_status IS NOT NULL
     AND NEW.new_status NOT IN ('pending','processing','completed','canceled','rejected') THEN
    RAISE EXCEPTION 'Invalid new_status: %', NEW.new_status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_account_deletion_event
BEFORE INSERT OR UPDATE ON public.account_deletion_request_events
FOR EACH ROW EXECUTE FUNCTION public.validate_account_deletion_event();

CREATE INDEX idx_adre_request ON public.account_deletion_request_events(request_id);
CREATE INDEX idx_adre_created ON public.account_deletion_request_events(created_at DESC);

ALTER TABLE public.account_deletion_request_events ENABLE ROW LEVEL SECURITY;

-- Admins: read all
CREATE POLICY "Admins can read all deletion events"
ON public.account_deletion_request_events
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins: insert
CREATE POLICY "Admins can insert deletion events"
ON public.account_deletion_request_events
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND (actor_user_id IS NULL OR actor_user_id = auth.uid())
);

-- Users: read events for their own requests
CREATE POLICY "Users can read own deletion events"
ON public.account_deletion_request_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.account_deletion_requests r
    WHERE r.id = account_deletion_request_events.request_id
      AND r.user_id = auth.uid()
  )
);