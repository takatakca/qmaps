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
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new QmapsRequestError(
      response.status,
      detail.error || "Le service QMAPS est indisponible.",
    );
  }
  return response.status === 204 ? (undefined as T) : await response.json();
}
