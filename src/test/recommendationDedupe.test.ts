import { describe, it, expect, beforeEach } from "vitest";
import {
  buildRecommendationDedupeKey,
  __resetRecommendationDedupeForTests,
} from "@/hooks/useRecommendationEvents";

describe("buildRecommendationDedupeKey (Phase 9E)", () => {
  beforeEach(() => __resetRecommendationDedupeForTests());

  it("dedupes business_view by business id", () => {
    expect(
      buildRecommendationDedupeKey({ event_type: "business_view", business_id: "b1" })
    ).toBe("view:b1");
  });

  it("dedupes city_view by normalized city", () => {
    expect(
      buildRecommendationDedupeKey({ event_type: "city_view", business_id: "b1", city: "Montréal" })
    ).toBe("city:montreal");
  });

  it("returns null for city_view without a city", () => {
    expect(
      buildRecommendationDedupeKey({ event_type: "city_view", business_id: "b1" })
    ).toBeNull();
  });

  it("dedupes category_view by category + city", () => {
    expect(
      buildRecommendationDedupeKey({
        event_type: "category_view",
        business_id: "b1",
        category_id: "cat-7",
        city: "Québec",
      })
    ).toBe("cat:cat-7:quebec");
  });

  it("returns null for category_view without category_id", () => {
    expect(
      buildRecommendationDedupeKey({ event_type: "category_view", business_id: "b1" })
    ).toBeNull();
  });

  it("does not dedupe action events", () => {
    for (const t of ["search_click", "recommendation_click", "bookmark_add", "bookmark_remove"] as const) {
      expect(
        buildRecommendationDedupeKey({ event_type: t, business_id: "b1" })
      ).toBeNull();
    }
  });
});
