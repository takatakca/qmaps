import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MerchantBilling from "@/pages/MerchantBilling";
import MerchantDashboard from "@/pages/MerchantDashboard";

const fixtures = vi.hoisted(() => ({ status: "canceled", user: { id: "qa-owner" }, toast: vi.fn() }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: fixtures.user, loading: false }) }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: fixtures.toast }) }));
vi.mock("@/components/MerchantBottomNav", () => ({ default: () => null }));
vi.mock("@/components/merchant/MerchantOverview", () => ({ default: () => null }));
vi.mock("@/lib/reviewsWithAuthors", () => ({ fetchReviewsWithAuthors: async () => [] }));
vi.mock("@/hooks/useMerchantSubscription", () => ({
  useMerchantSubscription: () => ({
    plan: "pro", status: fixtures.status, isFree: false, loading: false, error: null,
    subscription: {
      provider_customer_id: "cus_qa", current_period_end: "2030-04-30T00:00:00Z", cancel_at_period_end: true,
    },
  }),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => ({ select: () => ({ eq: () => ({ order: () => table === "businesses"
      ? Promise.resolve({ data: [{ id: "qa-business", name: "Commerce de recette", city: "Laval" }], error: null })
      : { limit: async () => ({ data: [
        { id: "qa-event", event_type: "customer.subscription.deleted", created_at: "2030-04-12T00:00:00Z" },
      ], error: null }) },
    }) }) }),
  },
}));

let host: HTMLDivElement;
let root: Root;
async function open(path: string) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => {
    root.render(<MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/merchant" element={<MerchantDashboard />} />
        <Route path="/merchant/billing" element={<MerchantBilling />} />
      </Routes>
    </MemoryRouter>);
  });
}

describe("merchant subscription cancellation display", () => {
  beforeEach(() => {
    fixtures.status = "canceled";
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  });
  afterEach(() => {
    act(() => root?.unmount());
    host?.remove();
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it("keeps the previous tier, history and portal without implying an active period", async () => {
    await open("/merchant/billing");

    expect(host.textContent).toContain("Dernier abonnement");
    expect(host.textContent).toContain("ProAnnulé");
    expect(host.textContent).not.toContain("Période en cours");
    expect(host.textContent).toContain("Gérer l'abonnement");
    expect(host.textContent).toContain("customer.subscription.deleted");
  });

  it("keeps the current period visible when cancellation is only scheduled", async () => {
    fixtures.status = "active";
    await open("/merchant/billing");

    expect(host.textContent).toContain("Plan actuel");
    expect(host.textContent).toContain("Période en cours");
    expect(host.textContent).toContain("annulation prévue");
  });

  it("routes the dashboard's inactive subscription back to billing history", async () => {
    await open("/merchant");
    const button = Array.from(host.querySelectorAll("button"))
      .find(item => item.textContent?.includes("Abonnement inactif"));

    expect(button).toBeDefined();
    await act(async () => { button?.click(); });
    expect(host.querySelector("h1")?.textContent).toBe("Facturation");
  });
});
