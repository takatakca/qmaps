import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyLiveRouting } from "../../scripts/verify-live-routing.mjs";

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
});
