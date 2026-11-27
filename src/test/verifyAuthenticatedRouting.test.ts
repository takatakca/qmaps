import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readQaFixture, verifyAuthenticatedRouting } from "../../scripts/verify-authenticated-routing.mjs";

const fixture = () => ({
  QMAPS_QA_PLACE_ID: "a9bf0001-0000-4000-8000-000000000001",
  ...Object.fromEntries(["CLIENT", "OBSERVER", "MERCHANT", "ADMIN"].flatMap(role => [
    [`QMAPS_QA_${role}_HANDLE`, `qa-${role.toLowerCase()}`],
    [`QMAPS_QA_${role}_PASSWORD`, "un-mot-de-passe-fictif"],
  ])),
});

describe("QMAPS authenticated release verification", () => {
  beforeEach(() => vi.stubGlobal("AbortSignal", { timeout: () => new AbortController().signal }));
  afterEach(() => vi.unstubAllGlobals());

  it("requires a dedicated handle, password and listing before contacting production", async () => {
    const request = vi.fn();
    await expect(verifyAuthenticatedRouting({ ...fixture(), QMAPS_QA_ADMIN_HANDLE: "admin-ordinaire" }, request))
      .rejects.toThrow("QMAPS_QA_ADMIN_HANDLE");
    await expect(verifyAuthenticatedRouting({ ...fixture(), QMAPS_QA_PLACE_ID: "invalid" }, request))
      .rejects.toThrow("QMAPS_QA_PLACE_ID");
    expect(request).not.toHaveBeenCalled();
  });

  it("requires independent client, observer, merchant and admin identities", () => {
    expect(() => readQaFixture({ ...fixture(), QMAPS_QA_OBSERVER_HANDLE: "qa-client" }))
      .toThrow("Quatre comptes de test distincts");
  });

  it("starts anonymously, refuses redirects and does not expose a failed response body", async () => {
    const request = vi.fn(async (_url: string, options: RequestInit) => {
      expect(options.redirect).toBe("error");
      expect(options.headers).not.toHaveProperty("Cookie");
      return new Response("contenu-interne-a-ne-pas-imprimer", { status: 503 });
    });
    await expect(verifyAuthenticatedRouting(fixture(), request)).rejects.toThrow(/HTTP 503, attendu 401\.$/);
    expect(request).toHaveBeenCalledExactlyOnceWith(
      "https://qmaps.ca/api/v1/browser/me/directory-preferences", expect.any(Object),
    );
  });
});
