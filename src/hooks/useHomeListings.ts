import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

/**
 * Homepage listings — REAL data only.
 *
 * Reads `public.businesses` (RLS-protected, public read of active rows) plus the
 * `business_categories -> categories` join for a display category. Nothing on the
 * homepage is mocked: if a section has no rows, the UI shows an honest empty state.
 *
 * Fields consumed (see docs/takatak-integration.md):
 *   id, name, city, address, avg_rating, reviews_count, price_level, status,
 *   is_open, is_active, is_claimed, image_url, photos, created_at, updated_at
 */
export type HomeListing = Tables<"businesses"> & {
  category_name?: string | null;
  category_slug?: string | null;
};

export interface HomeListings {
  restaurants: HomeListing[];
  popular: HomeListing[];
  services: HomeListing[];
  recent: HomeListing[];
  essentials: HomeListing[];
  loading: boolean;
  error: string | null;
  total: number;
}

const FOOD = /restaur|poutin|bistro|caf[eé]|traiteur|pizz|sushi|burger|brasserie|p[aâ]tisser|boulanger/i;
const SERVICE = /nettoy|[eé]lectric|plomb|construc|r[eé]nov|auto|garage|m[eé]canic|beaut|salon|coiff|sant|clinique|avocat|notaire|comptab|imp[oô]t|marketing|web|design|d[eé]m[eé]nag|paysag|toiture|service/i;
const ESSENTIAL = /[eé]picer|d[eé]panneur|march[eé]|alimentation|pharmac|boucher|fruiterie|quincaill/i;

const VISIBLE_STATUSES = ["open", "temporarily_closed", "seasonal"];

const score = (b: HomeListing) => Number(b.avg_rating || 0) * 10 + Math.min(b.reviews_count || 0, 100) / 10;

export const useHomeListings = (perSection = 10): HomeListings => {
  const [rows, setRows] = useState<HomeListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const { data, error: queryError } = await supabase
        .from("businesses")
        .select("*, business_categories(categories(name, slug))")
        .eq("is_active", true)
        .in("status", VISIBLE_STATUSES)
        .order("avg_rating", { ascending: false })
        .limit(60);

      if (cancelled) return;
      if (queryError) {
        setError("Impossible de charger les entreprises pour le moment.");
        setRows([]);
      } else {
        setRows(
          (data ?? []).map((row: any) => {
            const cat = row.business_categories?.[0]?.categories;
            const { business_categories: _drop, ...business } = row;
            return { ...business, category_name: cat?.name ?? null, category_slug: cat?.slug ?? null };
          }),
        );
        setError(null);
      }
      setLoading(false);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const text = (b: HomeListing) => `${b.category_name ?? ""} ${b.category_slug ?? ""} ${b.name}`;

  return {
    restaurants: rows.filter((b) => FOOD.test(text(b))).sort((a, b) => score(b) - score(a)).slice(0, perSection),
    popular: [...rows].sort((a, b) => score(b) - score(a)).slice(0, perSection),
    services: rows.filter((b) => SERVICE.test(text(b)) && !FOOD.test(text(b))).sort((a, b) => score(b) - score(a)).slice(0, perSection),
    recent: [...rows]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, perSection),
    essentials: rows.filter((b) => ESSENTIAL.test(text(b))).slice(0, perSection),
    loading,
    error,
    total: rows.length,
  };
};
