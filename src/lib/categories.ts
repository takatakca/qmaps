export interface CategoryInput {
  name: string;
  slug?: string | null;
  parent_id?: string | null;
  icon?: string | null;
  is_active?: boolean;
  sort_order?: number;
  category_type?: string;
}

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  icon?: string | null;
  is_active?: boolean;
  sort_order?: number;
  category_type?: string;
}

export function slugifyCategoryName(name: string): string {
  return (name || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function normalizeCategoryInput(input: CategoryInput): CategoryInput {
  const name = (input.name ?? "").trim();
  const slugRaw = (input.slug ?? "").trim();
  const slug = slugRaw ? slugifyCategoryName(slugRaw) : slugifyCategoryName(name);
  return {
    name,
    slug,
    parent_id: input.parent_id || null,
    icon: input.icon?.trim() || null,
    is_active: input.is_active ?? true,
    sort_order: Number.isFinite(input.sort_order as number) ? Number(input.sort_order) : 0,
    category_type: input.category_type || "business",
  };
}

export interface CategoryValidationResult {
  ok: boolean;
  errors: string[];
}

export function validateCategoryInput(
  input: CategoryInput,
  context?: { id?: string },
): CategoryValidationResult {
  const errors: string[] = [];
  const n = (input.name ?? "").trim();
  if (!n) errors.push("Le nom est requis.");
  if (n.length > 80) errors.push("Le nom doit faire moins de 80 caractères.");
  const slug = input.slug ?? "";
  if (slug && !/^[a-z0-9-]+$/.test(slug)) errors.push("Le slug doit être en minuscules et URL-safe.");
  if (context?.id && input.parent_id && context.id === input.parent_id) {
    errors.push("Une catégorie ne peut pas être son propre parent.");
  }
  return { ok: errors.length === 0, errors };
}

export function sortCategories<T extends { sort_order?: number; name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ao = a.sort_order ?? 0;
    const bo = b.sort_order ?? 0;
    if (ao !== bo) return ao - bo;
    return (a.name || "").localeCompare(b.name || "", "fr");
  });
}

export interface CategoryTreeNode<T extends CategoryRecord = CategoryRecord> {
  category: T;
  children: CategoryTreeNode<T>[];
}

export function buildCategoryTree<T extends CategoryRecord>(items: T[]): CategoryTreeNode<T>[] {
  const map = new Map<string, CategoryTreeNode<T>>();
  for (const c of items) map.set(c.id, { category: c, children: [] });
  const roots: CategoryTreeNode<T>[] = [];
  for (const node of map.values()) {
    const pid = node.category.parent_id;
    if (pid && map.has(pid)) {
      map.get(pid)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortNodes = (nodes: CategoryTreeNode<T>[]) => {
    nodes.sort((a, b) => {
      const ao = a.category.sort_order ?? 0;
      const bo = b.category.sort_order ?? 0;
      if (ao !== bo) return ao - bo;
      return (a.category.name || "").localeCompare(b.category.name || "", "fr");
    });
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(roots);
  return roots;
}
