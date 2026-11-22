import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, useNavigate, type NavigateFunction } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Search from "@/pages/Search";

const requests: { url: URL; signal?: AbortSignal | null; reply: (rows: object[]) => void }[] = [];
vi.mock("@/hooks/useAllCategories", () => {
  const categories = [{ id: "23455678-0000-4000-a000-000000000001", slug: "restaurants", name: "Restaurants", parent_id: null }];
  return { useAllCategories: () => ({ categories, loading: false }), searchCategories: () => categories };
});
vi.mock("@/components/BusinessCard", () => ({ default: ({ business }: { business: { name: string } }) => <p>{business.name}</p> }));
vi.mock("@/components/BottomNav", () => ({ default: () => null }));
vi.mock("@/components/search/CategoryPickerDialog", () => ({ default: () => null }));
vi.mock("@/components/search/SearchFiltersSheet", () => ({ default: () => null }));

describe("directory search requests", () => {
  it("keeps the city on category matches and ignores late results after navigation", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>(resolve => requests.push({
        url: new URL(String(input), "https://qmaps.ca"),
        signal: init?.signal,
        reply: items => resolve(new Response(JSON.stringify({ items, next: null }), {
          headers: { "Content-Type": "application/json" },
        })),
      })));
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    let navigate: NavigateFunction;
    function Page() { navigate = useNavigate(); return <Search />; }
    try {
      await act(async () => root.render(<MemoryRouter initialEntries={["/search?q=restaurants&city=Montreal"]}>
        <Page />
      </MemoryRouter>));
      const first = requests[0];
      expect(first.url.pathname).toBe("/api/v1/browser/directory");
      expect(first.url.searchParams.get("city")).toBe("Montréal");
      expect(first.url.searchParams.get("q")).toBe("restaurants");
      expect(first.url.searchParams.getAll("match")).toEqual(["23455678-0000-4000-a000-000000000001"]);
      await act(async () => navigate("/search?category=restaurants&city=Laval"));
      const next = requests[1];
      expect(first.signal?.aborted).toBe(true);
      expect(next.url.searchParams.get("category")).toBe("restaurants");
      expect(next.url.searchParams.get("city")).toBe("Laval");
      await act(async () => next.reply([{ id: "new", name: "Laval result", city: "Laval" }]));
      await act(async () => first.reply([{ id: "old", name: "Stale result", city: "Montréal" }]));
      expect(host).toHaveTextContent("Laval result");
      expect(host).not.toHaveTextContent("Stale result");
      await act(async () => navigate("/search?category=restaurants&city=Laval&service=Offers+Delivery"));
      expect(host).not.toHaveTextContent("Laval result");
      expect(requests).toHaveLength(2);
      await act(async () => navigate("/search?category=restaurants&city=Laval"));
      expect(host).toHaveTextContent("Laval result");
    } finally {
      act(() => root.unmount());
      host.remove();
      requests.length = 0;
      vi.unstubAllGlobals();
    }
  });
});
