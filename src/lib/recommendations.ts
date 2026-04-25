/**
 * Phase 9C — Recommendation scoring helpers.
 *
 * Pure, deterministic, dependency-free. Safe to import in any component or
 * hook. AI assistance can layer on top later, but the rules below always
 * produce a result even with zero user data.
 */

export type RecommendationEventType =
  | "business_view"
  | "search_click"
  | "category_view"
  | "city_view"
  | "bookmark_add"
  | "bookmark_remove"
  | "review_create"
  | "photo_view"
  | "sponsored_click"
  | "directions_click"
  | "phone_click"
  | "website_click"
  | "recommendation_impression"
  | "recommendation_click"
  | "recommendation_dismiss";

export type RecommendationReasonCode =
  | "matches_top_category"
  | "matches_top_city"
  | "matches_recent_view"
  | "highly_rated"
  | "popular"
  | "fresh_activity"
  | "near_you"
  | "new_to_you"
  | "trending_in_city"
  | "fallback_top_rated";

export const EVENT_WEIGHTS: Record<RecommendationEventType, number> = {
  business_view: 1,
  search_click: 1.5,
  category_view: 0.5,
  city_view: 0.4,
  bookmark_add: 4,
  bookmark_remove: -2,
  review_create: 5,
  photo_view: 0.6,
  sponsored_click: 0.8,
  directions_click: 3,
  phone_click: 3,
  website_click: 2.5,
  recommendation_impression: 0.05,
  recommendation_click: 1.2,
  recommendation_dismiss: -1.5,
};

export const REASON_LABELS: Record<RecommendationReasonCode, string> = {
  matches_top_category: "Dans une catégorie que vous aimez",
  matches_top_city: "Dans votre ville préférée",
  matches_recent_view: "Lié à un commerce récemment consulté",
  highly_rated: "Très bien noté",
  popular: "Populaire",
  fresh_activity: "Activité récente",
  near_you: "À proximité",
  new_to_you: "Nouveau pour vous",
  trending_in_city: "Tendance dans votre ville",
  fallback_top_rated: "Recommandé par la communauté",
};

export const formatRecommendationReason = (code: RecommendationReasonCode): string =>
  REASON_LABELS[code] ?? "Recommandé";

export const formatRecommendationReasons = (codes: RecommendationReasonCode[]): string => {
  if (!codes || codes.length === 0) return formatRecommendationReason("fallback_top_rated");
  const unique = Array.from(new Set(codes));
  return unique.slice(0, 2).map(formatRecommendationReason).join(" · ");
};

/** Lowercase + strip accents for fuzzy city matching. */
export const normalizeCity = (city?: string | null): string => {
  if (!city) return "";
  return city
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

export interface ScoringBusiness {
  id: string;
  city?: string | null;
  avg_rating?: number | null;
  reviews_count?: number | null;
  price_level?: number | null;
  is_active?: boolean | null;
  created_at?: string | null;
  category_ids?: string[];
}

export interface ScoringContext {
  topCategoryIds?: string[];
  topCities?: string[];
  recentBusinessIds?: string[];
  bookmarkedBusinessIds?: string[];
  dismissedBusinessIds?: string[];
  shownBusinessIds?: string[];
  pricePreference?: number | null;
  avgRatingPreference?: number | null;
}

export interface RecommendationScoreResult {
  score: number;
  reasonCodes: RecommendationReasonCode[];
}

const inSet = (id: string | undefined | null, set?: string[]): boolean =>
  !!id && Array.isArray(set) && set.includes(id);

/**
 * Deterministic scoring. Range roughly 0–100 but no hard cap is enforced; only
 * the ordering matters. Returns reason codes used for explainable UI labels.
 */
export const calculateRecommendationScore = (
  business: ScoringBusiness,
  ctx: ScoringContext = {}
): RecommendationScoreResult => {
  const reasons: RecommendationReasonCode[] = [];
  let score = 0;

  // Hard exclusions still produce a (very low) score so callers can rank.
  if (business.is_active === false) score -= 50;
  if (inSet(business.id, ctx.dismissedBusinessIds)) score -= 40;
  if (inSet(business.id, ctx.bookmarkedBusinessIds)) score -= 8; // already saved

  // Category match
  const cats = business.category_ids ?? [];
  if (ctx.topCategoryIds?.some((c) => cats.includes(c))) {
    score += 25;
    reasons.push("matches_top_category");
  }

  // City match (normalized)
  const bizCity = normalizeCity(business.city);
  const cityHit = (ctx.topCities ?? []).some((c) => normalizeCity(c) === bizCity);
  if (cityHit && bizCity) {
    score += 18;
    reasons.push("matches_top_city");
  }

  // Recent activity proximity (boost businesses similar to recently viewed)
  if (inSet(business.id, ctx.recentBusinessIds)) {
    score += 6;
    reasons.push("matches_recent_view");
  }

  // Quality signals
  const rating = Number(business.avg_rating ?? 0);
  if (rating >= 4.5) {
    score += 14;
    reasons.push("highly_rated");
  } else if (rating >= 4.0) {
    score += 8;
  } else if (rating > 0 && rating < 3) {
    score -= 6;
  }

  const reviewCount = Number(business.reviews_count ?? 0);
  if (reviewCount >= 100) {
    score += 10;
    reasons.push("popular");
  } else if (reviewCount >= 25) {
    score += 5;
  } else if (reviewCount >= 5) {
    score += 2;
  }

  // Price preference (soft)
  if (
    typeof ctx.pricePreference === "number" &&
    typeof business.price_level === "number"
  ) {
    const diff = Math.abs(ctx.pricePreference - business.price_level);
    if (diff === 0) score += 3;
    else if (diff === 1) score += 1;
    else score -= 1;
  }

  // Freshness — businesses created in last 60 days get a small nudge
  if (business.created_at) {
    const ageDays =
      (Date.now() - new Date(business.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays < 60) {
      score += 2;
      reasons.push("fresh_activity");
    }
  }

  // Already shown a lot — soft penalty
  if (inSet(business.id, ctx.shownBusinessIds)) score -= 3;

  // No reasons at all? Mark fallback so UI never shows an empty pill.
  if (reasons.length === 0) reasons.push("fallback_top_rated");

  return { score, reasonCodes: reasons };
};

/**
 * Safe fallback ranker. Used when there is no user history at all.
 * Sort by rating then review count. Pure function, no side effects.
 */
export const fallbackRecommendationOrder = <T extends ScoringBusiness>(
  businesses: T[]
): T[] =>
  [...(businesses ?? [])]
    .filter((b) => b.is_active !== false)
    .sort((a, b) => {
      const ra = Number(a.avg_rating ?? 0);
      const rb = Number(b.avg_rating ?? 0);
      if (rb !== ra) return rb - ra;
      const ca = Number(a.reviews_count ?? 0);
      const cb = Number(b.reviews_count ?? 0);
      return cb - ca;
    });

/**
 * Convenience: build an explainable list of recommendations from a candidate
 * set. Returns at most `limit` items, each with score + reason codes.
 */
export const rankRecommendations = <T extends ScoringBusiness>(
  candidates: T[],
  ctx: ScoringContext = {},
  limit = 10
): Array<{ business: T; score: number; reasonCodes: RecommendationReasonCode[] }> => {
  const scored = (candidates ?? [])
    .filter((b) => b && b.id)
    .map((business) => {
      const { score, reasonCodes } = calculateRecommendationScore(business, ctx);
      return { business, score, reasonCodes };
    })
    .filter((entry) => entry.score > -20); // drop obviously bad
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
};

/**
 * Phase 9D — Fallback chain helper.
 *
 * Given a primary list (already-scored recommendations) and optional pools of
 * local + global businesses, return at least `limit` items by walking the
 * fallback chain: primary → local top-rated → global top-rated. Pure function,
 * no side effects, never throws. Items are deduplicated by id.
 */
export const applyRecommendationFallback = <T extends ScoringBusiness>(
  primary: Array<{ business: T; score: number; reasonCodes: RecommendationReasonCode[] }>,
  options: {
    localPool?: T[];
    globalPool?: T[];
    limit?: number;
  } = {}
): Array<{ business: T; score: number; reasonCodes: RecommendationReasonCode[] }> => {
  const limit = options.limit ?? 8;
  const seen = new Set<string>();
  const out: Array<{ business: T; score: number; reasonCodes: RecommendationReasonCode[] }> = [];

  for (const entry of primary ?? []) {
    if (!entry?.business?.id || seen.has(entry.business.id)) continue;
    seen.add(entry.business.id);
    out.push(entry);
    if (out.length >= limit) return out;
  }

  if (out.length < limit && options.localPool?.length) {
    for (const b of fallbackRecommendationOrder(options.localPool)) {
      if (!b?.id || seen.has(b.id)) continue;
      seen.add(b.id);
      out.push({ business: b, score: 0, reasonCodes: ["fallback_top_rated"] });
      if (out.length >= limit) return out;
    }
  }

  if (out.length < limit && options.globalPool?.length) {
    for (const b of fallbackRecommendationOrder(options.globalPool)) {
      if (!b?.id || seen.has(b.id)) continue;
      seen.add(b.id);
      out.push({ business: b, score: 0, reasonCodes: ["fallback_top_rated"] });
      if (out.length >= limit) return out;
    }
  }

  return out;
};
