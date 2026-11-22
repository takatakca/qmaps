import type { BusinessCardSource } from "@/lib/business";

type CategoryLink = { categories: { id: string; name: string; slug: string } };
export type DirectoryPlace = BusinessCardSource & {
  latitude: number | null;
  longitude: number | null;
  business_categories: CategoryLink[];
};
type Page<T> = { items: T[]; next: string | null };

async function page<T>(path: string, filters: URLSearchParams, signal?: AbortSignal): Promise<Page<T>> {
  const response = await fetch("/api/v1/browser/directory" + path + "?" + filters, {
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error("L’annuaire QMAPS est indisponible.");
  const value: Page<T> = await response.json();
  if (!Array.isArray(value.items) || !(value.next === null || typeof value.next === "string"))
    throw new Error("Réponse de l’annuaire invalide.");
  return value;
}

export async function directoryPages<T>(path: "" | "/categories", params: URLSearchParams, signal?: AbortSignal): Promise<T[]> {
  const items: T[] = [];
  const seen = new Set<string>();
  const filters = new URLSearchParams(params);
  filters.set("limit", "250");
  for (;;) {
    const result = await page<T>(path, filters, signal);
    items.push(...result.items);
    if (!result.next) return items;
    if (seen.has(result.next)) throw new Error("Pagination invalide.");
    seen.add(result.next);
    filters.set("after", result.next);
  }
}

export async function topPlaces(filters: URLSearchParams, size: number, signal: AbortSignal): Promise<DirectoryPlace[]> {
  const params = new URLSearchParams(filters);
  params.set("limit", String(size));
  params.set("order", "rating");
  return (await page<DirectoryPlace>("", params, signal)).items;
}
