
-- Revoke any blanket privileges
REVOKE SELECT ON public.profiles FROM anon, authenticated;

-- Column-level grants: hide email from anon/authenticated table reads
GRANT SELECT (id, display_name, avatar_url, created_at, updated_at) ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Admin RPC: return profile rows including email (admin-only)
CREATE OR REPLACE FUNCTION public.admin_list_profiles(_limit int DEFAULT 100)
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text,
  email text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.display_name, p.avatar_url, p.email, p.created_at
    FROM public.profiles p
   WHERE public.has_role(auth.uid(), 'admin')
   ORDER BY p.created_at DESC
   LIMIT GREATEST(COALESCE(_limit, 100), 1)
$$;

REVOKE ALL ON FUNCTION public.admin_list_profiles(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_profiles(int) TO authenticated;
