import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, useNavigate, type NavigateFunction } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Search from "@/pages/Search";

const requests = vi.hoisted(() => [] as { url: URL; reply: (rows: object[]) => void }[]);
vi.mock("@/integrations/supabase/client", async () => {
  const { createClient } = await import("@supabase/supabase-js");
  return { supabase: createClient("https://example.invalid", "test-key", {
    auth: { persistSession: false },
    global: { fetch: async input => new Promise<Response>(resolve => requests.push({
      url: new URL(String(input)),
      reply: rows => resolve(new Response(JSON.stringify(rows), { headers: { "Content-Type": "application/json" } })),
    })) },
  }) };
});
vi.mock("@/hooks/useAllCategories", () => {
  const categories = [{ id: "cat-1", slug: "restaurants", name: "Restaurants", parent_id: null }];
  return { useAllCategories: () => ({ categories, loading: false }), searchCategories: () => categories };
});
vi.mock("@/components/BusinessCard", () => ({ default: ({ business }: { business: { name: string } }) => <p>{business.name}</p> }));
vi.mock("@/components/BottomNav", () => ({ default: () => null }));
vi.mock("@/components/search/CategoryPickerDialog", () => ({ default: () => null }));
vi.mock("@/components/search/SearchFiltersSheet", () => ({ default: () => null }));

describe("directory search requests", () => {
  it("keeps the city on category matches and ignores late results after navigation", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
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
      expect(first.url.searchParams.get("is_active")).toBe("eq.true");
      expect(first.url.searchParams.getAll("or")).toEqual([
        '(city.ilike."Montréal",city.ilike."Montreal")',
        '(name.ilike."%restaurants%",city.ilike."%restaurants%",description.ilike."%restaurants%",matched.not.is.null)',
      ]);
      await act(async () => navigate("/search?category=restaurants&city=Laval"));
      const next = requests[1];
      expect(next.url.searchParams.get("matched")).toBe("not.is.null");
      expect(next.url.searchParams.get("or")).toContain('city.ilike."Laval"');
      await act(async () => next.reply([{ id: "new", name: "Laval result", city: "Laval" }]));
      await act(async () => first.reply([{ id: "old", name: "Stale result", city: "Montréal" }]));
      expect(host).toHaveTextContent("Laval result");
      expect(host).not.toHaveTextContent("Stale result");
    } finally {
      act(() => root.unmount());
      host.remove();
      requests.length = 0;
      vi.unstubAllGlobals();
    }
  });
});
