import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("QMAPS secondary merchant routes preserve authorized business context", () => {
  for (const name of [
    "MerchantMore", "MerchantOptimization",
    "MerchantServiceSetup", "MerchantSponsored",
  ]) {
    it(`${name} scopes selection to signed-in owner`, () => {
      const code = readFileSync(resolve(process.cwd(), `src/pages/${name}.tsx`), "utf8");
      expect(code).toContain('eq("owner_user_id", user.id)');
      expect(code).toContain("chooseMerchantBusiness(");
      expect(code).toContain("getSavedMerchantBusinessId(user.id)");
    });
  }

  it("keeps both inbox routes scoped through the shared owner selector", () => {
    const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
    expect(read("src/pages/MerchantMessages.tsx")).toContain('from "./MerchantInbox"');
    expect(read("src/pages/MerchantInbox.tsx")).toContain("OwnedBusinessPanel");
    expect(read("src/components/merchant/OwnedBusinessPanel.tsx")).toContain('.eq("owner_user_id", userId)');
  });

  it("persists explicit switches for service setup and sponsored campaigns", () => {
    for (const name of ["MerchantServiceSetup", "MerchantSponsored"]) {
      const code = readFileSync(resolve(process.cwd(), `src/pages/${name}.tsx`), "utf8");
      expect(code).toContain("saveMerchantBusinessId(user.id, id)");
      expect(code).toContain("businesses.some((business) => business.id === id)");
    }
  });
});
