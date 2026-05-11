/**
 * Phase 15D — pure helpers for QMAPS business menu items.
 * No React, no Supabase. Safe to unit-test and reuse anywhere.
 */

export interface MenuItem {
  id: string;
  business_id: string;
  name: string;
  description?: string | null;
  price_cents?: number | null;
  currency?: string | null;
  category?: string | null;
  photo_url?: string | null;
  is_available?: boolean | null;
  sort_order?: number | null;
  created_at?: string | null;
}

export const DEFAULT_CATEGORY_LABEL = "Autres";

export const normalizeMenuCategory = (category: string | null | undefined): string => {
  const trimmed = (category ?? "").trim();
  return trimmed.length === 0 ? DEFAULT_CATEGORY_LABEL : trimmed;
};

export const formatPriceCents = (
  priceCents: number | null | undefined,
  currency: string | null | undefined = "CAD",
): string => {
  if (priceCents == null || !Number.isFinite(priceCents)) return "";
  const cur = (currency ?? "CAD").toUpperCase();
  try {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: cur,
    }).format(priceCents / 100);
  } catch {
    return `${(priceCents / 100).toFixed(2)} ${cur}`;
  }
};

export const sortMenuItems = <T extends MenuItem>(items: T[]): T[] =>
  [...items].sort((a, b) => {
    const ca = normalizeMenuCategory(a.category);
    const cb = normalizeMenuCategory(b.category);
    if (ca !== cb) return ca.localeCompare(cb, "fr");
    const sa = a.sort_order ?? 0;
    const sb = b.sort_order ?? 0;
    if (sa !== sb) return sa - sb;
    return (a.name ?? "").localeCompare(b.name ?? "", "fr");
  });

export const filterAvailableMenuItems = <T extends MenuItem>(items: T[]): T[] =>
  items.filter((i) => i.is_available !== false);

export const groupMenuItemsByCategory = <T extends MenuItem>(
  items: T[],
): Array<{ category: string; items: T[] }> => {
  const sorted = sortMenuItems(items);
  const map = new Map<string, T[]>();
  for (const item of sorted) {
    const key = normalizeMenuCategory(item.category);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
};
