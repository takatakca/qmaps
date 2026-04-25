import { describe, it, expect } from "vitest";
import {
  calculateRecommendationScore,
  rankRecommendations,
  fallbackRecommendationOrder,
  normalizeCity,
  type ScoringBusiness,
} from "@/lib/recommendations";

const biz = (over: Partial<ScoringBusiness> = {}): ScoringBusiness => ({
  id: over.id ?? "b1",
  city: over.city ?? "Montréal",
  avg_rating: over.avg_rating ?? 4.6,
  reviews_count: over.reviews_count ?? 30,
  is_active: over.is_active ?? true,
  category_ids: over.category_ids ?? ["cat1"],
  ...over,
});

describe("recommendations: calculateRecommendationScore", () => {
  it("rewards top-category match", () => {
    const out = calculateRecommendationScore(biz({ category_ids: ["cat1"] }), {
      topCategoryIds: ["cat1"],
    });
    expect(out.reasonCodes).toContain("matches_top_category");
    expect(out.score).toBeGreaterThan(0);
  });

  it("rewards top-city match (accent-insensitive)", () => {
    const out = calculateRecommendationScore(biz({ city: "Montreal" }), {
      topCities: ["MONTRÉAL"],
    });
    expect(out.reasonCodes).toContain("matches_top_city");
  });

  it("flags highly_rated for rating >= 4.5", () => {
    const out = calculateRecommendationScore(biz({ avg_rating: 4.8 }));
    expect(out.reasonCodes).toContain("highly_rated");
  });

  it("penalizes dismissed and inactive businesses", () => {
    const dismissed = calculateRecommendationScore(biz({ id: "b2" }), {
      dismissedBusinessIds: ["b2"],
    });
    const inactive = calculateRecommendationScore(biz({ is_active: false }));
    expect(dismissed.score).toBeLessThan(0);
    expect(inactive.score).toBeLessThan(0);
  });

  it("always returns at least one reason code", () => {
    const out = calculateRecommendationScore(biz({ avg_rating: 0, reviews_count: 0, category_ids: [] }));
    expect(out.reasonCodes.length).toBeGreaterThan(0);
  });
});

describe("recommendations: rankRecommendations", () => {
  it("orders by descending score and respects limit", () => {
    const candidates = [
      biz({ id: "a", avg_rating: 3.0, reviews_count: 0, category_ids: [] }),
      biz({ id: "b", avg_rating: 4.9, reviews_count: 200, category_ids: ["cat1"] }),
      biz({ id: "c", avg_rating: 4.0, reviews_count: 10, category_ids: ["cat1"] }),
    ];
    const ranked = rankRecommendations(candidates, { topCategoryIds: ["cat1"] }, 2);
    expect(ranked).toHaveLength(2);
    expect(ranked[0].business.id).toBe("b");
  });

  it("drops obviously bad scores", () => {
    const ranked = rankRecommendations(
      [biz({ id: "x", is_active: false })],
      { dismissedBusinessIds: ["x"] }
    );
    expect(ranked).toHaveLength(0);
  });
});

describe("recommendations: fallbackRecommendationOrder + normalizeCity", () => {
  it("sorts active businesses by rating then review count", () => {
    const out = fallbackRecommendationOrder([
      biz({ id: "a", avg_rating: 4.0, reviews_count: 100 }),
      biz({ id: "b", avg_rating: 4.5, reviews_count: 5 }),
      biz({ id: "c", avg_rating: 4.5, reviews_count: 50 }),
    ]);
    expect(out.map((b) => b.id)).toEqual(["c", "b", "a"]);
  });

  it("strips accents and lowercases city", () => {
    expect(normalizeCity("Montréal")).toBe("montreal");
    expect(normalizeCity(null)).toBe("");
  });
});

import { applyRecommendationFallback } from "@/lib/recommendations";

describe("recommendations: applyRecommendationFallback (Phase 9D)", () => {
  it("returns primary entries when sufficient", () => {
    const primary = [
      { business: biz({ id: "p1" }), score: 50, reasonCodes: ["highly_rated" as const] },
      { business: biz({ id: "p2" }), score: 40, reasonCodes: ["popular" as const] },
    ];
    const out = applyRecommendationFallback(primary, { limit: 2 });
    expect(out.map((e) => e.business.id)).toEqual(["p1", "p2"]);
  });

  it("falls back to local pool when primary is empty", () => {
    const local = [biz({ id: "l1", avg_rating: 4.9 }), biz({ id: "l2", avg_rating: 4.7 })];
    const out = applyRecommendationFallback([], { localPool: local, limit: 2 });
    expect(out).toHaveLength(2);
    expect(out[0].reasonCodes).toContain("fallback_top_rated");
  });

  it("falls back to global pool when local also empty", () => {
    const global = [biz({ id: "g1", avg_rating: 5.0 })];
    const out = applyRecommendationFallback([], { globalPool: global, limit: 5 });
    expect(out.map((e) => e.business.id)).toEqual(["g1"]);
  });

  it("deduplicates ids across primary, local, and global pools", () => {
    const primary = [{ business: biz({ id: "x1" }), score: 10, reasonCodes: ["popular" as const] }];
    const local = [biz({ id: "x1" }), biz({ id: "x2" })];
    const global = [biz({ id: "x2" }), biz({ id: "x3" })];
    const out = applyRecommendationFallback(primary, { localPool: local, globalPool: global, limit: 5 });
    expect(out.map((e) => e.business.id)).toEqual(["x1", "x2", "x3"]);
  });

  it("respects limit", () => {
    const primary = Array.from({ length: 10 }).map((_, i) => ({
      business: biz({ id: `p${i}` }),
      score: 10 - i,
      reasonCodes: ["popular" as const],
    }));
    const out = applyRecommendationFallback(primary, { limit: 3 });
    expect(out).toHaveLength(3);
  });
});
