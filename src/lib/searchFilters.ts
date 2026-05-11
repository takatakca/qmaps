/**
 * Phase 15B/15C — pure helpers for QMAPS search/discovery.
 *
 * No React, no fetch, no Supabase. Safe to unit-test and reuse from
 * the consumer search page, category pages, and admin tooling.
 */

import { isOpenAtWithSpecialHours, parseSpecialHours, parseWeeklyHours } from "@/lib/businessHours";

export type SortOption =
  | "recommended"
  | "rating"
  | "reviews"
  | "newest"
  | "distance";

export const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "recommended", label: "Recommandés" },
  { id: "rating", label: "Mieux notés" },
  { id: "reviews", label: "Plus d'avis" },
  { id: "newest", label: "Nouveautés" },
  { id: "distance", label: "Distance" },
];

export interface SearchableBusiness {
  id: string;
  name?: string | null;
  avg_rating?: number | null;
  reviews_count?: number | null;
  price_level?: number | null;
  is_open?: boolean | null;
  hours?: string | null;
  hours_json?: unknown;
  special_hours?: unknown;
  amenities?: string[] | null;
  city?: string | null;
  created_at?: string | null;
  distance_meters?: number | null;
  is_sponsored?: boolean | null;
  is_claimed?: boolean | null;
}

export interface SearchFilters {
  openNow?: boolean;
  minRating?: number | null;
  priceLevels?: number[];
  city?: string | null;
  amenities?: string[];
  sponsoredOnly?: boolean;
  query?: string | null;
}

/** Lowercase + remove diacritics so "Café" matches "cafe". */
export const normalizeSearchText = (value: string | null | undefined): string =>
  (value ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const matchesPriceFilter = (
  business: SearchableBusiness,
  priceLevels: number[] | undefined,
): boolean => {
  if (!priceLevels || priceLevels.length === 0) return true;
  if (business.price_level == null) return false;
  return priceLevels.includes(business.price_level);
};

export const matchesRatingFilter = (
  business: SearchableBusiness,
  minRating: number | null | undefined,
): boolean => {
  if (minRating == null) return true;
  return (business.avg_rating ?? 0) >= minRating;
};

export const matchesAmenityFilter = (
  business: SearchableBusiness,
  required: string[] | undefined,
): boolean => {
  if (!required || required.length === 0) return true;
  const have = (business.amenities ?? []).map(normalizeSearchText);
  return required.every((a) => have.includes(normalizeSearchText(a)));
};

/**
 * Returns true if the business is currently open. Prefers structured
 * `hours_json`, falls back to obvious "fermé"/"closed" markers in the
 * legacy text field, then to the boolean `is_open` flag.
 */
export const isBusinessOpenNow = (
  business: SearchableBusiness,
  now: Date = new Date(),
): boolean => {
  const week = parseWeeklyHours(business.hours_json);
  const special = parseSpecialHours(business.special_hours);
  if (week || special) return isOpenAtWithSpecialHours(week, special, now);
  const hours = (business.hours ?? "").toLowerCase();
  if (hours.includes("fermé") || hours.includes("closed")) return false;
  if (typeof business.is_open === "boolean") return business.is_open;
  return false;
};

export const filterBusinesses = <T extends SearchableBusiness>(
  businesses: T[],
  filters: SearchFilters,
  now: Date = new Date(),
): T[] => {
  const q = normalizeSearchText(filters.query);
  const city = normalizeSearchText(filters.city);
  return businesses.filter((b) => {
    if (q && !normalizeSearchText(b.name).includes(q)) return false;
    if (city && normalizeSearchText(b.city) !== city) return false;
    if (filters.sponsoredOnly && !b.is_sponsored) return false;
    if (filters.openNow && !isBusinessOpenNow(b, now)) return false;
    if (!matchesPriceFilter(b, filters.priceLevels)) return false;
    if (!matchesRatingFilter(b, filters.minRating)) return false;
    if (!matchesAmenityFilter(b, filters.amenities)) return false;
    return true;
  });
};

const ts = (v?: string | null): number => (v ? new Date(v).getTime() : 0);

export const sortBusinesses = <T extends SearchableBusiness>(
  businesses: T[],
  sort: SortOption,
): T[] => {
  const copy = [...businesses];
  switch (sort) {
    case "rating":
      return copy.sort(
        (a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0),
      );
    case "reviews":
      return copy.sort(
        (a, b) => (b.reviews_count ?? 0) - (a.reviews_count ?? 0),
      );
    case "newest":
      return copy.sort((a, b) => ts(b.created_at) - ts(a.created_at));
    case "distance":
      return copy.sort(
        (a, b) =>
          (a.distance_meters ?? Number.POSITIVE_INFINITY) -
          (b.distance_meters ?? Number.POSITIVE_INFINITY),
      );
    case "recommended":
    default:
      // Sponsored first, then weighted score combining rating + review volume.
      return copy.sort((a, b) => {
        const sa = a.is_sponsored ? 1 : 0;
        const sb = b.is_sponsored ? 1 : 0;
        if (sa !== sb) return sb - sa;
        const score = (x: SearchableBusiness) =>
          (x.avg_rating ?? 0) * Math.log10((x.reviews_count ?? 0) + 10);
        return score(b) - score(a);
      });
  }
};
