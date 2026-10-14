import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Merchant onboarding publication integrity", () => {
  const file = readFileSync(resolve(process.cwd(), "src/pages/MerchantOnboarding.tsx"), "utf8");

  it("keeps pre-publication drafts invisible to public search", () => {
    expect(file).toContain("is_active: false");
    expect(file).toContain("is_claimed: false");
  });

  it("publishes only the newly-created business owned by the signed-in user", () => {
    expect(file).toContain('.update({ is_active: true })');
    expect(file).toContain('.eq("id", businessId)');
    expect(file).toContain('.eq("owner_user_id", user.id)');
    expect(file).toContain("error || !published");
  });

  it("never announces success before a successful database write", () => {
    const fn = file.slice(file.indexOf("const handlePublish = async"), file.indexOf("if (authLoading || checkingExisting)"));
    expect(fn.indexOf("if (error || !published)")).toBeGreaterThan(-1);
    expect(fn.indexOf('toast({ title: "Profil publié!"')).toBeGreaterThan(fn.indexOf("if (error || !published)"));
  });
});
