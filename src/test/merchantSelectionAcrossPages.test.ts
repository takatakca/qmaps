import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { chooseMerchantBusiness, merchantBusinessPreferenceKey } from "@/lib/merchantSelection";

const root = resolve(process.cwd());
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const routes = [
  "src/pages/MerchantBusinessInfo.tsx",
  "src/pages/MerchantPhotos.tsx",
  "src/pages/MerchantMenu.tsx",
  "src/pages/MerchantAds.tsx",
  "src/pages/MerchantBilling.tsx",
  "src/pages/MerchantBillingPlans.tsx",
  "src/pages/MerchantMarketplace.tsx",
  "src/pages/MerchantHome.tsx",
  "src/pages/MerchantAnalytics.tsx",
];

describe("QMAPS merchant identity-scoped selection across routes", () => {
  it("namespaces the preference by authenticated owner", () => {
    expect(merchantBusinessPreferenceKey("owner-a")).not.toBe(merchantBusinessPreferenceKey("owner-b"));
  });

  it("never accepts a stored business not present in the server-verified owned rows", () => {
    const owned = [{ id: "owner-a-business" }, { id: "owner-a-second" }];
    expect(chooseMerchantBusiness(owned, "other-owner-business")?.id).toBe("owner-a-business");
    expect(chooseMerchantBusiness(owned, "owner-a-second")?.id).toBe("owner-a-second");
    expect(chooseMerchantBusiness([], "owner-a-second")).toBeNull();
  });

  it("forces server-side owner filtering before consuming selected IDs on every affected page", () => {
    for (const path of routes) {
      const code = read(path);
      expect(code, path).toContain('.eq("owner_user_id", user.id)');
      expect(code, path).toContain("getSavedMerchantBusinessId(user.id)");
      expect(code, path).toContain("chooseMerchantBusiness(");
    }
  });

  it("persists dashboard and payment-plan selections only after owned rows are checked", () => {
    const dashboard = read("src/pages/MerchantDashboard.tsx");
    const plans = read("src/pages/MerchantBillingPlans.tsx");
    expect(dashboard).toContain("saveMerchantBusinessId(user.id, selectedBiz.id)");
    expect(plans).toContain("saveMerchantBusinessId(user.id, b.id)");
    expect(dashboard).toContain("businesses.find((business) => business.id === businessId)");
  });
});
