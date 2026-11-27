import { afterEach, describe, expect, it, vi } from "vitest";
import { loadPublicPlace, loadPublicPlaceSection, ownedApi } from "@/lib/ownedApi";

const id = "1944a6d1-a00d-49b9-84b0-c480074e3f26";
const path = "/api/v1/browser/places/" + id;
const signal = () => new AbortController().signal;
const expired = () => Response.json({ error: "Session invalide" }, { status: 401 });

afterEach(() => vi.unstubAllGlobals());

describe("guest retry for public listing reads", () => {
  it.each([
    () => Response.json({ error: "Connexion requise" }, { status: 401 }),
    () => new Response("<h1>Session expirée</h1>", { status: 401, headers: { "Content-Type": "text/html" } }),
  ])("does not retry an unrelated 401", async (response) => {
    const request = vi.fn(async () => response());
    vi.stubGlobal("fetch", request);

    await expect(loadPublicPlace(id, signal())).rejects.toMatchObject({ status: 401 });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("preserves the guest visibility result and retries only once", async () => {
    const request = vi.fn(async () => expired())
      .mockImplementationOnce(async () => expired())
      .mockImplementationOnce(async () => Response.json({ error: "Fiche introuvable" }, { status: 404 }));
    vi.stubGlobal("fetch", request);

    await expect(loadPublicPlace(id, signal())).rejects.toMatchObject({ status: 404 });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("does not start a guest request after navigation cancels the first read", async () => {
    const controller = new AbortController();
    const request = vi.fn(async () => {
      controller.abort();
      return expired();
    });
    vi.stubGlobal("fetch", request);

    await expect(loadPublicPlace(id, controller.signal)).rejects.toMatchObject({ status: 401 });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("pins content requests to the viewer selected by the detail", async () => {
    const request = vi.fn(async () => Response.json({}));
    vi.stubGlobal("fetch", request);
    await loadPublicPlaceSection(id, "photos", "omit", signal(), 25);
    await loadPublicPlaceSection(id, "reviews", "same-origin", signal());

    expect(request).toHaveBeenNthCalledWith(1, path + "/photos?offset=25", expect.objectContaining({ method: "GET", credentials: "omit" }));
    expect(request).toHaveBeenNthCalledWith(2, path + "/reviews", expect.objectContaining({ method: "GET", credentials: "same-origin" }));
  });

  it("does not retry a private read or a mutation as a guest", async () => {
    const request = vi.fn(async () => expired());
    vi.stubGlobal("fetch", request);

    await expect(ownedApi("me/directory-preferences")).rejects.toMatchObject({ status: 401 });
    await expect(ownedApi("places/" + id + "/bookmark", "PUT")).rejects.toMatchObject({ status: 401 });
    expect(request).toHaveBeenCalledTimes(2);
    expect(request).toHaveBeenNthCalledWith(1, "/api/v1/browser/me/directory-preferences", expect.objectContaining({ method: "GET", credentials: "same-origin" }));
    expect(request).toHaveBeenNthCalledWith(2, path + "/bookmark", expect.objectContaining({ method: "PUT", credentials: "same-origin" }));
  });
});
