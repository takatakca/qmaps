import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyDirectoryPages, verifyLiveRouting } from "../../scripts/verify-live-routing.mjs";

function apiResponse(url: string) {
  if (url.endsWith("/health")) return Response.json({ service: "QMAPS", database: "PostgreSQL" });
  if (url.includes("/directory?")) return Response.json({ items: [], next: null });
  return Response.json({ error: "Connexion requise" }, { status: 401 });
}

describe("QMAPS live routing smoke", () => {
  beforeEach(() => {
    vi.stubGlobal("AbortSignal", { timeout: () => new AbortController().signal });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("accepts healthy JSON routes and anonymous 401 responses on all three domains", async () => {
    const request = vi.fn(async (url: string) => apiResponse(url));
    const results = await verifyLiveRouting(request);

    expect(results).toHaveLength(12);
    expect(results.every(result => result.error === null)).toBe(true);
    expect(request.mock.calls.filter(([url]) => url.startsWith("https://qmaps.ca/"))).toHaveLength(4);
    expect(request.mock.calls.filter(([url]) => url.startsWith("https://www.qmaps.ca/"))).toHaveLength(4);
    expect(request.mock.calls.filter(([url]) => url.startsWith("https://qmaps.takatak.ca/"))).toHaveLength(4);
  });

  it("reports a successful SPA fallback and a redirect without following either", async () => {
    const request = vi.fn(async (url: string, options: RequestInit) => {
      expect(options.redirect).toBe("manual");
      if (url === "https://www.qmaps.ca/api/v1/health") {
        return new Response("<html>QMAPS</html>", { headers: { "content-type": "text/html" } });
      }
      if (url === "https://qmaps.ca/api/v1/browser/me/directory-preferences") {
        return Response.redirect("https://api.qmaps.ca/v1/browser/me/directory-preferences");
      }
      return apiResponse(url);
    });
    const failures = (await verifyLiveRouting(request)).filter(result => result.error);

    expect(failures).toHaveLength(2);
    expect(failures).toEqual(expect.arrayContaining([
      { url: "https://www.qmaps.ca/api/v1/health", error: expect.stringContaining("200, text/html") },
      { url: "https://qmaps.ca/api/v1/browser/me/directory-preferences", error: expect.stringContaining("302") },
    ]));
  });

  it("keeps checking the other routes when a response is unreachable or malformed", async () => {
    const request = async (url: string) => {
      if (url === "https://www.qmaps.ca/api/v1/health") throw new Error("indisponible");
      if (url === "https://qmaps.ca/api/v1/browser/directory?limit=1") return Response.json({ items: [] });
      return apiResponse(url);
    };

    const results = await verifyLiveRouting(request);
    expect(results).toHaveLength(12);
    expect(results.filter(result => result.error)).toHaveLength(2);
  });

  describe("opt-in directory pagination", () => {
    const firstCursor = "continuation_1";
    const firstRows = Array.from({ length: 12 }, (_, index) => ({
      id: `b1230000-0000-4000-a000-${String(index + 1).padStart(12, "0")}`,
      city: "Montréal",
    }));
    const lastRow = { id: "b1230000-0000-4000-a000-000000000013", city: "Montréal" };
    const first = () => Response.json({ items: firstRows, next: firstCursor });
    const second = () => Response.json({ items: [lastRow], next: null });
    const continuation = (url: string) => new URL(url).searchParams.has("after");

    it("checks both web and native clients without following redirects or changing filters", async () => {
      const request = vi.fn(async (url: string, options: RequestInit) => {
        const target = new URL(url);
        expect(options.redirect).toBe("manual");
        expect(new Headers(options.headers).has("Authorization")).toBe(false);
        expect(target.searchParams.get("city")).toBe("Montréal");
        expect(target.searchParams.get("sort")).toBe("recommended");
        expect(target.searchParams.get("limit")).toBe("12");
        if (!continuation(url)) return first();
        expect(target.searchParams.get("after")).toBe(firstCursor);
        return second();
      });
      const results = await verifyDirectoryPages(request);

      expect(request).toHaveBeenCalledTimes(14);
      expect(results).toHaveLength(7);
      expect(results.every(result => result.error === null)).toBe(true);
      expect(results.map(result => new URL(result.url).pathname)).toEqual([
        "/api/v1/browser/directory/results", "/api/v1/directory/results",
        "/api/v1/browser/directory/results", "/api/v1/directory/results",
        "/api/v1/browser/directory/results", "/api/v1/directory/results",
        "/v1/directory/results",
      ]);
    });

    it("does not mistake legacy results, HTML or an absent cursor for readiness", async () => {
      const request = vi.fn(async (url: string) => {
        if (url.startsWith("https://api.qmaps.ca/")) return Response.json({ error: "Introuvable" }, { status: 404 });
        if (url.startsWith("https://qmaps.ca/api/v1/directory/")) return new Response("<html>Catalogue</html>", {
          headers: { "content-type": "text/html" },
        });
        if (url.startsWith("https://www.qmaps.ca/api/v1/browser/")) {
          return Response.json({ items: firstRows, next: null });
        }
        return continuation(url) ? second() : first();
      });
      const results = await verifyDirectoryPages(request);
      expect(request).toHaveBeenCalledTimes(11);
      expect(results[6].error).toMatch(/Première page.*404/u);
      expect(results[1].error).toContain("text/html");
      expect(results[2].error).toContain("deuxième page");
      expect(results.filter(result => result.error !== null)).toHaveLength(3);
    });

    it("fails the gate on overlap, a changed city or a non-progressing cursor", async () => {
      const request = async (url: string) => {
        if (!continuation(url)) return first();
        if (url.startsWith("https://qmaps.ca/api/v1/browser/"))
          return Response.json({ items: [firstRows[0]], next: null });
        if (url.startsWith("https://qmaps.ca/api/v1/directory/"))
          return Response.json({ items: [{ ...lastRow, city: "Laval" }], next: null });
        if (url.startsWith("https://api.qmaps.ca/"))
          return Response.json({ items: [lastRow], next: firstCursor });
        return second();
      };
      const results = await verifyDirectoryPages(request);
      expect(results[0].error).toContain("Identifiants répétés");
      expect(results[1].error).toContain("hors de Montréal");
      expect(results[6].error).toContain("curseur sans progression");
      expect(results.filter(result => result.error !== null)).toHaveLength(3);
    });
  });
});
