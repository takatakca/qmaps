import { describe, expect, it } from "vitest";
import {
  buildSitemapEntries,
  buildSitemapFiles,
  buildUrlSet,
  CITY_MINIMUM_LISTINGS,
  escapeXml,
  SITEMAP_URL_LIMIT,
} from "../../scripts/generate-sitemap.mjs";

describe("build-time sitemap generation", () => {
  it("escapes XML values", () => {
    expect(escapeXml(`A & <B> "C" 'D'`)).toBe("A &amp; &lt;B&gt; &quot;C&quot; &apos;D&apos;");
  });

  it("includes active business pages and cities with enough real inventory", () => {
    const businesses = [
      { id: "one", city: "Montréal", updated_at: "2026-10-01T12:00:00Z" },
      { id: "two", city: "Montréal", updated_at: "2026-10-03T12:00:00Z" },
      { id: "three", city: "Montréal", updated_at: "2026-10-02T12:00:00Z" },
      { id: "four", city: "Laval", updated_at: "2026-10-04T12:00:00Z" },
    ];

    const entries = buildSitemapEntries(businesses);
    const urls = entries.map((entry) => entry.loc);

    expect(urls).toContain("https://qmaps.ca/business/one");
    expect(urls).toContain("https://qmaps.ca/city/montreal");
    expect(urls).not.toContain("https://qmaps.ca/city/laval");
    expect(entries.find((entry) => entry.loc.endsWith("/city/montreal"))?.lastmod).toBe(
      "2026-10-03T12:00:00Z",
    );
    expect(CITY_MINIMUM_LISTINGS).toBe(3);
  });

  it("includes lastmod only when it is a valid date", () => {
    const xml = buildUrlSet([
      { loc: "https://qmaps.ca/business/valid", lastmod: "2026-10-01T12:00:00Z" },
      { loc: "https://qmaps.ca/business/invalid", lastmod: "not-a-date" },
    ]);

    expect(xml.match(/<lastmod>/g)).toHaveLength(1);
    expect(xml).toContain("2026-10-01T12:00:00.000Z");
  });

  it("splits large inventories into a sitemap index", () => {
    const entries = Array.from({ length: SITEMAP_URL_LIMIT + 1 }, (_, index) => ({
      loc: `https://qmaps.ca/business/${index}`,
    }));

    const files = buildSitemapFiles(entries);
    expect([...files.keys()]).toEqual(["sitemap-1.xml", "sitemap-2.xml", "sitemap.xml"]);
    expect(files.get("sitemap.xml")).toContain("<sitemapindex");
    expect(files.get("sitemap-1.xml")).toContain(
      `https://qmaps.ca/business/${SITEMAP_URL_LIMIT - 1}`,
    );
    expect(files.get("sitemap-2.xml")).toContain(
      `https://qmaps.ca/business/${SITEMAP_URL_LIMIT}`,
    );
  });
});
