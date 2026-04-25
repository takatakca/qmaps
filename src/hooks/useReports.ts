import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ReportTargetType =
  | "business"
  | "review"
  | "business_photo"
  | "review_photo"
  | "user"
  | "project_request"
  | "project_quote"
  | "message";

export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

export interface ReportRow {
  id: string;
  reporter_user_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  internal_note: string | null;
  created_at: string;
  updated_at: string;
}

export const useCreateReport = () => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const submit = useCallback(
    async (input: {
      target_type: ReportTargetType;
      target_id: string;
      reason: string;
      details?: string;
    }) => {
      if (!user) throw new Error("not-authenticated");
      setSubmitting(true);
      try {
        const { error } = await supabase.from("reports" as any).insert({
          reporter_user_id: user.id,
          target_type: input.target_type,
          target_id: input.target_id,
          reason: input.reason,
          details: input.details?.trim() || null,
        });
        if (error) throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [user]
  );

  return { submit, submitting };
};

export const useAdminReports = (filters?: {
  status?: ReportStatus | "all";
  target_type?: ReportTargetType | "all";
}) => {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("reports" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status);
    if (filters?.target_type && filters.target_type !== "all")
      query = query.eq("target_type", filters.target_type);

    const { data } = await query;
    setReports((data as unknown as ReportRow[]) || []);
    setLoading(false);
  }, [filters?.status, filters?.target_type]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateStatus = useCallback(
    async (id: string, status: ReportStatus, internal_note?: string) => {
      const patch: Record<string, unknown> = {
        status,
        reviewed_at: new Date().toISOString(),
      };
      if (internal_note !== undefined) patch.internal_note = internal_note;
      const { error } = await supabase.from("reports" as any).update(patch).eq("id", id);
      if (error) throw error;
      await refresh();
    },
    [refresh]
  );

  return { reports, loading, refresh, updateStatus };
};
