import { isRejectedBrowserSession, type BrowserReadCredentials } from "@/lib/browserSession";

export class QmapsRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
export type QmapsUser = { id: string; handle: string; roles: string[] };
export type QmapsPlace = {
  id: string;
  name: string;
  city: string;
  address?: string;
  description?: string;
};
export async function ownedApi<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch("/api/v1/browser/" + path, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers:
      body instanceof Blob || body === undefined
        ? {}
        : { "Content-Type": "application/json" },
    body:
      body instanceof Blob
        ? body
        : body === undefined
          ? undefined
          : JSON.stringify(body),
  });
  return parseOwnedResponse<T>(response);
}

async function parseOwnedResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new QmapsRequestError(
      response.status,
      detail?.error || "Le service QMAPS est indisponible.",
    );
  }
  return response.status === 204 ? (undefined as T) : await response.json();
}
function readPublicPlace(path: string, credentials: BrowserReadCredentials, signal: AbortSignal) {
  return fetch("/api/v1/browser/places/" + path, { method: "GET", credentials, cache: "no-store", signal });
}

export async function loadPublicPlace(id: string, signal: AbortSignal): Promise<{
  place: QmapsPlace;
  credentials: BrowserReadCredentials;
}> {
  const path = encodeURIComponent(id);
  const first = await readPublicPlace(path, "same-origin", signal);
  if (await isRejectedBrowserSession(first) && !signal.aborted) {
    return { place: await parseOwnedResponse(await readPublicPlace(path, "omit", signal)), credentials: "omit" };
  }
  return { place: await parseOwnedResponse(first), credentials: "same-origin" };
}

export async function loadPublicPlaceSection<T>(
  id: string,
  section: "photos" | "reviews",
  credentials: BrowserReadCredentials,
  signal: AbortSignal,
  offset?: number,
): Promise<T> {
  // Keep every page in the same viewer scope as the successfully loaded detail.
  const path = encodeURIComponent(id) + "/" + section + (section === "photos" && offset !== undefined ? "?offset=" + offset : "");
  return parseOwnedResponse<T>(await readPublicPlace(path, credentials, signal));
}
