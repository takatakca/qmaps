import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type ReviewWithAuthor = Tables<"reviews"> & {
  profiles?: { display_name: string | null } | null;
};

/**
 * Loads a business's reviews plus each author's display name.
 * reviews.user_id points to auth users (not profiles), so names are fetched separately.
 */
export const fetchReviewsWithAuthors = async (businessId: string) => {
  const { data: revs, error: reviewsError } = await supabase
    .from("reviews")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (reviewsError) throw reviewsError;
  const reviews = revs || [];
  const ids = Array.from(new Set(reviews.map((r) => r.user_id)));
  const names = new Map<string, string | null>();
  if (ids.length) {
    const { data: profs, error: profilesError } = await supabase.from("profiles").select("id, display_name").in("id", ids);
    if (profilesError) throw profilesError;
    (profs || []).forEach((p) => names.set(p.id, p.display_name));
  }
  return reviews.map((r) => ({ ...r, profiles: { display_name: names.get(r.user_id) ?? null } }));
};
