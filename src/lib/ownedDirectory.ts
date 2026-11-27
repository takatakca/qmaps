import type { BusinessCardSource } from "@/lib/business";

type CategoryLink = { categories: { id: string; name: string; slug: string } };
export type DirectoryPlace = BusinessCardSource & {
  latitude: number | null;
  longitude: number | null;
  business_categories: CategoryLink[];
};
type Page<T> = { items: T[]; next: string | null };
type DirectoryCredentials = "same-origin" | "omit";
class DirectorySessionRejected extends Error {}

async function rejectedSession(response: Response): Promise<boolean> {
  if (response.status !== 401 || response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json")
    return false;
  try {
    const body = await response.json();
    return body?.error === "Session invalide" || body?.error === "Session expirée";
  } catch {
    return false;
  }
}

async function readWithBrowserSession<T>(
  signal: AbortSignal | undefined,
  read: (credentials: DirectoryCredentials) => Promise<T>,
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
  path: "" | "/categories",
  filters: URLSearchParams,
  credentials: DirectoryCredentials,
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
        await rejectedSession(response)) {
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
