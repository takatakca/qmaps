import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("QMAPS optimization is data-backed, not a mock ad purchase", () => {
  const source = readFileSync(resolve(process.cwd(), "src/pages/MerchantOptimization.tsx"), "utf8");

  it("loads only owned businesses and real sponsored campaign records", () => {
    expect(source).toContain('.eq("owner_user_id", user.id)');
    expect(source).toContain("chooseMerchantBusiness(data ?? [], getSavedMerchantBusinessId(user.id))");
    expect(source).toContain("useSponsoredCampaigns(business?.id ?? null)");
    expect(source).toContain("SPONSORED_STATUS_LABELS[campaign.status]");
  });

  it("opens the real campaign, analytics and billing screens", () => {
    for (const path of ["/merchant/sponsored", "/merchant/analytics", "/merchant/billing/plans"]) {
      expect(source).toContain(`navigate("${path}")`);
    }
  });

  it("never fabricates paid packages, active campaigns or performance results", () => {
    for (const token of ["estimatedClicks", "estimatedLeads", "campaignPublished", "CA$12/jour", "CA$5/jour", "Publier la campagne"]) {
      expect(source).not.toContain(token);
    }
    expect(source).toContain("Aucun clic,");
  });
});
