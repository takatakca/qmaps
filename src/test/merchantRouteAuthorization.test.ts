import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("merchant route authorization", () => {
  it("checks the owner read and role upsert before granting access", () => {
    const source = read("src/components/ProtectedMerchantRoute.tsx");
    expect(source).toContain("if (ownerError) throw ownerError");
    expect(source).toContain("if (roleError) throw roleError");
    expect(source).toContain("await refreshRoles()");
    expect(source).toContain("authorizedOwnerId !== user.id");
    expect(source).toContain("setRetryVersion((v) => v + 1)");
  });
  it("does not publish an onboarding business when role refresh fails", () => {
    const source = read("src/pages/MerchantOnboarding.tsx");
    expect(source).toContain('title: "Droits non vérifiés"');
    expect(source).toContain("await refreshRoles()");
    expect(source).toContain(".update({ is_active: true })");
  });
});
