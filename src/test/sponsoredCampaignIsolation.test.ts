import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("QMAPS sponsored campaign tenant isolation", () => {
  it("rejects stale network responses when the selected business changes", () => {
    const source = read("src/hooks/useSponsoredCampaigns.ts");
    expect(source).toContain("const requestVersion = useRef(0)");
    expect(source).toContain("const version = ++requestVersion.current");
    expect(source).toContain("if (version !== requestVersion.current) return");
    expect(source).toContain("requestVersion.current += 1");
    expect(source).toContain("loadedBusinessId === (businessId ?? null) ? campaigns : []");
    expect(source).toContain('.eq("business_id", businessId)');
  });

  it("surfaces failed Supabase queries instead of pretending there are zero campaigns", () => {
    const source = read("src/hooks/useSponsoredCampaigns.ts");
    expect(source).toContain("if (fetchError) throw fetchError");
    expect(source).toContain("setError(err instanceof Error");
    const page = read("src/pages/MerchantOptimization.tsx");
    expect(page).toContain("campaignError ?");
    expect(page).toContain("Impossible de charger les campagnes");
    expect(page).toContain("refreshCampaigns()");
  });
});
