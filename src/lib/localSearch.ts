import { CITIES_BY_SLUG } from "@/data/quebecCities";
import { slugify, titleCase } from "@/lib/seo";

const cityName = (slug: string) => Object.prototype.hasOwnProperty.call(CITIES_BY_SLUG, slug) ? CITIES_BY_SLUG[slug].name : undefined;

export const cityLabelFor = (value: string) =>
  cityName(slugify(value)) || value.trim();

export const cityLabelFromSlug = (slug: string) =>
  cityName(slug) || titleCase(slug);

// Raw PostgREST OR values require quoting. Escape literal LIKE wildcards too.
const quote = (value: string) => '"' + value.replace(/["\\]/g, "\\$&") + '"';
const literal = (value: string) => value.replace(/[\\%_]/g, "\\$&").replace(/\*/g, " ");

export function cityFilter(value: string) {
  const name = cityLabelFor(value);
  const plain = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const forms = new Set([name, plain, plain.replace(/[-'’–—]+/g, " "), value.trim()]);
  return [...forms].map(city => "city.ilike." + quote(literal(city))).join(",");
}

export const textSearchFilter = (value: string) => {
  const pattern = quote("%" + literal(value.trim()) + "%");
  return ["name", "city", "description"].map(column => column + ".ilike." + pattern).join(",");
};

export function searchUrl(query: string, city: string, category?: string) {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (city.trim()) params.set("city", cityLabelFor(city));
  if (category) params.set("category", category);
  const search = params.toString();
  return search ? "/search?" + search : "/search";
}
