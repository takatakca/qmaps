import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ownedListingUrl } from "@/lib/ownedRoutes";
import {
  buildSitemapEntries,
  buildSitemapFiles,
  fetchPublicDirectory,
  generateSitemap,
  escapeXml,
  SITEMAP_URL_LIMIT,
} from "../../scripts/generate-sitemap.mjs";

const id = (n: number) => "10000000-0000-4000-8000-" + String(n).padStart(12, "0");
type Provenance = { source: string; external_id: string; licence?: string };
const on2go = { source: "on2go.ca", external_id: "pizzeria@montreal" };
const municipal = { source: "mtl_food", external_id: "13724", licence: "CC-BY-4.0" };
const row = (n: number, marker: Provenance = on2go) => ({
  id: id(n), status: "open", city: "Mont-Valin", name: "Ne pas exporter",
  phone: "514-555-0100", attributes: { qmaps_directory_import: marker },
});
const page = (items: unknown[], next: string | null = null) => Response.json({ items, next });
const urls = (...numbers: number[]) => numbers.map(n => "https://qmaps.ca" + ownedListingUrl(id(n)));

describe("PostgreSQL sitemap generation", () => {
  beforeEach(() => vi.stubGlobal("AbortSignal", { timeout: () => new AbortController().signal }));
  afterEach(() => vi.unstubAllGlobals());

  it("uses the deployed anonymous keyset and omits details from the projection", async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(page([row(1), row(2, { ...on2go, source: "unreviewed" })], id(2)))
      .mockResolvedValueOnce(page([row(3, municipal)]));
    const result = await fetchPublicDirectory({ request, pageSize: 2 });
    expect(result.map(({ id }) => id)).toEqual([id(1), id(3)]);
    expect(JSON.stringify(result)).not.toMatch(/Ne pas exporter|514-555|Mont-Valin/);
    expect(request.mock.calls.map(([url]) => String(url))).toEqual([
      "https://qmaps.ca/api/v1/browser/directory?limit=2",
      "https://qmaps.ca/api/v1/browser/directory?limit=2&after=" + id(2),
    ]);
    for (const [, options] of request.mock.calls) {
      expect(options.credentials).toBe("omit");
      expect(options.redirect).toBe("error");
      expect(new Headers(options.headers).has("authorization")).toBe(false);
      expect(new Headers(options.headers).has("cookie")).toBe(false);
    }
  });

  it("refuses an HTML SPA fallback, a failed request and cursor loops", async () => {
    await expect(fetchPublicDirectory({ request: async () => new Response("<!doctype html>") })).rejects.toThrow("non-JSON");
    await expect(fetchPublicDirectory({ request: async () => Response.json({}, { status: 502 }) })).rejects.toThrow("502");
    await expect(fetchPublicDirectory({
      pageSize: 1,
      request: vi.fn().mockResolvedValueOnce(page([row(1)], id(1))).mockResolvedValueOnce(page([row(1)], id(1))),
    })).rejects.toThrow("out-of-order");
    await expect(fetchPublicDirectory({ pageSize: 1, request: async () => page([row(1)], id(7)) })).rejects.toThrow("continuation");
    await expect(fetchPublicDirectory({ request: async () => page([row(1)], id(1)) })).rejects.toThrow("continuation");
    await expect(fetchPublicDirectory({ request: async () => page([{ ...row(1), id: "../account" }]) })).rejects.toThrow("invalid");
  });

  it("keeps existing public pages and includes only reviewed canonical links", () => {
    const listings = [
      row(3, municipal), { ...row(1), status: "temporarily_closed" }, row(1),
      row(2, { ...municipal, licence: "ODbL-1.0" }),
      { ...row(4), status: "permanently_closed" },
      { ...row(5), attributes: {} },
      { ...row(6), id: "a9bf0001-0000-4000-8000-000000000001" },
    ];
    const entries = buildSitemapEntries(listings);
    const xml = buildSitemapFiles(entries).get("sitemap.xml")!;
    expect(entries.filter(({ loc }) => loc.includes("/business/")).map(({ loc }) => loc)).toEqual(urls(1, 3));
    expect(entries).toHaveLength(11);
    expect(xml).toContain("<loc>https://qmaps.ca/city/montreal</loc>");
    expect(xml).toContain("<loc>https://qmaps.ca/privacy</loc>");
    expect(xml).not.toMatch(/\/projects|\/search|\/compte|\/city\/mont-valin|<lastmod>|Ne pas exporter/);
  });

  it("escapes XML values", () => {
    expect(escapeXml(`A & <B> "C" 'D'`)).toBe("A &amp; &lt;B&gt; &quot;C&quot; &apos;D&apos;");
  });

  it("splits large inventories into root-level sitemaps within the protocol limits", () => {
    const entries = Array.from({ length: SITEMAP_URL_LIMIT + 1 }, (_, n) => ({ loc: urls(n)[0] }));
    const files = buildSitemapFiles(entries);
    expect([...files.keys()]).toEqual(["sitemap-1.xml", "sitemap-2.xml", "sitemap.xml"]);
    expect(files.get("sitemap.xml")).toContain("<sitemapindex");
    expect(files.get("sitemap.xml")).toContain("https://qmaps.ca/sitemap-2.xml");
    expect(files.get("sitemap-1.xml")!.match(/<url>/g)).toHaveLength(SITEMAP_URL_LIMIT);
    expect(files.get("sitemap-2.xml")).toContain(urls(SITEMAP_URL_LIMIT)[0]);
    for (const xml of files.values()) expect(Buffer.byteLength(xml)).toBeLessThanOrEqual(50 * 1024 * 1024);
  });

  it("keeps the old snapshot on failure and drops a withdrawn listing and obsolete shards on refresh", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "qmaps-sitemap-test-"));
    const output = join(cwd, "public");
    try {
      await mkdir(output);
      await writeFile(join(output, "sitemap.xml"), "old sitemap");
      await writeFile(join(output, "sitemap-3.xml"), "old shard");
      await writeFile(join(output, "robots.txt"), "keep");
      await expect(generateSitemap({ cwd, publishStatic: true, request: async () => new Response("", { status: 503 }) })).rejects.toThrow("503");
      expect(await readFile(join(output, "sitemap.xml"), "utf8")).toBe("old sitemap");
      expect(await readFile(join(output, "sitemap-3.xml"), "utf8")).toBe("old shard");

      await generateSitemap({ cwd, publishStatic: true, request: async () => page([row(1), row(2)]) });
      expect(await readFile(join(output, "sitemap.xml"), "utf8")).toContain(urls(1)[0]);
      expect((await readdir(output)).sort()).toEqual(["robots.txt", "sitemap.xml"]);
      await generateSitemap({ cwd, publishStatic: true, request: async () => page([row(2)]) });
      const refreshed = await readFile(join(output, "sitemap.xml"), "utf8");
      expect(refreshed).not.toContain(urls(1)[0]);
      expect(refreshed).toContain(urls(2)[0]);
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});
