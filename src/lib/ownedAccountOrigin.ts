import { SITE_ORIGIN } from "@/lib/seo";

// Keep the owned browser session on a host supported by the API.
export function ownedAccountRedirect(
  origin: string,
  { pathname, search, hash }: Pick<Location, "pathname" | "search" | "hash">,
): string | null {
  if (origin !== "https://qmaps.takatak.ca") return null;

  const target = new URL(SITE_ORIGIN);
  target.pathname = pathname;
  target.search = search;
  target.hash = hash;
  return target.href;
}
