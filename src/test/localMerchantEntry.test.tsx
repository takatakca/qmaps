import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ownedMerchantUrl } from "@/lib/ownedRoutes";
import CategoryPage from "@/pages/CategoryPage";
import CityPage from "@/pages/CityPage";

const { topPlaces, useAllCategories } = vi.hoisted(() => ({
  topPlaces: vi.fn(),
  useAllCategories: vi.fn(),
}));

vi.mock("@/lib/ownedDirectory", () => ({ topPlaces }));
vi.mock("@/hooks/useAllCategories", () => ({ useAllCategories }));
vi.mock("@/hooks/useRecommendedBusinesses", () => ({
  useRecommendedBusinesses: () => ({ recommended: [], loading: false }),
}));
vi.mock("@/components/SearchBar", () => ({ default: () => null }));
vi.mock("@/components/BusinessCard", () => ({ default: () => null }));
vi.mock("@/components/BottomNav", () => ({ default: () => null }));
vi.mock("@/components/Seo", () => ({ default: () => null }));
vi.mock("@/components/sponsored/SponsoredListings", () => ({ default: () => null }));
vi.mock("@/components/recommendations/DirectoryRecommendations", () => ({ default: () => null }));

const restaurants = { id: "41adb0c2-5c03-47ab-b3d0-cba7cb42d308", slug: "restaurants", name: "Restaurants" };
let host: HTMLDivElement;
let root: Root;

function AccountDestination() {
  const { pathname, search } = useLocation();
  return <output>{pathname + search}</output>;
}

async function open(path: string) {
  await act(async () => root.render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/city/:citySlug" element={<CityPage />} />
        <Route path="/c/:categorySlug" element={<CategoryPage />} />
        <Route path="/city/:citySlug/:categorySlug" element={<CategoryPage />} />
        <Route path="/compte" element={<AccountDestination />} />
      </Routes>
    </MemoryRouter>,
  ));
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  topPlaces.mockReset().mockResolvedValue([]);
  useAllCategories.mockReset().mockReturnValue({ categories: [restaurants], loading: false, error: false });
  host = document.body.appendChild(document.createElement("div"));
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

function expectNoMerchantAction() {
  expect(host.querySelector(`a[href="${ownedMerchantUrl}"]`)).toBeNull();
  expect(host.querySelector('a[href="/add-business"]')).toBeNull();
}

describe("merchant entry from the public QMAPS directory", () => {
  it.each([
    ["/city/montreal", "city=Montr%C3%A9al", 20],
    ["/c/restaurants", "category=restaurants", 30],
    ["/city/montreal/restaurants", "category=restaurants&city=Montr%C3%A9al", 30],
  ] as const)("opens the owned account from empty %s", async (path, query, limit) => {
    await open(path);

    expect(topPlaces).toHaveBeenCalledExactlyOnceWith(new URLSearchParams(query), limit, expect.any(AbortSignal));
    expect(host.querySelector('a[href="/add-business"]')).toBeNull();
    const action = host.querySelector<HTMLAnchorElement>(`a[href="${ownedMerchantUrl}"]`);
    expect(action).toHaveTextContent(/ajouter une entreprise/i);
    await act(async () => action!.click());
    expect(host.querySelector("output")).toHaveTextContent(ownedMerchantUrl);
  });

  it("does not offer registration for an unknown category", async () => {
    await open("/c/introuvable");
    expect(host).toHaveTextContent("Catégorie introuvable");
    expect(topPlaces).not.toHaveBeenCalled();
    expectNoMerchantAction();
  });

  it.each([
    ["/city/montreal", "Impossible de charger les commerces de cette ville."],
    ["/c/restaurants", "Impossible de charger cette catégorie pour le moment."],
    ["/city/montreal/restaurants", "Impossible de charger cette catégorie pour le moment."],
  ] as const)("does not present a directory failure as an empty %s", async (path, message) => {
    topPlaces.mockRejectedValue(new Error("Annuaire indisponible"));
    await open(path);
    expect(host.querySelector('[role="alert"]')).toHaveTextContent(message);
    expectNoMerchantAction();
  });

  it("does not offer registration when the public taxonomy is unavailable", async () => {
    useAllCategories.mockReturnValue({ categories: [], loading: false, error: true });
    await open("/city/montreal/restaurants");
    expect(host.querySelector('[role="alert"]')).toHaveTextContent("Impossible de charger cette catégorie");
    expect(topPlaces).not.toHaveBeenCalled();
    expectNoMerchantAction();
  });
});
