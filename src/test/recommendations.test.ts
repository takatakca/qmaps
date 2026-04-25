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
