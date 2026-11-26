import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { directoryPages } from "@/lib/ownedDirectory";

export interface CategoryLite {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parent_id: string | null;
  category_type: string | null;
}

export interface CategoryWithParent extends CategoryLite {
  parent_name: string | null;
}

type CategorySource = "directory" | "transition";
const cache = new Map<CategorySource, CategoryLite[]>();
const inflight = new Map<CategorySource, Promise<CategoryLite[]>>();

async function readCategories(source: CategorySource): Promise<CategoryLite[]> {
  if (source === "transition") {
    const rows: CategoryLite[] = [];
    const pageSize = 500;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabase.from("categories")
        .select("id, name, slug, icon, parent_id, category_type")
        .eq("is_active", true)
        .order("sort_order").order("name").order("id")
        .range(offset, offset + pageSize - 1);
      if (error) throw error;
      rows.push(...(data ?? []));
      if (!data || data.length < pageSize) break;
    }
    return rows;
  }
  const rows = await directoryPages<CategoryLite & { sort_order: number | null }>("/categories", new URLSearchParams());
  return rows.sort((a, b) =>
    (a.sort_order ?? Infinity) - (b.sort_order ?? Infinity) ||
    a.name.localeCompare(b.name, "fr-CA") || a.id.localeCompare(b.id)
  );
}

function fetchAll(source: CategorySource): Promise<CategoryLite[]> {
  const available = cache.get(source);
  if (available) return Promise.resolve(available);
  const running = inflight.get(source);
  if (running) return running;
  const request = readCategories(source)
    .then(rows => { cache.set(source, rows); return rows; })
    .finally(() => inflight.delete(source));
  inflight.set(source, request);
  return request;
}

/** Merchant writes still require the category IDs from the database receiving the listing. */
export const useAllCategories = (source: CategorySource = "directory") => {
  const [categories, setCategories] = useState<CategoryLite[]>(cache.get(source) ?? []);
  const [loading, setLoading] = useState(!cache.has(source));

  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setError(false);
    setLoading(!cache.has(source));
    setCategories(cache.get(source) ?? []);
    fetchAll(source)
      .then((rows) => {
        if (!cancelled) {
          setCategories(rows);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) { setError(true); setLoading(false); }
      });
    return () => {
      cancelled = true;
    };
  }, [attempt, source]);

  return { categories, loading, error, retry: () => setAttempt(value => value + 1) };
};

const norm = (s: string | null | undefined) =>
  (s ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

/** Accent/case-insensitive scoring of categories vs a query. */
export const searchCategories = (
  items: CategoryLite[],
  query: string,
  limit = 8,
): CategoryWithParent[] => {
  const q = norm(query);
  if (!q) return [];
  const byId = new Map(items.map((c) => [c.id, c]));
  const scored: { c: CategoryLite; score: number }[] = [];
  for (const c of items) {
    const name = norm(c.name);
    const slug = norm(c.slug);
    let score = 0;
    if (name === q) score = 100;
    else if (name.startsWith(q)) score = 80;
    else if (name.includes(q)) score = 60;
    else if (slug.includes(q)) score = 40;
    else continue;
    // Prefer top-level (no parent) slightly so parents win over deep leaves.
    if (!c.parent_id) score += 5;
    scored.push({ c, score });
  }
  scored.sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name, "fr"));
  return scored.slice(0, limit).map(({ c }) => ({
    ...c,
    parent_name: c.parent_id ? byId.get(c.parent_id)?.name ?? null : null,
  }));
};
