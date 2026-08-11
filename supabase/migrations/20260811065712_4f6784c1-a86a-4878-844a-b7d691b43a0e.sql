CREATE OR REPLACE FUNCTION public.guard_phone_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role', true) IS DISTINCT FROM 'service_role'
     AND auth.role() IS DISTINCT FROM 'service_role' THEN
    NEW.phone_verified_at := OLD.phone_verified_at;
    NEW.phone := OLD.phone;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_phone_verification ON public.profiles;
CREATE TRIGGER trg_guard_phone_verification
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_phone_verification();