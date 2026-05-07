import { describe, expect, it } from "vitest";
import {
  filterBusinesses,
  isBusinessOpenNow,
  matchesAmenityFilter,
  matchesPriceFilter,
  matchesRatingFilter,
  normalizeSearchText,
  sortBusinesses,
  type SearchableBusiness,
} from "@/lib/searchFilters";

const make = (overrides: Partial<SearchableBusiness> = {}): SearchableBusiness => ({
  id: overrides.id ?? "b",
  name: "Café Test",
  avg_rating: 4,
  reviews_count: 10,
  price_level: 2,
  is_open: true,
  hours: null,
  amenities: ["Wifi", "Terrasse"],
  city: "Montréal",
  created_at: "2026-01-01T00:00:00.000Z",
  distance_meters: 500,
  is_sponsored: false,
  ...overrides,
});

describe("normalizeSearchText", () => {
  it("strips diacritics and lowercases", () => {
    expect(normalizeSearchText("Café Crème")).toBe("cafe creme");
  });
  it("handles null/undefined", () => {
    expect(normalizeSearchText(null)).toBe("");
    expect(normalizeSearchText(undefined)).toBe("");
  });
});

describe("matchesPriceFilter", () => {
  it("passes when no filter set", () => {
    expect(matchesPriceFilter(make(), undefined)).toBe(true);
    expect(matchesPriceFilter(make(), [])).toBe(true);
  });
  it("matches included price level", () => {
    expect(matchesPriceFilter(make({ price_level: 2 }), [2, 3])).toBe(true);
    expect(matchesPriceFilter(make({ price_level: 1 }), [2, 3])).toBe(false);
  });
  it("rejects null price when filter active", () => {
    expect(matchesPriceFilter(make({ price_level: null }), [1])).toBe(false);
  });
});

describe("matchesRatingFilter", () => {
  it("passes when minRating null", () => {
    expect(matchesRatingFilter(make({ avg_rating: 2 }), null)).toBe(true);
  });
  it("checks threshold", () => {
    expect(matchesRatingFilter(make({ avg_rating: 4.2 }), 4)).toBe(true);
    expect(matchesRatingFilter(make({ avg_rating: 3.9 }), 4)).toBe(false);
  });
});

describe("matchesAmenityFilter", () => {
  it("passes when no amenities required", () => {
    expect(matchesAmenityFilter(make(), [])).toBe(true);
  });
  it("requires all amenities, accent-insensitive", () => {
    expect(matchesAmenityFilter(make(), ["wifi", "TERRASSE"])).toBe(true);
    expect(matchesAmenityFilter(make(), ["Wifi", "Stationnement"])).toBe(false);
  });
});

describe("isBusinessOpenNow", () => {
  it("falls back to is_open boolean", () => {
    expect(isBusinessOpenNow(make({ is_open: true, hours: null }))).toBe(true);
    expect(isBusinessOpenNow(make({ is_open: false, hours: null }))).toBe(false);
  });
  it("respects explicit closed text", () => {
    expect(isBusinessOpenNow(make({ is_open: true, hours: "Fermé aujourd'hui" }))).toBe(false);
  });
});

describe("filterBusinesses", () => {
  const list = [
    make({ id: "a", name: "Pho Hanoi", price_level: 1, avg_rating: 4.6, city: "Montréal" }),
    make({ id: "b", name: "Sushi Place", price_level: 3, avg_rating: 4.1, city: "Laval" }),
    make({ id: "c", name: "Café", price_level: 2, avg_rating: 3.2, city: "Montréal", is_open: false }),
  ];
  it("filters by query, city, rating", () => {
    const r = filterBusinesses(list, { query: "cafe", city: "Montréal", minRating: 3 });
    expect(r.map((b) => b.id)).toEqual(["c"]);
  });
  it("filters by openNow", () => {
    const r = filterBusinesses(list, { openNow: true });
    expect(r.map((b) => b.id)).toEqual(["a", "b"]);
  });
});

describe("sortBusinesses", () => {
  const list = [
    make({ id: "a", avg_rating: 4.0, reviews_count: 100, created_at: "2026-01-01", distance_meters: 800 }),
    make({ id: "b", avg_rating: 4.8, reviews_count: 5, created_at: "2026-04-01", distance_meters: 300 }),
    make({ id: "c", avg_rating: 4.2, reviews_count: 50, created_at: "2026-02-01", distance_meters: 1500, is_sponsored: true }),
  ];
  it("sorts by rating", () => {
    expect(sortBusinesses(list, "rating").map((b) => b.id)).toEqual(["b", "c", "a"]);
  });
  it("sorts by reviews", () => {
    expect(sortBusinesses(list, "reviews").map((b) => b.id)).toEqual(["a", "c", "b"]);
  });
  it("sorts by newest", () => {
    expect(sortBusinesses(list, "newest").map((b) => b.id)).toEqual(["b", "c", "a"]);
  });
  it("sorts by distance", () => {
    expect(sortBusinesses(list, "distance").map((b) => b.id)).toEqual(["b", "a", "c"]);
  });
  it("recommended puts sponsored first", () => {
    expect(sortBusinesses(list, "recommended")[0].id).toBe("c");
  });
});
