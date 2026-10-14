import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Merchant onboarding draft entitlement verification", () => {
  const source = readFileSync(resolve(process.cwd(), "src/pages/MerchantOnboarding.tsx"), "utf8");
  it("verifies merchant entitlements before making recovered drafts public", () => {
    const begin = source.indexOf("const handlePublish = async");
    const end = source.indexOf("if (authLoading || checkingExisting)");
    const section = source.slice(begin, end);
    expect(section).toContain('upsert(\n      { user_id: user.id, role: "merchant" }');
    expect(section).toContain("if (entitlementError)");
    expect(section).toContain("await refreshRoles()");
    expect(section.indexOf("await refreshRoles()")).toBeLessThan(section.indexOf(".update({ is_active: true })"));
  });
});
