/**
 * Phase 9D — Recommended businesses hook.
 *
 * Returns personalized recommendations when user history exists, otherwise
 * falls back to trending/top-rated. Never empty unless DB has no businesses.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  rankRecommendations,
  fallbackRecommendationOrder,
  type RecommendationReasonCode,
  type ScoringContext,
} from "@/lib/recommendations";
import type { Tables } from "@/integrations/supabase/types";

export interface RecommendedBusiness {
  business: Tables<"businesses"> & { category_ids?: string[] };
  score: number;
  reasonCodes: RecommendationReasonCode[];
}

interface UseRecommendedBusinessesResult {
  recommended: RecommendedBusiness[];
  trending: Tables<"businesses">[];
  becauseYouLiked: RecommendedBusiness[];
  nearbyPopular: Tables<"businesses">[];
  loading: boolean;
  refresh: () => void;
}

export const useRecommendedBusinesses = (
  options?: { city?: string | null; limit?: number }
): UseRecommendedBusinessesResult => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Array<Tables<"businesses"> & { category_ids?: string[] }>>([]);
  const [ctx, setCtx] = useState<ScoringContext>({});
  const [tick, setTick] = useState(0);
  const limit = options?.limit ?? 8;
  const cityHint = options?.city ?? null;

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // 1) Pull a wide candidate set
        const { data: bizData } = await supabase
          .from("businesses")
          .select("*")
          .eq("is_active", true)
          .order("avg_rating", { ascending: false })
          .limit(80);

        // Attach categories (best-effort)
        const ids = (bizData ?? []).map((b) => b.id);
        let categoryMap: Record<string, string[]> = {};
        if (ids.length > 0) {
          const { data: cats } = await supabase
            .from("business_categories")
            .select("business_id, category_id")
            .in("business_id", ids);
          for (const row of cats ?? []) {
            const k = (row as any).business_id as string;
            if (!categoryMap[k]) categoryMap[k] = [];
            categoryMap[k].push((row as any).category_id);
          }
        }
        const enriched = (bizData ?? []).map((b) => ({
          ...b,
          category_ids: categoryMap[b.id] ?? [],
        }));

        // 2) Build user context
        let scoringCtx: ScoringContext = {};
        if (user) {
          // Recent recommendation events
          const { data: events } = await supabase
            .from("recommendation_events" as any)
            .select("business_id, category_id, city, event_type, weight, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(150);

          const catTally: Record<string, number> = {};
          const cityTally: Record<string, number> = {};
          const recentBusinessIds: string[] = [];
          for (const e of (events ?? []) as any[]) {
            if (e.category_id) catTally[e.category_id] = (catTally[e.category_id] ?? 0) + (Number(e.weight) || 1);
            if (e.city) cityTally[e.city] = (cityTally[e.city] ?? 0) + (Number(e.weight) || 1);
            if (e.business_id && recentBusinessIds.length < 25) recentBusinessIds.push(e.business_id);
          }

          // Bookmarks
          const { data: bookmarks } = await supabase
            .from("bookmarks")
            .select("business_id")
            .eq("user_id", user.id);

          // Dismissed via feedback
          const { data: feedback } = await supabase
            .from("recommendation_feedback" as any)
            .select("business_id, feedback_type")
            .eq("user_id", user.id);

          const topCategoryIds = Object.entries(catTally)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id]) => id);
          const topCities = Object.entries(cityTally)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([id]) => id);

          scoringCtx = {
            topCategoryIds,
            topCities: cityHint ? [cityHint, ...topCities] : topCities,
            recentBusinessIds,
            bookmarkedBusinessIds: (bookmarks ?? []).map((b: any) => b.business_id),
            dismissedBusinessIds: ((feedback ?? []) as any[])
              .filter((f) => ["dismissed", "not_interested", "irrelevant"].includes(f.feedback_type))
              .map((f) => f.business_id),
          };
        } else if (cityHint) {
          scoringCtx = { topCities: [cityHint] };
        }

        if (!cancelled) {
          setBusinesses(enriched);
          setCtx(scoringCtx);
        }
      } catch {
        if (!cancelled) {
          setBusinesses([]);
          setCtx({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, cityHint, tick]);

  const recommended = useMemo(() => {
    if (!businesses.length) return [];
    const ranked = rankRecommendations(businesses, ctx, limit);
    if (ranked.length > 0) return ranked;
    // Defensive fallback
    return fallbackRecommendationOrder(businesses)
      .slice(0, limit)
      .map((b) => ({ business: b, score: 0, reasonCodes: ["fallback_top_rated" as RecommendationReasonCode] }));
  }, [businesses, ctx, limit]);

  const trending = useMemo(() => {
    return [...businesses]
      .filter((b) => Number(b.reviews_count ?? 0) >= 5)
      .sort((a, b) => Number(b.reviews_count ?? 0) - Number(a.reviews_count ?? 0))
      .slice(0, limit);
  }, [businesses, limit]);

  const becauseYouLiked = useMemo(() => {
    if (!ctx.topCategoryIds?.length) return [];
    const filtered = businesses.filter((b) =>
      (b.category_ids ?? []).some((c) => ctx.topCategoryIds!.includes(c))
    );
    return rankRecommendations(filtered, ctx, limit);
  }, [businesses, ctx, limit]);

  const nearbyPopular = useMemo(() => {
    const cities = ctx.topCities ?? (cityHint ? [cityHint] : []);
    if (cities.length === 0) return trending.slice(0, limit);
    return businesses
      .filter((b) => cities.some((c) => (b.city ?? "").toLowerCase() === c.toLowerCase()))
      .sort((a, b) => Number(b.avg_rating ?? 0) - Number(a.avg_rating ?? 0))
      .slice(0, limit);
  }, [businesses, ctx, cityHint, limit, trending]);

  return { recommended, trending, becauseYouLiked, nearbyPopular, loading, refresh };
};
