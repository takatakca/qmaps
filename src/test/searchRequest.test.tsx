import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, useNavigate, type NavigateFunction } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Search from "@/pages/Search";

const requests: {
  url: URL;
  signal?: AbortSignal | null;
  credentials?: RequestCredentials;
  reply: (rows: object[], next?: string | null) => void;
  fail: (status: number, error?: string) => void;
}[] = [];
vi.mock("@/integrations/supabase/client", async () => {
  const { createClient } = await import("@supabase/supabase-js");
  return { supabase: createClient("https://example.invalid", "test-key", {
    auth: { persistSession: false },
  }) };
});
vi.mock("@/hooks/useAllCategories", () => {
  const categories = [{ id: "23455678-0000-4000-a000-000000000001", slug: "restaurants", name: "Restaurants", parent_id: null }];
  return { useAllCategories: () => ({ categories, loading: false }), searchCategories: () => categories };
});
vi.mock("@/components/BusinessCard", () => ({
  default: ({ business }: { business: { name: string; isOpen: boolean } }) => <p data-open={business.isOpen}>{business.name}</p>,
}));
vi.mock("@/components/BottomNav", () => ({ default: () => null }));
vi.mock("@/components/search/CategoryPickerDialog", () => ({ default: () => null }));
vi.mock("@/components/search/SearchFiltersSheet", () => ({
  default: ({ open, onOpenNowChange }: { open: boolean; onOpenNowChange: (value: boolean) => void }) =>
    open ? <button onClick={() => onOpenNowChange(true)}>Ouvert maintenant</button> : null,
}));

const listing = (id: string, name: string) => ({ id, name, city: "Laval" });
let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

async function mount(path = "/search") {
  let navigate!: NavigateFunction;
  function Page() { navigate = useNavigate(); return <Search />; }
  await act(async () => root.render(<MemoryRouter initialEntries={[path]}><Page /></MemoryRouter>));
  return navigate;
}

async function click(label: string) {
  const button = [...host.querySelectorAll("button")].find(node => node.textContent?.trim() === label);
  expect(button, label).toBeDefined();
  await act(async () => button!.click());
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>(resolve => {
      function respond(body: object, status = 200) {
        resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));
      }
      requests.push({
        url: new URL(String(input), "https://qmaps.ca"),
        signal: init?.signal,
        credentials: init?.credentials,
        reply: (items, next = null) => respond({ items, next }),
        fail: (status, error) => respond({ error }, status),
      });
    }));
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  requests.length = 0;
  vi.unstubAllGlobals();
});

describe("directory search requests", () => {
  it("keeps the city on category matches and ignores late results after navigation", async () => {
    const navigate = await mount("/search?q=restaurants&city=Montreal");
    const first = requests[0];
    expect(first.url.pathname).toBe("/api/v1/browser/directory/results");
    expect(first.url.searchParams.get("limit")).toBe("24");
    expect(first.url.searchParams.get("city")).toBe("Montréal");
    expect(first.url.searchParams.get("q")).toBe("restaurants");
    expect(first.url.searchParams.getAll("match")).toEqual(["23455678-0000-4000-a000-000000000001"]);
    expect(first.url.searchParams.has("lat")).toBe(false);
    await act(async () => navigate("/search?category=restaurants&city=Laval"));
    const next = requests[1];
    expect(first.signal?.aborted).toBe(true);
    expect(next.url.searchParams.get("category")).toBe("restaurants");
    expect(next.url.searchParams.get("city")).toBe("Laval");
    await act(async () => next.reply([listing("new", "Laval result")], "old-scope"));
    await act(async () => first.reply([listing("old", "Stale result")]));
    expect(host).toHaveTextContent("Laval result");
    expect(host).not.toHaveTextContent("Stale result");
    await act(async () => navigate("/search?category=restaurants&city=Laval&service=Offers+Delivery"));
    expect(host).not.toHaveTextContent("Laval result");
    expect(requests).toHaveLength(3);
    expect(requests[2].url.searchParams.getAll("service")).toEqual(["Offers Delivery"]);
    expect(requests[2].url.searchParams.has("after")).toBe(false);
    await act(async () => requests[2].reply([listing("delivery", "Laval delivery")]));
    expect(host).toHaveTextContent("Laval delivery");
  });

  it("loads another page only when asked, retries in place and deduplicates reappearing listings", async () => {
    await mount("/search?city=Laval");
    const pageOne = listing("one", "Premier commerce");
    await act(async () => requests[0].reply([pageOne], "continue-1"));
    expect(host).toHaveTextContent("1 résultat affiché");
    expect(requests).toHaveLength(1);
    await click("Voir plus de résultats");
    expect(requests[1].url.searchParams.get("after")).toBe("continue-1");
    expect(requests[1].url.searchParams.get("city")).toBe("Laval");
    await act(async () => requests[1].fail(503));
    expect(host).toHaveTextContent("Premier commerce");
    await click("Réessayer de charger la suite");
    expect(requests[2].url.searchParams.get("after")).toBe("continue-1");
    await act(async () => requests[2].reply([pageOne, listing("two", "Deuxième commerce")]));
    expect(host).toHaveTextContent("2 résultats affichés");
    expect([...host.querySelectorAll("p")].filter(p => p.textContent === "Premier commerce")).toHaveLength(1);
    expect(host).toHaveTextContent("Deuxième commerce");
    expect(host).not.toHaveTextContent("Voir plus de résultats");
  });

  it("does not show the final empty state while the server has more candidates", async () => {
    await mount("/search?service=Offers+Delivery");
    await act(async () => requests[0].reply([], "later"));
    expect(host).toHaveTextContent("D’autres fiches sont à vérifier");
    expect(host).not.toHaveTextContent("Aucun résultat trouvé");
    await click("Voir plus de résultats");
    await act(async () => requests[1].reply([]));
    expect(host).toHaveTextContent("Aucun résultat trouvé");
  });

  it("presents the server-confirmed open status rather than recomputing it against the device timezone", async () => {
    await mount();
    const business = { ...listing("open", "Commerce ouvert"), status: "open", is_open: false };
    await act(async () => requests[0].reply([business]));
    expect(host.querySelector("p[data-open]")).toHaveAttribute("data-open", "false");
    await click("Filtres");
    await click("Ouvert maintenant");
    expect(requests[1].url.searchParams.get("open")).toBe("1");
    await act(async () => requests[1].reply([business]));
    expect(host.querySelector("p[data-open]")).toHaveAttribute("data-open", "true");
  });

  it.each([401, 409])("never appends guest rows when a session continuation returns %s", async status => {
    await mount();
    await act(async () => requests[0].reply([listing("private", "Session listing")], "session-cursor"));
    await click("Voir plus de résultats");
    expect(requests[1].credentials).toBe("same-origin");
    await act(async () => requests[1].fail(status, status === 401 ? "Session expirée" : "Curseur périmé"));
    expect(requests).toHaveLength(2);
    expect(host).not.toHaveTextContent("Session listing");
    await click("Relancer la recherche");
    expect(requests[2].url.searchParams.has("after")).toBe(false);
    expect(requests[2].credentials).toBe("same-origin");
  });

  it("keeps guest credentials on continuations when the initial session is explicitly rejected", async () => {
    await mount();
    await act(async () => requests[0].fail(401, "Session invalide"));
    expect(requests[1].credentials).toBe("omit");
    expect(requests[1].url.searchParams.has("after")).toBe(false);
    await act(async () => requests[1].reply([listing("public", "Guest listing")], "guest-cursor"));
    await click("Voir plus de résultats");
    expect(requests[2].credentials).toBe("omit");
    expect(requests[2].url.searchParams.get("after")).toBe("guest-cursor");
    await act(async () => requests[2].reply([]));
    expect(host).toHaveTextContent("Guest listing");
  });
});
