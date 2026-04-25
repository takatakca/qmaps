import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

/**
 * Service-like slugs we treat as eligible for the Projects marketplace
 * when no `category_type = 'service'` rows exist yet.
 */
export const SERVICE_SLUGS = [
  "movers",
  "cleaning",
  "plumbers",
  "electricians",
  "auto-repair",
  "contractors",
  "handyman",
  "hvac",
  "roofing",
];

/**
 * Returns categories used for the Projects marketplace.
 * Prefers `category_type = 'service'` rows; otherwise falls back
 * to the SERVICE_SLUGS list above.
 */
export const useProjectCategories = () => {
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      // Try service-typed categories first
      const serviceRes = await supabase
        .from("categories")
        .select("id, name, slug, icon")
        .eq("category_type", "service")
        .order("name", { ascending: true });

      if (cancelled) return;

      if (!serviceRes.error && (serviceRes.data?.length ?? 0) > 0) {
        setCategories(serviceRes.data as ProjectCategory[]);
        setError(null);
        setLoading(false);
        return;
      }

      // Fallback: filter by known service slugs
      const fallbackRes = await supabase
        .from("categories")
        .select("id, name, slug, icon")
        .in("slug", SERVICE_SLUGS)
        .order("name", { ascending: true });

      if (cancelled) return;
      if (fallbackRes.error) {
        setError(fallbackRes.error.message);
        setCategories([]);
      } else {
        setCategories((fallbackRes.data ?? []) as ProjectCategory[]);
        setError(null);
      }
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loading, error };
};
