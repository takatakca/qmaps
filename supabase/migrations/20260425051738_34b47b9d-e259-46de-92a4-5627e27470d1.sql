-- Phase 9B — Hide moderation-hidden reviews from public read
-- The existing "Reviews readable by everyone" policy returned every row.
-- We replace it (same name) with a stricter version: hidden reviews are
-- only visible to their author or to admins. All other statuses remain
-- public.

DROP POLICY IF EXISTS "Reviews readable by everyone" ON public.reviews;

CREATE POLICY "Reviews readable by everyone"
ON public.reviews
FOR SELECT
USING (
  moderation_status <> 'hidden'
  OR auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);