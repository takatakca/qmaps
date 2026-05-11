import { describe, it, expect } from "vitest";
import {
  buildPageTitle,
  truncateMetaDescription,
  buildBusinessSeo,
  buildCanonicalUrl,
  getSeoImage,
  DEFAULT_OG_FALLBACK,
  APP_NAME,
} from "@/lib/seo";

describe("seo helpers", () => {
  it("builds page title with app name", () => {
    expect(buildPageTitle("Pizza")).toBe(`Pizza | ${APP_NAME}`);
    expect(buildPageTitle(`Already ${APP_NAME}`)).toBe(`Already ${APP_NAME}`);
    expect(buildPageTitle("")).toBe(APP_NAME);
  });

  it("truncates description", () => {
    const long = "a".repeat(300);
    const out = truncateMetaDescription(long, 160);
    expect(out.length).toBeLessThanOrEqual(160);
    expect(out.endsWith("…")).toBe(true);
  });

  it("returns canonical URLs", () => {
    expect(buildCanonicalUrl("/search")).toMatch(/\/search$/);
    expect(buildCanonicalUrl("https://x.test/y")).toBe("https://x.test/y");
    expect(buildCanonicalUrl("foo")).toMatch(/\/foo$/);
  });

  it("falls back when business missing", () => {
    expect(getSeoImage(null)).toBe(DEFAULT_OG_FALLBACK);
    const seo = buildBusinessSeo(null);
    expect(seo.title).toContain(APP_NAME);
    expect(seo.image).toBe(DEFAULT_OG_FALLBACK);
  });

  it("builds business SEO with name+city+rating", () => {
    const seo = buildBusinessSeo({
      name: "Café Lulu",
      city: "Montréal",
      avg_rating: 4.5,
      reviews_count: 12,
      photos: ["https://x.test/img.jpg"],
    });
    expect(seo.title).toContain("Café Lulu");
    expect(seo.title).toContain("Montréal");
    expect(seo.image).toBe("https://x.test/img.jpg");
  });
});
