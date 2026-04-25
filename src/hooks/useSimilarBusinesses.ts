/**
 * Phase 9D — Similar businesses hook for BusinessDetail.
 *
 * Same categories or same city, excluding the current business. Sorted by
 * rating then review count. Includes a short reason text.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export interface SimilarBusiness {
  business: Tables<"businesses">;
  reason: string;
}

export const useSimilarBusinesses = (
  businessId: string | undefined,
  options?: { limit?: number }
) => {
  const [items, setItems] = useState<SimilarBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const limit = options?.limit ?? 6;

  useEffect(() => {
    if (!businessId) {
      setItems([]);
      setLoading(false);
      return;
    }
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const { data: current } = await supabase
          .from("businesses")
          .select("id, city")
          .eq("id", businessId)
          .maybeSingle();

        const { data: catRows } = await supabase
          .from("business_categories")
          .select("category_id")
          .eq("business_id", businessId);
        const categoryIds = (catRows ?? []).map((r: any) => r.category_id);

        let candidateIds: string[] = [];
        if (categoryIds.length > 0) {
          const { data: bcs } = await supabase
            .from("business_categories")
            .select("business_id, category_id")
            .in("category_id", categoryIds);
          candidateIds = Array.from(
            new Set((bcs ?? []).map((r: any) => r.business_id).filter((id) => id !== businessId))
          );
        }

        // Pull candidates
        let candidates: Tables<"businesses">[] = [];
        if (candidateIds.length > 0) {
          const { data } = await supabase
            .from("businesses")
            .select("*")
            .in("id", candidateIds.slice(0, 60))
            .eq("is_active", true)
            .order("avg_rating", { ascending: false })
            .limit(40);
          candidates = data ?? [];
        }

        // Top-up by city if too few
        if (candidates.length < limit && current?.city) {
          const { data: cityData } = await supabase
            .from("businesses")
            .select("*")
            .eq("city", current.city)
            .eq("is_active", true)
            .neq("id", businessId)
            .order("avg_rating", { ascending: false })
            .limit(20);
          for (const b of cityData ?? []) {
            if (!candidates.find((c) => c.id === b.id)) candidates.push(b);
          }
        }

        const ranked: SimilarBusiness[] = candidates
          .sort((a, b) => {
            const ra = Number(a.avg_rating ?? 0);
            const rb = Number(b.avg_rating ?? 0);
            if (rb !== ra) return rb - ra;
            return Number(b.reviews_count ?? 0) - Number(a.reviews_count ?? 0);
          })
          .slice(0, limit)
          .map((b) => ({
            business: b,
            reason:
              current?.city && b.city === current.city
                ? "Même ville"
                : "Catégorie similaire",
          }));

        if (!cancelled) setItems(ranked);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId, limit]);

  return { items, loading };
};
