import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ProjectRequest {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  budget_min: number | null;
  budget_max: number | null;
  urgency: string;
  preferred_contact_method: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectRequestInput {
  category_id?: string | null;
  title: string;
  description?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  budget_min?: number | null;
  budget_max?: number | null;
  urgency?: string;
  preferred_contact_method?: string;
}

const REFRESH_EVENT = "qmaps:project-requests-updated";

/**
 * Manages the current user's project requests (briefs they posted).
 */
export const useProjectRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("project_requests" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
      setRequests([]);
    } else {
      setRequests((data ?? []) as unknown as ProjectRequest[]);
      setError(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRequests();
    const handler = () => fetchRequests();
    window.addEventListener(REFRESH_EVENT, handler);
    return () => window.removeEventListener(REFRESH_EVENT, handler);
  }, [fetchRequests]);

  const createRequest = useCallback(
    async (input: ProjectRequestInput) => {
      if (!user) return { error: "Not authenticated" as const, data: null };
      const payload = { ...input, user_id: user.id };
      const { data, error } = await supabase
        .from("project_requests" as any)
        .insert(payload)
        .select()
        .single();
      if (!error) window.dispatchEvent(new Event(REFRESH_EVENT));
      return { data: (data as unknown) as ProjectRequest | null, error: error?.message ?? null };
    },
    [user],
  );

  const updateRequest = useCallback(
    async (id: string, patch: Partial<ProjectRequestInput> & { status?: string }) => {
      const { data, error } = await supabase
        .from("project_requests" as any)
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (!error) window.dispatchEvent(new Event(REFRESH_EVENT));
      return { data: (data as unknown) as ProjectRequest | null, error: error?.message ?? null };
    },
    [],
  );

  const deleteRequest = useCallback(async (id: string) => {
    const { error } = await supabase.from("project_requests" as any).delete().eq("id", id);
    if (!error) window.dispatchEvent(new Event(REFRESH_EVENT));
    return { error: error?.message ?? null };
  }, []);

  return {
    requests,
    loading,
    error,
    refresh: fetchRequests,
    createRequest,
    updateRequest,
    deleteRequest,
  };
};
