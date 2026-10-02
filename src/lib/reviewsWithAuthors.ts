import { supabase } from "@/integrations/supabase/client";

/**
 * Loads a business's reviews plus each author's display name.
 * reviews.user_id points to auth users (not profiles), so names are fetched separately.
 */
export const fetchReviewsWithAuthors = async (businessId: string) => {
  const { data: revs } = await supabase
    .from("reviews")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  const reviews = revs || [];
  const ids = Array.from(new Set(reviews.map((r) => r.user_id)));
  const names = new Map<string, string | null>();
  if (ids.length) {
    const { data: profs } = await supabase.from("profiles").select("id, display_name").in("id", ids);
    (profs || []).forEach((p) => names.set(p.id, p.display_name));
  }
  return reviews.map((r) => ({ ...r, profiles: { display_name: names.get(r.user_id) ?? null } }));
};
