import { useEffect, useState } from "react";
import { topPlaces, type DirectoryPlace } from "@/lib/ownedDirectory";
import { exampleListingTitle } from "@/lib/exampleListing";

/**
 * Public homepage rows use the same catalogue as browser search. Keep the
 * candidate window bounded and the category display separate from the API shape.
 */
export type HomeListing = Pick<DirectoryPlace,
  "id" | "name" | "city" | "avg_rating" | "reviews_count" | "price_level" | "status" |
  "is_open" | "is_claimed" | "image_url" | "photos" | "created_at"
> & {
  category_name?: string | null;
  category_slug?: string | null;
  hours?: DirectoryPlace["hours"];
  hours_json?: DirectoryPlace["hours_json"];
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

const score = (b: HomeListing) => Number(b.avg_rating || 0) * 10 + Math.min(b.reviews_count || 0, 100) / 10;
const createdAt = (b: HomeListing) => Date.parse(b.created_at ?? "") || 0;
const examplesLast = (a: HomeListing, b: HomeListing) =>
  Number(Boolean(exampleListingTitle(a))) - Number(Boolean(exampleListingTitle(b)));

export const useHomeListings = (perSection = 10): HomeListings => {
  const [rows, setRows] = useState<HomeListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      try {
        const places = await topPlaces(new URLSearchParams(), 60, controller.signal);
        if (controller.signal.aborted) return;
        setRows(places.map(place => {
          const category = place.business_categories?.[0]?.categories;
          return { ...place, category_name: category?.name ?? null, category_slug: category?.slug ?? null };
        }));
        setError(null);
      } catch {
        if (controller.signal.aborted) return;
        setError("Impossible de charger les entreprises pour le moment.");
        setRows([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void run();
    return () => controller.abort();
  }, []);

  const text = (b: HomeListing) => `${b.category_name ?? ""} ${b.category_slug ?? ""} ${b.name}`;

  return {
    restaurants: rows.filter((b) => FOOD.test(text(b))).sort((a, b) => examplesLast(a, b) || score(b) - score(a)).slice(0, perSection),
    popular: [...rows].sort((a, b) => examplesLast(a, b) || score(b) - score(a)).slice(0, perSection),
    services: rows.filter((b) => SERVICE.test(text(b)) && !FOOD.test(text(b))).sort((a, b) => examplesLast(a, b) || score(b) - score(a)).slice(0, perSection),
    recent: [...rows]
      .sort((a, b) => examplesLast(a, b) || createdAt(b) - createdAt(a))
      .slice(0, perSection),
    essentials: rows.filter((b) => ESSENTIAL.test(text(b))).slice(0, perSection),
    loading,
    error,
    total: rows.length,
  };
};
