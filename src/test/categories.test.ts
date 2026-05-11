import { describe, it, expect } from "vitest";
import {
  slugifyCategoryName,
  normalizeCategoryInput,
  validateCategoryInput,
  sortCategories,
  buildCategoryTree,
} from "@/lib/categories";

describe("categories", () => {
  it("slugifies names", () => {
    expect(slugifyCategoryName("Café & Bistro")).toBe("cafe-bistro");
    expect(slugifyCategoryName("  Hôtel  ")).toBe("hotel");
  });

  it("normalizes input and generates slug from name", () => {
    const n = normalizeCategoryInput({ name: "Plombier" });
    expect(n.slug).toBe("plombier");
    expect(n.is_active).toBe(true);
    expect(n.category_type).toBe("business");
  });

  it("rejects empty name", () => {
    expect(validateCategoryInput({ name: "" }).ok).toBe(false);
  });

  it("rejects self parent", () => {
    const v = validateCategoryInput({ name: "X", parent_id: "abc" }, { id: "abc" });
    expect(v.ok).toBe(false);
  });

  it("rejects invalid slug", () => {
    expect(validateCategoryInput({ name: "X", slug: "Not Valid!" }).ok).toBe(false);
  });

  it("sorts by sort_order then name", () => {
    const sorted = sortCategories([
      { name: "B", sort_order: 1 },
      { name: "A", sort_order: 1 },
      { name: "C", sort_order: 0 },
    ]);
    expect(sorted.map((s) => s.name)).toEqual(["C", "A", "B"]);
  });

  it("builds a tree", () => {
    const tree = buildCategoryTree([
      { id: "1", name: "Root", slug: "r", parent_id: null },
      { id: "2", name: "Child", slug: "c", parent_id: "1" },
      { id: "3", name: "Other", slug: "o", parent_id: null },
    ]);
    expect(tree).toHaveLength(2);
    const root = tree.find((t) => t.category.id === "1")!;
    expect(root.children[0].category.id).toBe("2");
  });
});
