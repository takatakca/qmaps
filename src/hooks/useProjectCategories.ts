import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

/**
 * Returns categories used for the Projects marketplace.
 * For now this returns all categories — a `category_type = 'service'` filter
 * can be applied later once service categories are seeded.
 */
export const useProjectCategories = () => {
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, icon")
        .order("name", { ascending: true });
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setCategories([]);
      } else {
        setCategories((data ?? []) as ProjectCategory[]);
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
