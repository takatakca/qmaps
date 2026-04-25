// Slug helpers shared across SEO/public pages.

export const slugify = (input: string): string =>
  input
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const titleCase = (input: string): string =>
  input
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export const cityFromSlug = (slug: string): string => titleCase(slug.replace(/-/g, " "));
