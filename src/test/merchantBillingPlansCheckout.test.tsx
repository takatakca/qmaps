import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSavedMerchantBusinessId } from "@/lib/merchantSelection";
import MerchantBillingPlans from "@/pages/MerchantBillingPlans";

const fixtures = vi.hoisted(() => ({ invoke: vi.fn(), toast: vi.fn(), status: "active", user: { id: "qa-owner" } }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: fixtures.user, loading: false }) }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: fixtures.toast }) }));
vi.mock("@/hooks/useMerchantSubscription", () => ({
  useMerchantSubscription: () => ({ plan: "starter", status: fixtures.status, loading: false, error: null }),
}));
vi.mock("@/components/Seo", () => ({ default: () => null }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: async () => ({ data: [{ id: "qa-business", name: "QA commerce" }] }) }) }),
    functions: { invoke: fixtures.invoke },
  },
}));

let host: HTMLDivElement;
let root: Root;
async function openPlans() {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => {
    root.render(<MemoryRouter initialEntries={["/merchant/billing/plans"]}>
      <Routes>
        <Route path="/merchant/billing/plans" element={<MerchantBillingPlans />} />
        <Route path="/merchant/billing" element={<h1>Facturation du commerce</h1>} />
      </Routes>
    </MemoryRouter>);
  });
}

async function chooseFirstAvailablePlan() {
  const button = Array.from(host.querySelectorAll("button"))
    .find(item => item.textContent === "Choisir ce plan" && !item.disabled);
  expect(button).toBeDefined();
  await act(async () => { button?.click(); });
}

describe("merchant plans Checkout conflicts", () => {
  beforeEach(() => {
    fixtures.status = "active";
    fixtures.invoke.mockReset();
    fixtures.toast.mockReset();
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  });
  afterEach(() => {
    act(() => root?.unmount());
    host?.remove();
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it("returns to the billing page instead of opening Checkout for a second subscription", async () => {
    fixtures.invoke.mockResolvedValue({ data: null, error: {
      context: Response.json({ error: "subscription_exists" }, { status: 409 }),
    } });
    await openPlans();
    await chooseFirstAvailablePlan();

    expect(host.querySelector("h1")?.textContent).toBe("Facturation du commerce");
    expect(getSavedMerchantBusinessId(fixtures.user.id)).toBe("qa-business");
    expect(fixtures.invoke).toHaveBeenCalledWith("create-merchant-checkout-session", {
      body: { business_id: "qa-business", plan: "pro" },
    });
    expect(fixtures.toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Abonnement existant" }));
  });

  it("allows the canceled plan to be selected for server verification", async () => {
    fixtures.status = "canceled";
    fixtures.invoke.mockResolvedValue({ data: { error: "provider_not_configured" }, error: null });
    await openPlans();
    await chooseFirstAvailablePlan();

    expect(fixtures.invoke).toHaveBeenCalledWith("create-merchant-checkout-session", {
      body: { business_id: "qa-business", plan: "starter" },
    });
  });
});
