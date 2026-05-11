// Slug helpers shared across SEO/public pages.

export const slugify = (input: string): string =>
  input
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const titleCase = (input: string): string =>
  input
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export const cityFromSlug = (slug: string): string => titleCase(slug.replace(/-/g, " "));

// ---- Phase 15I SEO helpers ---------------------------------------------------
export const APP_NAME = "QMAPS";
export const SITE_ORIGIN = "https://qmaps.lovable.app";
export const DEFAULT_LOCALE = "fr_CA";
export const DEFAULT_OG_FALLBACK =
  "https://qmaps.lovable.app/icons/icon-512.svg";

export function buildPageTitle(title: string, appName: string = APP_NAME): string {
  const t = (title ?? "").trim();
  if (!t) return appName;
  if (t.toLowerCase().includes(appName.toLowerCase())) return t;
  return `${t} | ${appName}`;
}

export function truncateMetaDescription(text: string, maxLength = 160): string {
  const s = (text ?? "").replace(/\s+/g, " ").trim();
  if (s.length <= maxLength) return s;
  return s.slice(0, Math.max(0, maxLength - 1)).trimEnd() + "…";
}

export function buildCanonicalUrl(path: string, origin: string = SITE_ORIGIN): string {
  if (!path) return origin;
  if (/^https?:\/\//i.test(path)) return path;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${origin.replace(/\/+$/, "")}${clean}`;
}

export interface SeoBusinessLike {
  id?: string;
  name?: string | null;
  city?: string | null;
  description?: string | null;
  category?: string | null;
  avg_rating?: number | null;
  reviews_count?: number | null;
  photos?: string[] | null;
  image_url?: string | null;
}

export function getSeoImage(business: SeoBusinessLike | null | undefined): string {
  if (!business) return DEFAULT_OG_FALLBACK;
  const first = Array.isArray(business.photos) ? business.photos.find((p) => !!p) : null;
  return first || business.image_url || DEFAULT_OG_FALLBACK;
}

export interface BusinessSeoResult {
  title: string;
  description: string;
  image: string;
}

export function buildBusinessSeo(business: SeoBusinessLike | null | undefined): BusinessSeoResult {
  if (!business || !business.name) {
    return {
      title: buildPageTitle("Découvrir des commerces locaux"),
      description: truncateMetaDescription(
        "Découvrez les meilleurs restaurants, services et commerces locaux près de chez vous sur QMAPS.",
      ),
      image: DEFAULT_OG_FALLBACK,
    };
  }
  const city = (business.city ?? "").trim();
  const titleBase = city ? `${business.name} — ${city}` : business.name;
  const ratingFrag =
    business.avg_rating && business.reviews_count
      ? ` · ${Number(business.avg_rating).toFixed(1)}/5 (${business.reviews_count} avis)`
      : "";
  const catFrag = business.category ? `${business.category} · ` : "";
  const cityFrag = city ? `à ${city}` : "";
  const descSource =
    business.description?.trim() ||
    `${catFrag}${business.name} ${cityFrag}${ratingFrag}`.trim();
  return {
    title: buildPageTitle(titleBase),
    description: truncateMetaDescription(descSource),
    image: getSeoImage(business),
  };
}
