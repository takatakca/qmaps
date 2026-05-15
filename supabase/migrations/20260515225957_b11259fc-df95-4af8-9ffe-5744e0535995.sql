-- Phase 5: explicit business status, backed by a CHECK constraint.
-- Keeps is_open / is_active as-is so existing RLS, search filters, and
-- public visibility rules continue to work unchanged.

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open';

-- Backfill from existing booleans (idempotent — only touches rows still on
-- the default 'open' that don't actually match).
UPDATE public.businesses
SET status = CASE
  WHEN is_active = false THEN 'hidden'
  WHEN is_open = false THEN 'temporarily_closed'
  ELSE 'open'
END
WHERE status = 'open'
  AND (is_active = false OR is_open = false);

-- Constrain to the 5 supported values.
ALTER TABLE public.businesses
  DROP CONSTRAINT IF EXISTS businesses_status_check;
ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_status_check
  CHECK (status IN ('open','temporarily_closed','permanently_closed','seasonal','hidden'));

CREATE INDEX IF NOT EXISTS idx_businesses_status ON public.businesses(status);
