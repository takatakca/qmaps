import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OwnedWorkspace from "@/pages/OwnedWorkspace";
import { ownedListingReviewUrl, ownedMerchantUrl, ownedReviewUrl } from "@/lib/ownedRoutes";

vi.mock("@/components/account/OwnedLogin", () => ({
  default: ({ onReady }: { onReady: () => void }) => <button onClick={onReady}>Session de recette prête</button>,
}));
vi.mock("@/components/account/OwnedGallery", () => ({ default: () => <div data-gallery /> }));
vi.mock("@/components/account/OwnedReviews", () => ({
  default: ({ place, readOnly }: { place: string; readOnly?: boolean }) =>
    <div data-review={place} data-readonly={String(Boolean(readOnly))} />,
}));

const placeId = "1944a6d1-a00d-49b9-84b0-c480074e3f26";
let host: HTMLDivElement;
let root: Root;
let cache: QueryClient;
let signedIn: boolean;

function apiMock(catalogue: { id: string; name: string; city: string }[] = []) {
  return vi.fn(async (input: string) => {
    const path = input.replace(/^\/api\/v1\/browser\//, "");
    if (path === "me") return signedIn
      ? Response.json({ id: "qa-owner", handle: "qa-owner", roles: ["user"] })
      : Response.json({ error: "Connexion requise" }, { status: 401 });
    if (path === "me/publication-terms") return Response.json({ version: "qa", accepted: true });
    if (path.startsWith("places?")) return Response.json(catalogue);
    if (path === "places/" + placeId) return Response.json({ id: placeId, name: "Commerce de recette", city: "Montréal" });
    if (path === "places/a9bf0001-0000-4000-8000-000000000001") return Response.json({
      id: "a9bf0001-0000-4000-8000-000000000001", name: "Bistro de nuit", city: "Montréal",
    });
    if (path.endsWith("/guest-settings")) return Response.json({ waitlist: false });
    return Response.json([]);
  });
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  signedIn = false;
  host = document.body.appendChild(document.createElement("div"));
  root = createRoot(host);
  cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

afterEach(() => {
  act(() => root.unmount());
  cache.clear();
  host.remove();
  vi.unstubAllGlobals();
});

async function open(path: string) {
  await act(async () => root.render(<QueryClientProvider client={cache}>
    <MemoryRouter initialEntries={[path]}><OwnedWorkspace /></MemoryRouter>
  </QueryClientProvider>));
}

async function settle() {
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
}

describe("entry to the owned merchant catalogue", () => {
  it("keeps the merchant destination through login and opens the owned creation form", async () => {
    const fetchOwned = apiMock();
    vi.stubGlobal("fetch", fetchOwned);
    await open(ownedMerchantUrl);
    expect(host.textContent).toContain("ajouter votre entreprise à l’annuaire");
    expect(host.querySelector("summary")).toBeNull();
    expect(fetchOwned.mock.calls.map(([url]) => url)).toEqual(["/api/v1/browser/me"]);

    signedIn = true;
    const login = Array.from(host.querySelectorAll("button")).find(b => b.textContent === "Session de recette prête");
    expect(login).toBeDefined();
    await act(async () => login?.click());
    await settle();

    expect(host.querySelector('nav[aria-label="Espace QMAPS"] [aria-pressed="true"]')?.textContent).toBe("Mon commerce");
    expect(host.querySelector("summary")?.textContent?.trim()).toBe("Créer ma fiche");
    expect(fetchOwned.mock.calls.map(([url]) => url)).toContain("/api/v1/browser/me/places");
    expect(fetchOwned.mock.calls.some(([url]) => url.startsWith("/api/v1/browser/places?"))).toBe(false);
  });

  it("does not replace a linked listing with the merchant tab", async () => {
    signedIn = true;
    const fetchOwned = apiMock();
    vi.stubGlobal("fetch", fetchOwned);
    await open(ownedMerchantUrl + "&fiche=" + placeId);
    await settle();

    expect(host.querySelector("h2")?.textContent).toBe("Commerce de recette");
    expect(fetchOwned.mock.calls.map(([url]) => url)).toContain("/api/v1/browser/places/" + placeId);
    expect(fetchOwned.mock.calls.map(([url]) => url)).not.toContain("/api/v1/browser/me/places");
  });

  it("leaves the ordinary account entry on discovery", async () => {
    signedIn = true;
    vi.stubGlobal("fetch", apiMock());
    await open("/compte");
    expect(host.querySelector('nav[aria-label="Espace QMAPS"] [aria-pressed="true"]')?.textContent).toBe("Découvrir");
  });
});

describe("entry to an owned listing review", () => {
  it("retains the review intention after login, and uses the owned catalogue to choose a real place", async () => {
    const fetchOwned = apiMock([
      { id: placeId, name: "Commerce de recette", city: "Montréal" },
      { id: "a9bf0001-0000-4000-8000-000000000001", name: "QMAPS Démo — Bistro de nuit", city: "Montréal" },
    ]);
    vi.stubGlobal("fetch", fetchOwned);
    await open(ownedReviewUrl);
    expect(host.textContent).toContain("écrire un avis sur un commerce");
    expect(fetchOwned.mock.calls.map(([url]) => url)).toEqual(["/api/v1/browser/me"]);

    signedIn = true;
    await act(async () => Array.from(host.querySelectorAll("button")).find(b => b.textContent === "Session de recette prête")?.click());
    await settle();
    expect(host.textContent).toContain("Choisissez une fiche de l’annuaire");
    expect(host.textContent).not.toContain("Bistro de nuit");
    const place = Array.from(host.querySelectorAll("button")).find(b => b.textContent?.includes("Commerce de recette"));
    expect(place).toBeDefined();
    await act(async () => place?.click());
    expect(host.querySelector("[data-review]")?.getAttribute("data-review")).toBe(placeId);
    expect(host.querySelector("[data-review]")?.getAttribute("data-readonly")).toBe("false");
    expect(host.querySelector("[data-review]")?.nextElementSibling?.hasAttribute("data-gallery")).toBe(true);
  });

  it("opens a linked example's reviews in read-only mode", async () => {
    signedIn = true;
    vi.stubGlobal("fetch", apiMock());
    await open(ownedListingReviewUrl("a9bf0001-0000-4000-8000-000000000001"));
    await settle();
    expect(host.querySelector("h2")?.textContent).toBe("Bistro de nuit");
    expect(host.querySelector("[data-review]")?.getAttribute("data-readonly")).toBe("true");
  });
});
