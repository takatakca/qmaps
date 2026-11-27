import { afterEach, describe, expect, it, vi } from "vitest";
import { directoryPages, topPlaces } from "@/lib/ownedDirectory";

const expired = () => Response.json({ error: "Session expirée" }, { status: 401 });
const list = (items: { id: string }[], next: string | null = null) => Response.json({ items, next });

afterEach(() => vi.unstubAllGlobals());

describe("public directory with an expired browser session", () => {
  it.each(["Session invalide", "Session expirée"])("retries a public ranking as a guest once after %s", async message => {
    const signal = new AbortController().signal;
    const fetchPage = vi.fn()
      .mockResolvedValueOnce(Response.json({ error: message }, { status: 401 }))
      .mockResolvedValueOnce(list([{ id: "public-place" }]));
    vi.stubGlobal("fetch", fetchPage);

    expect(await topPlaces(new URLSearchParams({ account: "" }), 10, signal)).toEqual([{ id: "public-place" }]);
    const url = "/api/v1/browser/directory?account=&limit=10&order=rating";
    expect(fetchPage).toHaveBeenNthCalledWith(1, url, { credentials: "same-origin", cache: "no-store", signal });
    expect(fetchPage).toHaveBeenNthCalledWith(2, url, { credentials: "omit", cache: "no-store", signal });
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["an expected account", "account=qa-account", expired],
    ["a second nonempty expected account parameter", "account=&account=qa-account", expired],
    ["a changed account", "account=", () => Response.json({ error: "Session modifiée" }, { status: 409 })],
    ["an unrelated 401", "", () => Response.json({ error: "Connexion requise" }, { status: 401 })],
    ["an HTML error", "", () => new Response("Session expirée", { status: 401, headers: { "content-type": "text/html" } })],
    ["an API error", "", () => Response.json({ error: "Session expirée" }, { status: 503 })],
  ] as const)("does not retry for %s", async (_label, query, failure) => {
    const fetchPage = vi.fn().mockResolvedValueOnce(failure());
    vi.stubGlobal("fetch", fetchPage);

    await expect(topPlaces(new URLSearchParams(query), 10, new AbortController().signal))
      .rejects.toThrow("L’annuaire QMAPS est indisponible.");
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("restarts pagination without mixing session-filtered results and guest results", async () => {
    const fetchPage = vi.fn()
      .mockResolvedValueOnce(list([{ id: "first-session-page" }], "cursor-a"))
      .mockResolvedValueOnce(expired())
      .mockResolvedValueOnce(list([{ id: "first-guest-page" }], "cursor-b"))
      .mockResolvedValueOnce(list([{ id: "second-guest-page" }]));
    vi.stubGlobal("fetch", fetchPage);

    expect(await directoryPages("", new URLSearchParams({ city: "Montréal" })))
      .toEqual([{ id: "first-guest-page" }, { id: "second-guest-page" }]);
    expect(fetchPage.mock.calls.map(([url, { credentials }]) => [new URL(url, "https://qmaps.ca").searchParams.get("after"), credentials]))
      .toEqual([[null, "same-origin"], ["cursor-a", "same-origin"], [null, "omit"], ["cursor-b", "omit"]]);
  });

  it("does not start a guest retry after abort", async () => {
    const controller = new AbortController();
    const fetchPage = vi.fn(async () => {
      controller.abort();
      return expired();
    });
    vi.stubGlobal("fetch", fetchPage);

    await expect(topPlaces(new URLSearchParams(), 10, controller.signal)).rejects.toThrow();
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("does not loop when the guest retry also fails", async () => {
    const fetchPage = vi.fn(async () => expired());
    vi.stubGlobal("fetch", fetchPage);

    await expect(directoryPages("/categories", new URLSearchParams())).rejects.toThrow();
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });
});
