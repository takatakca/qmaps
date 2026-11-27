import type { BusinessCardSource } from "@/lib/business";
import { isRejectedBrowserSession, type BrowserReadCredentials } from "@/lib/browserSession";
import type { Coordinates } from "@/lib/geo";

type CategoryLink = { categories: { id: string; name: string; slug: string } };
export type DirectoryPlace = BusinessCardSource & {
  latitude: number | null;
  longitude: number | null;
  business_categories: CategoryLink[];
};
type NearbyPlace = DirectoryPlace & { distance_meters: number };
type Page<T> = { items: T[]; next: string | null };
class DirectorySessionRejected extends Error {}

async function readWithBrowserSession<T>(
  signal: AbortSignal | undefined,
  read: (credentials: BrowserReadCredentials) => Promise<T>,
): Promise<T> {
  try {
    return await read("same-origin");
  } catch (error) {
    if (!(error instanceof DirectorySessionRejected) || signal?.aborted) throw error;
    // Restart the whole read so pages filtered by a session never mix with guest pages.
    return read("omit");
  }
}

async function page<T>(
  path: "" | "/categories" | "/nearby",
  filters: URLSearchParams,
  credentials: BrowserReadCredentials,
  signal?: AbortSignal,
): Promise<Page<T>> {
  const response = await fetch("/api/v1/browser/directory" + path + "?" + filters, {
    credentials,
    cache: "no-store",
    signal,
  });
  if (!response.ok) {
    const message = "L’annuaire QMAPS est indisponible.";
    if (credentials === "same-origin" && filters.getAll("account").every(account => account === "") &&
        await isRejectedBrowserSession(response)) {
      throw new DirectorySessionRejected(message);
    }
    throw new Error(message);
  }
  const value: Page<T> = await response.json();
  if (!Array.isArray(value.items) || !(value.next === null || typeof value.next === "string"))
    throw new Error("Réponse de l’annuaire invalide.");
  return value;
}

export async function directoryPages<T>(path: "" | "/categories", params: URLSearchParams, signal?: AbortSignal): Promise<T[]> {
  const initialFilters = new URLSearchParams(params);
  initialFilters.set("limit", "250");
  return readWithBrowserSession(signal, async credentials => {
    const items: T[] = [];
    const seen = new Set<string>();
    const filters = new URLSearchParams(initialFilters);
    for (;;) {
      const result = await page<T>(path, filters, credentials, signal);
      items.push(...result.items);
      if (!result.next) return items;
      if (seen.has(result.next)) throw new Error("Pagination invalide.");
      seen.add(result.next);
      filters.set("after", result.next);
    }
  });
}

export async function topPlaces(filters: URLSearchParams, size: number, signal: AbortSignal): Promise<DirectoryPlace[]> {
  const params = new URLSearchParams(filters);
  params.set("limit", String(size));
  params.set("order", "rating");
  return readWithBrowserSession(signal, async credentials => (await page<DirectoryPlace>("", params, credentials, signal)).items);
}

export async function nearbyPlaces(position: Coordinates, size: number, signal: AbortSignal): Promise<NearbyPlace[]> {
  const params = new URLSearchParams({
    // A 10 km discovery search does not need exact device coordinates.
    lat: position.latitude.toFixed(3),
    lng: position.longitude.toFixed(3),
    limit: String(size),
  });
  return readWithBrowserSession(signal, async credentials => {
    const result = await page<NearbyPlace>("/nearby", params, credentials, signal);
    if (result.next !== null || result.items.length > size ||
        result.items.some(item => !Number.isFinite(item?.distance_meters) || item.distance_meters < 0))
      throw new Error("Réponse de proximité invalide.");
    return result.items;
  });
}
