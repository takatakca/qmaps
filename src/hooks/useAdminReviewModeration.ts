/**
 * Phase 9D — Admin-only review moderation hook.
 *
 * RLS guards everything; this hook is only useful to admins.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ReviewModerationStatus, ReviewRiskLevel, ReviewSignalType } from "@/lib/reviewTrust";

export interface FlaggedReview {
  trust: any;
  review: any;
  business: { id: string; name: string; city: string | null } | null;
  user: { id: string; display_name: string | null } | null;
  signals: any[];
}

export interface ModerationFilters {
  riskLevel?: ReviewRiskLevel | "all";
  status?: ReviewModerationStatus | "all";
  signalType?: ReviewSignalType | "all";
  businessId?: string | null;
  fromDate?: string | null; // ISO
  toDate?: string | null; // ISO
}

export const useAdminReviewModeration = (filters: ModerationFilters = {}) => {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<FlaggedReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!isAdmin) {
      setItems([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        let query: any = supabase
          .from("review_trust_scores" as any)
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(100);
        if (filters.riskLevel && filters.riskLevel !== "all") {
          query = query.eq("risk_level", filters.riskLevel);
        }
        if (filters.status && filters.status !== "all") {
          query = query.eq("status", filters.status);
        }
        if (filters.fromDate) query = query.gte("updated_at", filters.fromDate);
        if (filters.toDate) query = query.lte("updated_at", filters.toDate);

        const { data: scores } = await query;
        const trustList = (scores ?? []) as any[];
        if (trustList.length === 0) {
          if (!cancelled) setItems([]);
          return;
        }

        const reviewIds = trustList.map((t) => t.review_id);
        const { data: reviews } = await supabase
          .from("reviews")
          .select("id, body, rating, user_id, business_id, moderation_status, created_at")
          .in("id", reviewIds);

        let filteredReviews = reviews ?? [];
        if (filters.businessId) {
          filteredReviews = filteredReviews.filter((r) => r.business_id === filters.businessId);
        }

        const businessIds = Array.from(new Set(filteredReviews.map((r) => r.business_id)));
        const userIds = Array.from(new Set(filteredReviews.map((r) => r.user_id)));

        const { data: businesses } = businessIds.length
          ? await supabase.from("businesses").select("id, name, city").in("id", businessIds)
          : { data: [] as any[] };
        const { data: profiles } = userIds.length
          ? await supabase.from("profiles").select("id, display_name").in("id", userIds)
          : { data: [] as any[] };

        let signalQuery: any = supabase
          .from("review_moderation_signals" as any)
          .select("*")
          .in("review_id", reviewIds);
        if (filters.signalType && filters.signalType !== "all") {
          signalQuery = signalQuery.eq("signal_type", filters.signalType);
        }
        const { data: signals } = await signalQuery;

        const result: FlaggedReview[] = filteredReviews.map((r) => {
          const trust = trustList.find((t) => t.review_id === r.id);
          const biz = (businesses ?? []).find((b: any) => b.id === r.business_id) ?? null;
          const usr = (profiles ?? []).find((p: any) => p.id === r.user_id) ?? null;
          const sig = ((signals ?? []) as any[]).filter((s) => s.review_id === r.id);
          return { trust, review: r, business: biz, user: usr, signals: sig };
        });

        // If signal filter active, drop reviews with no matching signals
        const final =
          filters.signalType && filters.signalType !== "all"
            ? result.filter((r) => r.signals.length > 0)
            : result;

        if (!cancelled) setItems(final);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    isAdmin,
    filters.riskLevel,
    filters.status,
    filters.signalType,
    filters.businessId,
    filters.fromDate,
    filters.toDate,
    tick,
  ]);

  const updateStatus = useCallback(
    async (
      reviewId: string,
      newStatus: ReviewModerationStatus,
      action:
        | "mark_needs_review"
        | "mark_trusted"
        | "hide_review"
        | "restore_review"
        | "dismiss_flags"
        | "add_note"
        | "recompute_score",
      reason?: string
    ) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: new Error("not_authenticated") };

      // Read previous status
      const { data: prev } = await supabase
        .from("review_trust_scores" as any)
        .select("status")
        .eq("review_id", reviewId)
        .maybeSingle();
      const previous_status = (prev as any)?.status ?? null;

      const updates: Record<string, any> = {
        status: newStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      };
      const { error: updateError } = await supabase
        .from("review_trust_scores" as any)
        .update(updates)
        .eq("review_id", reviewId);
      if (updateError) return { error: updateError };

      // Mirror onto reviews.moderation_status for hide/restore/trusted
      if (action === "hide_review") {
        await supabase
          .from("reviews")
          .update({
            moderation_status: "hidden",
            hidden_at: new Date().toISOString(),
            hidden_by: user.id,
            hidden_reason: reason ?? null,
          } as any)
          .eq("id", reviewId);
      } else if (action === "restore_review") {
        await supabase
          .from("reviews")
          .update({
            moderation_status: "visible",
            hidden_at: null,
            hidden_by: null,
            hidden_reason: null,
          } as any)
          .eq("id", reviewId);
      } else if (action === "mark_trusted") {
        await supabase
          .from("reviews")
          .update({ moderation_status: "trusted" } as any)
          .eq("id", reviewId);
      } else if (action === "mark_needs_review") {
        await supabase
          .from("reviews")
          .update({ moderation_status: "needs_review" } as any)
          .eq("id", reviewId);
      }

      // Audit
      await supabase.from("review_moderation_actions" as any).insert({
        review_id: reviewId,
        actor_user_id: user.id,
        action,
        reason: reason ?? null,
        previous_status,
        new_status: newStatus,
        metadata: {},
      } as any);

      refresh();
      return { error: null };
    },
    [refresh]
  );

  const recompute = useCallback(
    async (reviewId: string) => {
      try {
        await supabase.functions.invoke("analyze-review-risk", {
          body: { review_id: reviewId, force: true },
        });
      } catch {
        // ignore — function may be unavailable
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("review_moderation_actions" as any).insert({
          review_id: reviewId,
          actor_user_id: user.id,
          action: "recompute_score",
          metadata: {},
        } as any);
      }
      refresh();
    },
    [refresh]
  );

  const addNote = useCallback(
    async (reviewId: string, note: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("review_moderation_actions" as any).insert({
        review_id: reviewId,
        actor_user_id: user.id,
        action: "add_note",
        reason: note,
        metadata: {},
      } as any);
      refresh();
    },
    [refresh]
  );

  return { items, loading, refresh, updateStatus, recompute, addNote };
};
