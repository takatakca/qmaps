-- Restore column-level grants on profiles so PostgREST can serve safe columns
-- to anon and authenticated, while keeping `email` hidden from the Data API.

REVOKE ALL ON TABLE public.profiles FROM anon, authenticated;

GRANT SELECT (id, display_name, avatar_url, created_at, updated_at)
  ON public.profiles TO anon, authenticated;

GRANT INSERT (id, display_name, avatar_url) ON public.profiles TO authenticated;
GRANT UPDATE (display_name, avatar_url, updated_at) ON public.profiles TO authenticated;

GRANT ALL ON public.profiles TO service_role;

-- Lock down the admin RPC: only authenticated users may call it; the function
-- itself enforces has_role(auth.uid(), 'admin').
REVOKE ALL ON FUNCTION public.admin_list_profiles(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_profiles(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_profiles(integer) TO service_role;