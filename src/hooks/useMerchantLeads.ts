import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ProjectRequest } from "@/hooks/useProjectRequests";

/**
 * Returns project requests visible to the current merchant — i.e. requests
 * whose category matches one of their owned businesses' service categories.
 *
 * Visibility is enforced by RLS, so this hook simply selects from
 * `project_requests` and the database filters down to allowed rows.
 */
export const useMerchantLeads = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    if (!user) {
      setLeads([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("project_requests" as any)
      .select("*")
      .neq("user_id", user.id) // exclude requests the merchant created themselves
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      setError(error.message);
      setLeads([]);
    } else {
      setLeads((data ?? []) as unknown as ProjectRequest[]);
      setError(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { leads, loading, error, refresh: fetchLeads };
};
