import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useClaimBusiness = (businessId?: string) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user || !businessId) {
      setStatus(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data } = await supabase
      .from("business_claims")
      .select("status")
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setStatus(data?.status || null);
    setLoading(false);
  }, [businessId, user]);

  const requestClaim = useCallback(async (note?: string) => {
    if (!user || !businessId) throw new Error("not-authenticated");

    const { error } = await supabase
      .from("business_claims")
      .insert({ user_id: user.id, business_id: businessId, note: note?.trim() || null });

    if (error) throw error;
    await refresh();
  }, [businessId, refresh, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { status, loading, requestClaim, refresh };
};
