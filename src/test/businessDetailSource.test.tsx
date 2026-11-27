import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useNavigate, type NavigateFunction } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BusinessDetail from "@/pages/BusinessDetail";
import BusinessCard from "@/components/BusinessCard";
import { directoryAccountKey } from "@/hooks/useDirectoryAccount";
import { ownedListingUrl } from "@/lib/ownedRoutes";

const legacy = vi.hoisted(() => ({
  from: vi.fn(),
  reviews: vi.fn(),
  profileView: vi.fn(),
  recommendation: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: legacy.from } }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/lib/reviewsWithAuthors", () => ({ fetchReviewsWithAuthors: legacy.reviews }));
vi.mock("@/lib/analytics", () => ({ trackBusinessEvent: legacy.profileView }));
vi.mock("@/hooks/useRecommendationEvents", () => ({ trackRecommendationEvent: legacy.recommendation }));
vi.mock("@/components/BottomNav", () => ({ default: () => null }));
vi.mock("@/components/business/DirectoryBookmark", () => ({ default: () => null }));
vi.mock("@/components/business/BookmarkButton", () => ({ default: () => null }));
vi.mock("@/components/account/OwnedGallery", () => ({ default: () => null }));
vi.mock("@/components/account/OwnedReviews", () => ({ default: () => null }));

const first = "1944a6d1-a00d-49b9-84b0-c480074e3f26";
const second = "e01de00e-6de9-5663-b09b-18284e356a83";
const endpoint = (id: string) => "/api/v1/browser/places/" + id;
const place = (id: string, name: string) => Response.json({ id, name, city: "Montréal" });
const legacyResult = (result: Promise<{ data: null; error: null }>) => {
  legacy.from.mockReturnValue({
    select: () => ({ eq: () => ({ maybeSingle: () => result }) }),
  });
};

let host: HTMLDivElement;
let root: Root;
let cache: QueryClient;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.resetAllMocks();
  legacyResult(Promise.resolve({ data: null, error: null }));
  legacy.reviews.mockResolvedValue([]);
  cache = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  cache.clear();
  host.remove();
  vi.unstubAllGlobals();
});

async function mount(path: string) {
  let navigate!: NavigateFunction;
  function Detail() { navigate = useNavigate(); return <BusinessDetail />; }
  await act(async () => root.render(<QueryClientProvider client={cache}>
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/business/:id" element={<Detail />} />
        <Route path="/search" element={<BusinessCard ownedDirectory business={{
          id: first, name: "Fiche QMAPS", category: "Restaurants", image: "/placeholder.svg",
          rating: 0, reviewCount: 0, neighborhood: "Montréal", priceLevel: "", isOpen: false,
          address: "", phone: "", hours: "", description: "", amenities: [], photos: [],
        }} />} />
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>));
  return navigate;
}

describe("business detail catalogue routing", () => {
  it("opens a portable owned link without reading or logging against the legacy catalogue", async () => {
    const request = vi.fn(async () => place(first, "Vrai établissement QMAPS"));
    vi.stubGlobal("fetch", request);
    await mount(ownedListingUrl(first));
    expect(request).toHaveBeenCalledExactlyOnceWith(endpoint(first), expect.objectContaining({
      method: "GET", credentials: "same-origin",
    }));
    expect(host.querySelector("h1")).toHaveTextContent("Vrai établissement QMAPS");
    expect(legacy.from).not.toHaveBeenCalled();
    expect(legacy.reviews).not.toHaveBeenCalled();
    expect(legacy.profileView).not.toHaveBeenCalled();
  });

  it("does not fall back to a legacy row for a withdrawn owned listing", async () => {
    const request = vi.fn(async () => Response.json({ error: "Introuvable" }, { status: 404 }));
    vi.stubGlobal("fetch", request);
    await mount(ownedListingUrl(first));
    expect(host.querySelector("h1")).toHaveTextContent("Commerce introuvable");
    expect(request).toHaveBeenCalledTimes(1);
    expect(legacy.from).not.toHaveBeenCalled();
    expect(legacy.reviews).not.toHaveBeenCalled();
  });

  it("retries an unavailable owned detail with the same source only", async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(Response.json({ error: "Indisponible" }, { status: 503 }))
      .mockResolvedValueOnce(place(first, "Fiche QMAPS de retour"));
    vi.stubGlobal("fetch", request);
    await mount(ownedListingUrl(first));
    expect(host.querySelector("h1")).toHaveTextContent("Impossible de charger la fiche");
    const retry = [...host.querySelectorAll("button")].find(button => button.textContent === "Réessayer");
    expect(retry).toBeDefined();
    await act(async () => retry!.click());
    expect(host.querySelector("h1")).toHaveTextContent("Fiche QMAPS de retour");
    expect(request.mock.calls.map(([url]) => url)).toEqual([endpoint(first), endpoint(first)]);
    expect(legacy.from).not.toHaveBeenCalled();
  });

  it("keeps the legacy path for unmarked deep links, including the reviews tab", async () => {
    let finishLegacy!: (value: { data: null; error: null }) => void;
    const pending = new Promise<{ data: null; error: null }>(resolve => { finishLegacy = resolve; });
    legacyResult(pending);
    const request = vi.fn(async () => place(first, "Fallback QMAPS existant"));
    vi.stubGlobal("fetch", request);
    await mount("/business/" + first + "?tab=reviews");
    expect(legacy.from).toHaveBeenCalledExactlyOnceWith("businesses");
    expect(legacy.reviews).toHaveBeenCalledExactlyOnceWith(first);
    expect(legacy.profileView).toHaveBeenCalledExactlyOnceWith(first, "profile_view", { source: "business_detail" });
    expect(request).not.toHaveBeenCalled();
    await act(async () => finishLegacy({ data: null, error: null }));
    expect(host.querySelector("h1")).toHaveTextContent("Fallback QMAPS existant");
  });

  it("keeps the same account-scoped visit signal when a directory card is clicked", async () => {
    cache.setQueryData(directoryAccountKey, "account-test");
    const request = vi.fn(async (_url: string, options: RequestInit) =>
      options.method === "PUT" ? new Response(null, { status: 204 }) : place(first, "Fiche QMAPS"));
    vi.stubGlobal("fetch", request);
    await mount("/search");
    const link = host.querySelector<HTMLAnchorElement>("h3 a");
    expect(link?.getAttribute("href")).toBe(ownedListingUrl(first));
    await act(async () => link!.click());
    expect(host.querySelector("h1")).toHaveTextContent("Fiche QMAPS");
    expect(request).toHaveBeenCalledWith("/api/v1/browser/me/directory-preferences/" + first, expect.objectContaining({
      method: "PUT", credentials: "same-origin", body: JSON.stringify({ action: "view", accountId: "account-test" }),
    }));
    expect(request).toHaveBeenCalledWith(endpoint(first), expect.objectContaining({ method: "GET" }));
    expect(legacy.from).not.toHaveBeenCalled();
  });

  it("discards an already loading detail after a second owned link opens", async () => {
    let completeFirst!: (response: Response) => void;
    const initial = new Promise<Response>(resolve => { completeFirst = resolve; });
    const request = vi.fn((url: string, _options: RequestInit) =>
      url === endpoint(first) ? initial : Promise.resolve(place(second, "Deuxième fiche")));
    vi.stubGlobal("fetch", request);
    const navigate = await mount(ownedListingUrl(first));
    await act(async () => navigate(ownedListingUrl(second)));
    expect(request.mock.calls[0][1].signal?.aborted).toBe(true);
    await act(async () => completeFirst(place(first, "Ancienne navigation")));
    expect(host.querySelector("h1")).toHaveTextContent("Deuxième fiche");
    expect(host).not.toHaveTextContent("Ancienne navigation");
    expect(legacy.from).not.toHaveBeenCalled();
  });
});
