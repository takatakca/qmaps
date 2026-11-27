import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Index from "@/pages/Index";

const legacy = vi.hoisted(() => vi.fn(() => ({ select: () => ({ eq: () => ({ in: () => ({
  order: () => ({ limit: async () => ({ data: [], error: null }) }),
}) }) }) })));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: legacy } }));
vi.mock("@/components/BottomNav", () => ({ default: () => null }));
vi.mock("@/components/home/HeroSection", () => ({ default: () => null }));
vi.mock("@/components/home/CategoryShowcase", () => ({ default: () => null }));
vi.mock("@/components/home/StartProjectCTA", () => ({ default: () => null }));
vi.mock("@/components/home/MerchantBanner", () => ({ default: () => null }));
vi.mock("@/components/sponsored/SponsoredListings", () => ({ default: () => null }));
vi.mock("@/components/recommendations/DirectoryRecommendations", () => ({ default: () => null }));
vi.mock("@/components/Seo", () => ({ default: () => null }));
vi.mock("@/hooks/useNearbyBusinesses", () => ({ useNearbyBusinesses: () => ({ businesses: [], loading: false }) }));
vi.mock("@/hooks/useRecommendedBusinesses", () => ({
  useRecommendedBusinesses: () => ({ recommended: [], trending: [], loading: false }),
}));
vi.mock("@/i18n/language", () => ({ useLang: () => ({ t: (key: string) => key }) }));

const row = {
  id: "owned-qa-listing", name: "Commerce de recette", city: "Montréal", status: "open", is_open: true,
  avg_rating: 4, reviews_count: 3, created_at: "2026-10-02T00:00:00Z", is_claimed: true,
  photos: [], business_categories: [{ categories: { id: "cat-a", name: "Services locaux", slug: "services" } }],
};
const older = { ...row, id: "older-listing", name: "Service de quartier", avg_rating: 5, created_at: "2026-10-01T00:00:00Z" };
let host: HTMLDivElement;
let root: Root | null = null;

async function mount() {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root?.render(<MemoryRouter><Index /></MemoryRouter>));
}

function cards(title: string) {
  const heading = Array.from(host.querySelectorAll("h2")).find(item => item.textContent === title);
  return Array.from(heading?.closest("section")?.querySelectorAll('a[href^="/business/"]') ?? []);
}

describe("homepage listing rows use the owned directory", () => {
  beforeEach(() => {
    legacy.mockClear();
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  });
  afterEach(() => {
    act(() => root?.unmount());
    root = null;
    host?.remove();
    vi.unstubAllGlobals();
  });

  it("shows the same listing in popular, recent and category rows while preserving their sorting", async () => {
    const fetchDirectory = vi.fn(async () => Response.json({ items: [row, older], next: null }));
    vi.stubGlobal("fetch", fetchDirectory);
    await mount();

    expect(fetchDirectory).toHaveBeenCalledExactlyOnceWith("/api/v1/browser/directory?limit=60&order=rating",
      expect.objectContaining({ credentials: "same-origin" }));
    expect(legacy).not.toHaveBeenCalled();
    expect(cards("popular").map(card => card.getAttribute("href"))).toEqual(["/business/older-listing", "/business/owned-qa-listing"]);
    expect(cards("recent")[0]?.getAttribute("href")).toBe("/business/owned-qa-listing");
    expect(cards("services")[1]?.textContent).toContain("Services locaux");
    expect(cards("services")[1]?.textContent).toContain("Vérifié");
  });

  it("shows the loading error without substituting another catalogue", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 503 })));
    await mount();

    expect(host.textContent).toContain("Impossible de charger les entreprises pour le moment.");
    expect(cards("popular")).toHaveLength(0);
    expect(legacy).not.toHaveBeenCalled();
  });

  it("shows real listings first, distinguishes examples and doesn't claim unknown hours", async () => {
    const example = {
      ...row,
      id: "a9bf0001-0000-4000-8000-000000000001",
      name: "QMAPS Démo — Bistro de nuit",
      avg_rating: 5,
    };
    const imported = {
      ...row,
      id: "on2go-source-listing",
      name: "Restaurant réel",
      is_claimed: false,
      is_open: false,
      hours: null,
      hours_json: null,
      avg_rating: 0,
    };
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ items: [example, imported], next: null })));
    await mount();

    const [real, sample] = cards("popular");
    expect(real.querySelector("h3")?.textContent).toBe("Restaurant réel");
    expect(real.textContent).not.toMatch(/Ouvert|Fermé|Vérifié/);
    expect(sample.querySelector("h3")?.textContent).toBe("Bistro de nuit");
    expect(sample.textContent).not.toContain("Démo");
    expect(sample.textContent).toContain("Fiche d’exemple");
  });

  it("aborts the listing request when leaving the page", async () => {
    const fetchDirectory = vi.fn(async (_url: string, { signal }: RequestInit) => new Promise<Response>((_resolve, reject) => {
      signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    }));
    vi.stubGlobal("fetch", fetchDirectory);
    await mount();
    const signal = fetchDirectory.mock.calls[0]?.[1].signal;
    expect(signal?.aborted).toBe(false);
    await act(async () => root?.unmount());
    root = null;
    expect(signal?.aborted).toBe(true);
  });
});
