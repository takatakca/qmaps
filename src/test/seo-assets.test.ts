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


describe("production domain and sitemap", () => {
  it("uses qmaps.ca and never the legacy preview host", () => {
    const sitemap = readPublic("sitemap.xml");
    const robots = readPublic("robots.txt");
    expect(sitemap).toContain("https://qmaps.ca/");
    expect(sitemap).not.toContain("lovable.app");
    expect(robots).toContain("Sitemap: https://qmaps.ca/sitemap.xml");
  });

  it("does not publicly index user, merchant or admin pages", () => {
    const sitemap = readPublic("sitemap.xml");
    for (const route of ["/admin", "/merchant", "/settings", "/notifications", "/collections", "/projects", "/talk", "/events"]) {
      expect(sitemap).not.toContain("<loc>https://qmaps.ca" + route);
    }
  });
});
