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

  it("requires a test listing for merchant verification but not for admin verification", () => {
    const env = {
      QMAPS_QA_MERCHANT_HANDLE: "qa-merchant", QMAPS_QA_MERCHANT_PASSWORD: "un-mot-de-passe-fictif",
      QMAPS_QA_ADMIN_HANDLE: "qa-admin", QMAPS_QA_ADMIN_PASSWORD: "un-mot-de-passe-fictif",
    };
    expect(Object.keys(readQaFixture(env, "admin").accounts)).toEqual(["ADMIN"]);
    expect(() => readQaFixture(env, "merchant")).toThrow("QMAPS_QA_PLACE_ID");
  });

  it.each(["merchant", "admin"] as const)("checks only %s and closes its sessions without data writes", async scope => {
    const key = `QMAPS_QA_${scope.toUpperCase()}`;
    const placeId = fixture().QMAPS_QA_PLACE_ID;
    const handle = `qa-${scope}`;
    const env = { [`${key}_HANDLE`]: handle, [`${key}_PASSWORD`]: "un-mot-de-passe-fictif",
      ...(scope === "merchant" ? { QMAPS_QA_PLACE_ID: placeId } : {}) };
    const id = "451b0001-0000-4000-8000-000000000001";
    const cookie = "__Host-qmaps_session=" + "a".repeat(43);
    const report = vi.fn();
    const request = vi.fn(async (url: string, options: RequestInit) => {
      const path = new URL(url).pathname.replace(/^\/api\/v1\/browser/, "");
      const currentCookie = (options.headers as Record<string, string>).Cookie;
      if (path === "/accounts/login" && options.method === "POST") {
        expect(JSON.parse(String(options.body)).handle).toBe(handle);
        return Response.json({ user_id: id }, { headers: {
          "set-cookie": `${cookie}; Path=/; HttpOnly; Secure; SameSite=Strict`,
        } });
      }
      if (path === "/accounts/logout" && options.method === "POST") {
        expect(currentCookie).toBe(cookie);
        return new Response(null, { status: 204 });
      }
      expect(options.method).toBe("GET");
      if (path === "/me/places" && scope === "merchant") {
        return currentCookie ? Response.json([{ id: placeId }]) : Response.json({ error: "Connexion requise" }, { status: 401 });
      }
      if (path === "/console") {
        if (!currentCookie) return Response.json({ error: "Connexion requise" }, { status: 401 });
        return scope === "admin" ? Response.json({ api: "QMAPS" }) : new Response(null, { status: 403 });
      }
      if (path === "/me" && currentCookie === cookie)
        return Response.json({ id, handle, roles: scope === "admin" ? ["admin"] : ["user"] });
      throw new Error("Unexpected request");
    });

    await verifyAuthenticatedRouting(env, request, report, scope);
    expect(report).toHaveBeenCalledTimes(3);
    expect(request.mock.calls.filter(([url]) => url.endsWith("/accounts/logout"))).toHaveLength(3);
    expect(request.mock.calls.every(([url]) => !url.includes("directory-preferences"))).toBe(true);
  });
});
