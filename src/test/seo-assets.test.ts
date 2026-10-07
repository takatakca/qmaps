import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Phase 12F — Static SEO/PWA asset smoke tests.
 *
 * Asserts that the static files crawlers and app stores need are present
 * and minimally well-formed. Behavioural SEO/SSR coverage is documented in
 * docs/launch-checklist.md.
 */

const readPublic = (file: string) =>
  readFileSync(resolve(__dirname, "..", "..", "public", file), "utf8");

describe("seo: robots.txt", () => {
  const robots = readPublic("robots.txt");

  it("references the sitemap", () => {
    expect(robots).toMatch(/Sitemap:\s*\S*\/sitemap\.xml/i);
  });

  it("allows public crawling", () => {
    expect(robots).toMatch(/User-agent:\s*\*/i);
    expect(robots).toMatch(/Allow:\s*\//i);
  });

  it("points crawlers to the production sitemap", () => {
    expect(robots).toContain("Sitemap: https://qmaps.ca/sitemap.xml");
  });

  it("uses the wildcard exclusions for major search crawlers", () => {
    expect(robots).not.toMatch(/User-agent:\s*(Googlebot|Bingbot)/i);
    for (const path of ["/admin", "/merchant", "/settings", "/notifications", "/reset-password"]) {
      expect(robots).toContain(`Disallow: ${path}`);
    }
  });
});

describe("seo: sitemap.xml", () => {
  const sitemap = readPublic("sitemap.xml");

  it("uses only the canonical production domain", () => {
    expect(sitemap).toContain("<loc>https://qmaps.ca/</loc>");
    expect(sitemap).not.toContain("lovable.app");
  });

  it("does not submit mutable search results for indexing", () => {
    expect(sitemap).not.toContain("https://qmaps.ca/search");
    expect(sitemap).toContain("https://qmaps.ca/services");
  });
});

describe("pwa: manifest.webmanifest", () => {
  const manifest = JSON.parse(readPublic("manifest.webmanifest")) as Record<
    string,
    unknown
  >;

  it("has required top-level fields", () => {
    expect(manifest.name).toBeTruthy();
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBeTruthy();
  });

  it("declares at least one icon", () => {
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect((manifest.icons as unknown[]).length).toBeGreaterThan(0);
  });
});
