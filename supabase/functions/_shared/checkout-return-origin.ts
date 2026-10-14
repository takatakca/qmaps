/**
 * Resolve Stripe return URLs only to a trusted QMAPS origin.
 *
 * No request header can add an allowed host. Extra preview/staging hosts
 * must be explicitly configured as a server-side comma-separated allowlist.
 */
export const QMAPS_RETURN_ORIGIN = "https://qmaps.ca";

export function normalizedHttpsOrigin(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (
      url.protocol !== "https:" ||
      !url.hostname ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) return null;
    // Require a bare origin, not a path, a URL with credentials, or
    // a padded/trailing-dot host that could bypass string comparisons.
    return url.origin === trimmed.replace(/\/$/, "") ? url.origin : null;
  } catch {
    return null;
  }
}

export function resolveCheckoutReturnOrigin(
  requestOrigin: string | null,
  extraAllowedOrigins: string | null | undefined,
): string {
  const allowed = new Set([QMAPS_RETURN_ORIGIN, "https://www.qmaps.ca"]);
  for (const entry of (extraAllowedOrigins ?? "").split(",")) {
    const valid = normalizedHttpsOrigin(entry);
    if (valid) allowed.add(valid);
  }
  const supplied = requestOrigin ? normalizedHttpsOrigin(requestOrigin) : null;
  return supplied && allowed.has(supplied) ? supplied : QMAPS_RETURN_ORIGIN;
}
