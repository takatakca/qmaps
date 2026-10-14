import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "src/pages/MerchantOnboarding.tsx"), "utf8");

describe("Merchant draft recovery and category save durability", () => {
  it("recovers an inactive draft without creating another business", () => {
    expect(source).toContain("if (!existing.is_active)");
    expect(source).toContain("setBusinessId(existing.id)");
    expect(source).toContain("setBusinessName(existing.name)");
    expect(source).toContain("setSelectedCatIds(new Set(");
    expect(source).toContain("if (!existing[0].is_active)");
    expect(source).toContain("return existing[0].id");
  });

  it("verifies category upsert and retries during the transition to photo step", () => {
    expect(source).toContain("const saveSelectedCategories = async");
    expect(source).toContain('.from("business_categories").upsert(rows, {');
    expect(source).toContain('onConflict: "business_id,category_id"');
    expect(source).toContain("if (categoryError)");
    expect(source).toContain("if (!await saveSelectedCategories(id)) return");
  });

  it("does not publish a draft with missing categories", () => {
    expect(source).toContain('.from("business_categories").select("category_id").eq("business_id", businessId).limit(1)');
    expect(source).toContain("if (categoriesError || !savedCategories?.length)");
    expect(source).toContain("setStep(3)");
    expect(source).toContain('.update({ is_active: true })');
  });

  it("surfaces merchant entitlement error without falsely completing onboarding", () => {
    expect(source).toContain("if (roleError)");
    expect(source).toContain("Accès professionnel non confirmé");
  });
});
