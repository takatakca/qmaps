import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf-8");

describe("Phase 3 — vitrine edit modals", () => {
  it("EditCategoryModal persists toggles via business_categories insert + delete", () => {
    const src = read("src/components/merchant/info/EditCategoryModal.tsx");
    expect(src).toMatch(/from\("business_categories"\)\s*\.delete\(\)/);
    expect(src).toMatch(/from\("business_categories"\)\s*\.insert\(/);
    // Save must compute a diff and be disabled when nothing changed.
    expect(src).toContain("disabled={saving || !dirty}");
    // Loading state must exist so editor doesn't render an empty list while fetching.
    expect(src).toContain("Chargement...");
  });

  it("EditBasicInfoModal no longer renders a fake unsaved menu link input", () => {
    const src = read("src/components/merchant/info/EditBasicInfoModal.tsx");
    expect(src).not.toMatch(/menuLink/);
    expect(src).toContain('navigate("/merchant/menu")');
    // Save button must be disable-able while writing.
    expect(src).toContain("disabled={saving}");
  });

  it("EditHistoryModal does not silently drop merchant input", () => {
    const src = read("src/components/merchant/info/EditHistoryModal.tsx");
    // Old version had a useState<text>(...) + handleSave that wrote nothing.
    // The honest stub must NOT include a Textarea or year Input that pretends to save.
    expect(src).not.toMatch(/Textarea/);
    expect(src).not.toMatch(/setHistory/);
    expect(src).toContain("Bientôt disponible");
  });

  it("MerchantMarketplace shows real business.hours instead of hardcoded 9:00 - 17:00", () => {
    const src = read("src/pages/MerchantMarketplace.tsx");
    expect(src).not.toMatch(/Ouvert 24 heures/);
    expect(src).not.toMatch(/9:00 - 17:00/);
    expect(src).toContain("business.hours");
  });

  it("MerchantMarketplace photo/cover upload surfaces DB update errors", () => {
    const src = read("src/pages/MerchantMarketplace.tsx");
    expect(src).toMatch(/error: updateErr[\s\S]+update\(\{\s*photos:/);
    expect(src).toMatch(/error: updateErr[\s\S]+update\(\{\s*image_url:/);
  });
});
