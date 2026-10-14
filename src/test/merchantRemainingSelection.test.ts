import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("QMAPS secondary merchant routes preserve authorized business context", () => {
  for (const name of [
    "MerchantInbox", "MerchantMessages", "MerchantMore", "MerchantOptimization",
    "MerchantServiceSetup", "MerchantSponsored",
  ]) {
    it(`${name} scopes selection to signed-in owner`, () => {
      const code = readFileSync(resolve(process.cwd(), `src/pages/${name}.tsx`), "utf8");
      expect(code).toContain('eq("owner_user_id", user.id)');
      expect(code).toContain("chooseMerchantBusiness(");
      expect(code).toContain("getSavedMerchantBusinessId(user.id)");
    });
  }

  it("persists explicit switches for service setup and sponsored campaigns", () => {
    for (const name of ["MerchantServiceSetup", "MerchantSponsored"]) {
      const code = readFileSync(resolve(process.cwd(), `src/pages/${name}.tsx`), "utf8");
      expect(code).toContain("saveMerchantBusinessId(user.id, id)");
      expect(code).toContain("businesses.some((business) => business.id === id)");
    }
  });
});
