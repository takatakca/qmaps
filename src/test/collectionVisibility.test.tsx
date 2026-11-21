import { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";
import { useCollections } from "@/hooks/useCollections";

const state = vi.hoisted(() => ({ userId: null as string | null, calls: [] as URL[] }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: state.userId ? { id: state.userId } : null }) }));
vi.mock("@/integrations/supabase/client", async () => {
  const { createClient } = await import("@supabase/supabase-js");
  return { supabase: createClient("https://qmaps.example", "test", {
    auth: { persistSession: false },
    global: { fetch: async (input, init) => {
      expect(init?.method).toBe("GET");
      const url = new URL(String(input));
      state.calls.push(url);
      const publicOnly = url.searchParams.get("is_public") === "eq.true";
      const isBookmark = url.pathname.endsWith("/bookmarks");
      const data = isBookmark ? [] : [{ id: "list", name: publicOnly ? "Liste publique" : "Liste personnelle",
        collection_items: [{ count: 17 }], preview: [], is_public: publicOnly }];
      return new Response(JSON.stringify(data), { headers: { "content-type": "application/json", "content-range": "0-0/26" } });
    } },
  }) };
});

it("loads only public collections for signed-out visitors and scopes the saved count to the account", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const element = document.createElement("div");
  const root = createRoot(element);
  function Summary() {
    const { loading, bookmarkCount, customCollections, publicCollections } = useCollections();
    if (loading) return <p>Chargement</p>;
    return <p>{publicCollections[0]?.name} {publicCollections[0]?.items_count} {customCollections[0]?.name} {bookmarkCount}</p>;
  }
  async function render() {
    await act(async () => root.render(<QueryClientProvider client={client}><Summary /></QueryClientProvider>));
    await vi.waitFor(async () => {
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
      expect(element.textContent).not.toContain("Chargement");
    });
  }
  try {
    await render();
    expect(element.textContent).toContain("Liste publique 17");
    expect(state.calls).toHaveLength(1);
    expect(state.calls[0].searchParams.get("is_public")).toBe("eq.true");
    state.userId = "test-client";
    await render();
    expect(element.textContent).toContain("Liste personnelle 26");
    const bookmark = state.calls.find(url => url.pathname.endsWith("/bookmarks"));
    expect(bookmark?.searchParams.get("user_id")).toBe("eq.test-client");
    expect(bookmark?.searchParams.get("list_name")).toBe("eq.saved");
    state.userId = null;
    await render();
    expect(element.textContent).not.toContain("Liste personnelle");
  } finally {
    act(() => root.unmount());
    client.clear();
    state.userId = null;
    state.calls.length = 0;
    vi.unstubAllGlobals();
  }
});
