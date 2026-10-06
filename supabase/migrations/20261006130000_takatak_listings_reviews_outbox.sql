-- QMAPS -> TAKATAK listings and reviews synchronization (contract v1).
-- QMAPS stays authoritative for businesses and reviews. Changes are queued
-- in a private outbox and delivered by the `takatak-sync-outbox` function,
-- so TAKATAK downtime can never block a QMAPS write.
--
-- Safety:
--  * Disabled by default: nothing is queued until
--    UPDATE public.takatak_sync_settings SET enabled = true WHERE id = 1;
--  * Queue triggers never raise: a failure only logs a warning and the
--    original business/review write always succeeds.
--  * Reviewer identity never leaves QMAPS: only a first name + initial.
--  * Outbox is not readable by anon/authenticated users.

CREATE TABLE IF NOT EXISTS public.takatak_sync_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.takatak_sync_settings (id, enabled)
VALUES (1, false)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.takatak_sync_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.takatak_sync_settings FROM anon, authenticated;
GRANT SELECT, UPDATE ON TABLE public.takatak_sync_settings TO service_role;

CREATE TABLE IF NOT EXISTS public.takatak_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  event_type text NOT NULL
    CHECK (event_type IN ('BUSINESS_UPSERTED','REVIEW_UPSERTED','REVIEW_DELETED')),
  aggregate_id uuid NOT NULL,
  payload_json jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','processed','failed','dead')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  locked_at timestamptz,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS takatak_outbox_ready_idx
  ON public.takatak_outbox (status, next_attempt_at, created_at);

ALTER TABLE public.takatak_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.takatak_outbox FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.takatak_outbox TO service_role;

-- Privacy-minimized reviewer label: "Marie T." (never email or account id).
CREATE OR REPLACE FUNCTION public.takatak_reviewer_label(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p.display_name IS NULL OR btrim(p.display_name) = '' THEN NULL
    WHEN position(' ' IN btrim(p.display_name)) = 0
      THEN left(btrim(p.display_name), 40)
    ELSE left(split_part(btrim(p.display_name), ' ', 1), 40) || ' ' ||
         upper(left(split_part(btrim(p.display_name), ' ', 2), 1)) || '.'
  END
  FROM public.profiles p
  WHERE p.id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.takatak_enqueue(
  p_event_type text,
  p_aggregate_id uuid,
  p_body jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid := gen_random_uuid();
BEGIN
  IF NOT COALESCE((SELECT enabled FROM public.takatak_sync_settings WHERE id = 1), false) THEN
    RETURN;
  END IF;

  INSERT INTO public.takatak_outbox (event_id, event_type, aggregate_id, payload_json)
  VALUES (
    v_event_id,
    p_event_type,
    p_aggregate_id,
    jsonb_build_object(
      'eventId', v_event_id,
      'eventType', p_event_type,
      'sourceApplication', 'QMAPS',
      'schemaVersion', 1,
      'occurredAt', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    ) || p_body
  );
END;
$$;

-- Payload builders shared by triggers and backfill (identical payloads).
CREATE OR REPLACE FUNCTION public.takatak_business_body(p_business_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object('business', jsonb_build_object(
    'id', b.id,
    'name', left(b.name, 200),
    'category', (
      SELECT left(c.name, 120)
      FROM public.business_categories bc
      JOIN public.categories c ON c.id = bc.category_id
      WHERE bc.business_id = b.id
      ORDER BY c.name
      LIMIT 1
    ),
    'phone', left(b.phone, 40),
    'website', left(b.website, 500),
    'address', left(b.address, 300),
    'city', left(b.city, 120),
    'region', left(b.region, 120),
    'postalCode', left(b.postal_code, 20),
    'country', left(b.country, 60),
    'avgRating', round(COALESCE(b.avg_rating, 0)::numeric, 2)::float8,
    'reviewsCount', GREATEST(COALESCE(b.reviews_count, 0), 0),
    'isActive', b.is_active,
    'isClaimed', b.is_claimed
  ))
  FROM public.businesses b
  WHERE b.id = p_business_id;
$$;

CREATE OR REPLACE FUNCTION public.takatak_review_body(p_review_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object('review', jsonb_build_object(
    'id', r.id,
    'businessId', r.business_id,
    'rating', r.rating,
    'body', left(r.body, 5000),
    'reviewerDisplayName', public.takatak_reviewer_label(r.user_id),
    'createdAt', to_char(r.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  ))
  FROM public.reviews r
  WHERE r.id = p_review_id;
$$;

CREATE OR REPLACE FUNCTION public.takatak_queue_business()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND
     (NEW.name, NEW.phone, NEW.website, NEW.address, NEW.city, NEW.region,
      NEW.postal_code, NEW.country, NEW.avg_rating, NEW.reviews_count,
      NEW.is_active, NEW.is_claimed)
     IS NOT DISTINCT FROM
     (OLD.name, OLD.phone, OLD.website, OLD.address, OLD.city, OLD.region,
      OLD.postal_code, OLD.country, OLD.avg_rating, OLD.reviews_count,
      OLD.is_active, OLD.is_claimed) THEN
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM public.takatak_enqueue(
      'BUSINESS_UPSERTED', NEW.id, public.takatak_business_body(NEW.id));
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'takatak_queue_business skipped: %', SQLSTATE;
  END;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.takatak_queue_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.reviews%ROWTYPE;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_row := OLD;
  ELSE
    v_row := NEW;
  END IF;

  BEGIN
    IF TG_OP = 'DELETE' OR v_row.moderation_status = 'hidden' THEN
      PERFORM public.takatak_enqueue(
        'REVIEW_DELETED',
        v_row.id,
        jsonb_build_object('review', jsonb_build_object(
          'id', v_row.id,
          'businessId', v_row.business_id
        ))
      );
    ELSIF TG_OP = 'INSERT' OR
      (v_row.rating, v_row.body, v_row.moderation_status)
        IS DISTINCT FROM (OLD.rating, OLD.body, OLD.moderation_status) THEN
      PERFORM public.takatak_enqueue(
        'REVIEW_UPSERTED', v_row.id, public.takatak_review_body(v_row.id));
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'takatak_queue_review skipped: %', SQLSTATE;
  END;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS takatak_queue_business ON public.businesses;
CREATE TRIGGER takatak_queue_business
  AFTER INSERT OR UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.takatak_queue_business();

DROP TRIGGER IF EXISTS takatak_queue_review ON public.reviews;
CREATE TRIGGER takatak_queue_review
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.takatak_queue_review();

-- Delivery helpers (service role only).
CREATE OR REPLACE FUNCTION public.claim_takatak_outbox(p_limit integer DEFAULT 20)
RETURNS SETOF public.takatak_outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT o.id
    FROM public.takatak_outbox o
    WHERE (
      o.status IN ('pending','failed')
      OR (o.status = 'processing' AND o.locked_at < now() - interval '10 minutes')
    )
      AND o.next_attempt_at <= now()
    ORDER BY o.created_at
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100)
  )
  UPDATE public.takatak_outbox o
  SET status = 'processing',
      attempt_count = o.attempt_count + 1,
      locked_at = now(),
      updated_at = now(),
      last_error = NULL
  FROM candidates c
  WHERE o.id = c.id
  RETURNING o.*;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_takatak_outbox_processed(p_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.takatak_outbox
  SET status = 'processed',
      processed_at = now(),
      locked_at = NULL,
      last_error = NULL,
      updated_at = now()
  WHERE id = p_id;
$$;

-- Retryable failures back off exponentially (1 min .. 6 h); permanent
-- rejections (or 12 attempts) become 'dead' for manual review.
CREATE OR REPLACE FUNCTION public.mark_takatak_outbox_failed(
  p_id uuid,
  p_error text,
  p_permanent boolean DEFAULT false
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.takatak_outbox
  SET status = CASE
        WHEN p_permanent OR attempt_count >= 12 THEN 'dead'
        ELSE 'failed'
      END,
      last_error = left(COALESCE(p_error, 'delivery failed'), 300),
      next_attempt_at = now() + LEAST(
        interval '6 hours',
        interval '1 minute' * power(2, LEAST(attempt_count, 12))
      ),
      locked_at = NULL,
      updated_at = now()
  WHERE id = p_id;
$$;

REVOKE ALL ON FUNCTION public.takatak_reviewer_label(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.takatak_enqueue(text, uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_takatak_outbox(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_takatak_outbox_processed(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_takatak_outbox_failed(uuid, text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_takatak_outbox(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_takatak_outbox_processed(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_takatak_outbox_failed(uuid, text, boolean) TO service_role;

-- One-time backfill: queue every active business and visible review.
-- Run manually after enabling the sync and linking businesses in TAKATAK:
--   SELECT public.takatak_backfill();
CREATE OR REPLACE FUNCTION public.takatak_backfill()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  v_id uuid;
BEGIN
  IF NOT COALESCE((SELECT enabled FROM public.takatak_sync_settings WHERE id = 1), false) THEN
    RAISE EXCEPTION 'takatak_sync_disabled';
  END IF;

  FOR v_id IN SELECT b.id FROM public.businesses b WHERE b.is_active ORDER BY b.created_at LOOP
    PERFORM public.takatak_enqueue('BUSINESS_UPSERTED', v_id, public.takatak_business_body(v_id));
    v_count := v_count + 1;
  END LOOP;

  FOR v_id IN
    SELECT r.id
    FROM public.reviews r
    JOIN public.businesses b ON b.id = r.business_id AND b.is_active
    WHERE r.moderation_status <> 'hidden'
    ORDER BY r.created_at
  LOOP
    PERFORM public.takatak_enqueue('REVIEW_UPSERTED', v_id, public.takatak_review_body(v_id));
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.takatak_business_body(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.takatak_review_body(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.takatak_backfill() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.takatak_backfill() TO service_role;
