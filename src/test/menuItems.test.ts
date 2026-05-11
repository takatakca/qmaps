import { describe, expect, it } from "vitest";
import {
  DEFAULT_CATEGORY_LABEL,
  filterAvailableMenuItems,
  formatPriceCents,
  groupMenuItemsByCategory,
  normalizeMenuCategory,
  sortMenuItems,
  type MenuItem,
} from "@/lib/menuItems";

const item = (over: Partial<MenuItem>): MenuItem => ({
  id: over.id ?? Math.random().toString(36).slice(2),
  business_id: "b1",
  name: "Item",
  ...over,
});

describe("menuItems helpers", () => {
  it("formats CAD price from cents", () => {
    const out = formatPriceCents(1299, "CAD");
    expect(out).toMatch(/12,99/);
  });

  it("returns empty string for null price", () => {
    expect(formatPriceCents(null)).toBe("");
    expect(formatPriceCents(undefined)).toBe("");
  });

  it("normalizes empty/blank category to Autres", () => {
    expect(normalizeMenuCategory(null)).toBe(DEFAULT_CATEGORY_LABEL);
    expect(normalizeMenuCategory("  ")).toBe(DEFAULT_CATEGORY_LABEL);
    expect(normalizeMenuCategory("Boissons")).toBe("Boissons");
  });

  it("sorts by category then sort_order then name", () => {
    const items = [
      item({ name: "B", category: "Plats", sort_order: 2 }),
      item({ name: "A", category: "Plats", sort_order: 2 }),
      item({ name: "C", category: "Plats", sort_order: 1 }),
      item({ name: "Z", category: null }),
    ];
    const sorted = sortMenuItems(items).map((i) => i.name);
    expect(sorted).toEqual(["Z", "C", "A", "B"]);
  });

  it("filters unavailable items", () => {
    const items = [item({ is_available: true }), item({ is_available: false })];
    expect(filterAvailableMenuItems(items)).toHaveLength(1);
  });

  it("groups by category and puts blank under Autres", () => {
    const items = [
      item({ name: "X", category: "" }),
      item({ name: "Y", category: "Plats" }),
    ];
    const grouped = groupMenuItemsByCategory(items);
    const cats = grouped.map((g) => g.category);
    expect(cats).toContain(DEFAULT_CATEGORY_LABEL);
    expect(cats).toContain("Plats");
  });
});
