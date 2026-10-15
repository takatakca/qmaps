import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("merchant subscription request and UI isolation contract", () => {
  const hook = read("src/hooks/useMerchantSubscription.ts");
  const billing = read("src/pages/MerchantBilling.tsx");
  const plans = read("src/pages/MerchantBillingPlans.tsx");

  it("invalidates obsolete requests and compares the business ID at render time", () => {
    expect(hook).toContain("requestVersion.current");
    expect(hook).toContain("selectedIdRef.current !== id");
    expect(hook).toContain("const matches = state.businessId === selectedId");
    expect(hook).toContain("const subscription = matches ? state.subscription : null");
    expect(hook).toContain("requestVersion.current += 1");
  });

  it("exposes subscription read errors and blocks checkout until status is known", () => {
    expect(hook).toContain("error: error.message");
    expect(hook).toContain("error,");
    expect(plans).toContain("subLoading || subscriptionError");
    expect(plans).toContain("Boolean(subscriptionError)");
    expect(billing).toContain("subscriptionError ?");
  });

  it("removes invented billing dates and balances, with clear event-load failures", () => {
    expect(billing).not.toContain("1 avr. 2026");
    expect(billing).not.toContain("Aucun — 0,00 $");
    expect(billing).toContain("Fin de période enregistrée");
    expect(billing).toContain("setEventsError(error.message)");
    expect(billing).toContain("if (cancelled) return");
  });
});
