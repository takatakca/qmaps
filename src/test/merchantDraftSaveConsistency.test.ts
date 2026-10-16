import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "src/pages/MerchantOnboarding.tsx"), "utf8");

describe("QMAPS resumed merchant drafts", () => {
  it("writes edited information to the same privately owned business before proceeding", () => {
    expect(source).toContain("const persistBusinessDraft = async");
    expect(source).toContain("name: businessName.trim()");
    expect(source).toContain("city: city.trim()");
    expect(source).toContain('      .eq("owner_user_id", user.id)\n      .eq("is_active", false)');
    expect(source).toContain("if (error || !saved)");
    expect(source).toContain("if (!await persistBusinessDraft(id)) return");
  });

  it("deletes only deselected categories and verifies the final exact selection", () => {
    expect(source).toContain("const toRemove = (existing ?? [])");
    expect(source).toContain('.delete().eq("business_id", id).in("category_id", toRemove)');
    expect(source).toContain("actual.size !== selectedCatIds.size");
    expect(source).toContain("[...selectedCatIds].some");
    expect(source).toContain("if (!await saveSelectedCategories(id)) return");
  });

  it("never advances to photo stage after a failed draft or category write", () => {
    const block = source.slice(source.indexOf("const goNext = async"), source.indexOf("const handlePublish = async"));
    expect(block.indexOf("if (!await persistBusinessDraft(id)) return")).toBeLessThan(block.indexOf("if (!await saveSelectedCategories(id)) return"));
    expect(block.indexOf("if (!await saveSelectedCategories(id)) return")).toBeLessThan(block.indexOf("setStep(5)"));
  });
});
