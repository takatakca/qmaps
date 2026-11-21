import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import MerchantContentEditor from "@/components/merchant/MerchantContentEditor";
import BusinessContentFeed from "@/components/business/BusinessContentFeed";
import type { BusinessContent } from "@/lib/businessContent";

const db = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "owner" } }),
}));
vi.mock("@/integrations/supabase/client", async () => {
  const { createClient } = await import("@supabase/supabase-js");
  return {
    supabase: createClient("https://test.invalid", "test-key", {
      auth: { persistSession: false },
      global: { fetch: db.fetch },
    }),
  };
});

let root: Root;
let host: HTMLDivElement;
let cache: QueryClient;
let stored: BusinessContent[];
let refuse: boolean;
const button = (label: string) =>
  Array.from(host.querySelectorAll("button")).find(
    (b) => b.textContent === label,
  );

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  cache = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  stored = [];
  refuse = false;
  db.fetch
    .mockReset()
    .mockImplementation(async (raw: string, init: RequestInit) => {
      const url = new URL(raw);
      const json = (body: unknown, status = 200) =>
        new Response(JSON.stringify(body), {
          status,
          headers: { "content-type": "application/json" },
        });
      if (url.pathname.endsWith("/businesses"))
        return json([{ id: "shop", name: "Commerce démo", is_active: true }]);
      if (!url.pathname.endsWith("/business_content"))
        throw new Error("Unexpected endpoint");
      if (init.method === "POST") {
        if (refuse) return json({ code: "42501", message: "Denied" }, 403);
        const row = JSON.parse(String(init.body));
        stored.push({ ...row, created_at: "2026-11-21T00:00:00Z" });
        return json({ id: row.id }, 201);
      }
      const rows = stored.filter(
        (r) =>
          "eq." + r.kind === url.searchParams.get("kind") &&
          (!url.searchParams.has("is_published") || r.is_published),
      );
      return json(rows);
    });
});
afterEach(async () => {
  await act(async () => root.unmount());
  cache.clear();
  host.remove();
  vi.unstubAllGlobals();
});
async function render(element: React.ReactNode) {
  await act(async () =>
    root.render(
      <MemoryRouter>
        <QueryClientProvider client={cache}>{element}</QueryClientProvider>
      </MemoryRouter>,
    ),
  );
}
async function click(el: HTMLElement) {
  await act(async () => el.click());
}
async function input(el: HTMLInputElement, value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function showForm() {
  await render(<MerchantContentEditor kind="action" />);
  await vi.waitFor(() => expect(button("Créer le bouton")).toBeDefined());
  await click(button("Créer le bouton")!);
  await input(
    host.querySelector('input:not([type="url"]):not([type="checkbox"])')!,
    "Voir le menu",
  );
  await input(
    host.querySelector('input[type="url"]')!,
    "https://example.ca/menu",
  );
  await click(host.querySelector('input[type="checkbox"]')!);
}
it("publishes a merchant action and renders its saved destination on the consumer listing", async () => {
  await showForm();
  await click(button("Enregistrer")!);
  await vi.waitFor(() =>
    expect(host.textContent).toContain("Publication enregistrée."),
  );
  expect(stored).toHaveLength(1);
  expect(stored[0]).toMatchObject({
    business_id: "shop",
    is_published: true,
    title: "Voir le menu",
  });
  await render(<BusinessContentFeed businessId="shop" />);
  await vi.waitFor(() =>
    expect(host.querySelector("a")?.href).toBe("https://example.ca/menu"),
  );
});
it("keeps the merchant draft and reports a refused save", async () => {
  await showForm();
  refuse = true;
  await click(button("Enregistrer")!);
  await vi.waitFor(() =>
    expect(host.querySelector('[role="alert"]')?.textContent).toContain(
      "Enregistrement impossible",
    ),
  );
  expect(host.querySelector<HTMLInputElement>('input[type="url"]')?.value).toBe(
    "https://example.ca/menu",
  );
  expect(stored).toHaveLength(0);
});
