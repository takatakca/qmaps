export const DEFAULT_RETURN_ORIGIN = "https://qmaps.ca";

type RequestLike = {
  headers: {
    get(name: string): string | null;
  };
};

function normalizeAllowedOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    const isLocalDevelopment =
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1");
    if (
      (url.protocol !== "https:" && !isLocalDevelopment) ||
      url.username ||
      url.password
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

export function getTrustedReturnOrigin(
  request: RequestLike,
  configuredOrigins: string[] = [],
): string {
  const allowedOrigins = new Set(
    [DEFAULT_RETURN_ORIGIN, ...configuredOrigins]
      .map(normalizeAllowedOrigin)
      .filter((origin): origin is string => origin !== null),
  );

  for (const candidate of [
    request.headers.get("origin"),
    request.headers.get("referer"),
  ]) {
    if (!candidate) continue;
    const origin = normalizeAllowedOrigin(candidate);
    if (origin && allowedOrigins.has(origin)) return origin;
  }

  return DEFAULT_RETURN_ORIGIN;
}
