import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const SITE_ORIGIN = "https://qmaps.ca";
export const CITY_MINIMUM_LISTINGS = 3;
export const SITEMAP_URL_LIMIT = 50_000;
const PAGE_SIZE = 1_000;

const STATIC_PATHS = ["/", "/services", "/projects", "/release-notes"];

export function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const toCitySlug = (city) =>
  city
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function buildSitemapEntries(businesses, origin = SITE_ORIGIN) {
  const entries = STATIC_PATHS.map((path) => ({ loc: new URL(path, origin).href }));
  const cities = new Map();

  for (const business of businesses) {
    if (!business || typeof business.id !== "string" || !business.id.trim()) continue;

    const entry = {
      loc: new URL(`/business/${encodeURIComponent(business.id)}`, origin).href,
      lastmod: business.updated_at,
    };
    entries.push(entry);

    if (typeof business.city !== "string" || !business.city.trim()) continue;
    const slug = toCitySlug(business.city);
    if (!slug) continue;

    const city = cities.get(slug) || { name: business.city.trim(), count: 0, lastmod: "" };
    city.count += 1;
    if (business.updated_at && business.updated_at > city.lastmod) {
      city.lastmod = business.updated_at;
    }
    cities.set(slug, city);
  }

  for (const [slug, city] of cities) {
    if (city.count < CITY_MINIMUM_LISTINGS) continue;
    entries.push({
      loc: new URL(`/city/${slug}`, origin).href,
      lastmod: city.lastmod,
    });
  }

  return [...new Map(entries.map((entry) => [entry.loc, entry])).values()];
}

const validLastmod = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "" : `\n    <lastmod>${date.toISOString()}</lastmod>`;
};

export function buildUrlSet(entries) {
  const urls = entries
    .map(
      ({ loc, lastmod }) =>
        `  <url>\n    <loc>${escapeXml(loc)}</loc>${validLastmod(lastmod)}\n  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function buildSitemapFiles(entries, origin = SITE_ORIGIN) {
  if (entries.length <= SITEMAP_URL_LIMIT) {
    return new Map([["sitemap.xml", buildUrlSet(entries)]]);
  }

  const files = new Map();
  const chunkCount = Math.ceil(entries.length / SITEMAP_URL_LIMIT);
  const index = [];
  for (let chunk = 0; chunk < chunkCount; chunk += 1) {
    const name = `sitemap-${chunk + 1}.xml`;
    const chunkEntries = entries.slice(
      chunk * SITEMAP_URL_LIMIT,
      (chunk + 1) * SITEMAP_URL_LIMIT,
    );
    files.set(name, buildUrlSet(chunkEntries));
    index.push(new URL(`/${name}`, origin).href);
  }

  const sitemaps = index
    .map((loc) => `  <sitemap>\n    <loc>${escapeXml(loc)}</loc>\n  </sitemap>`)
    .join("\n");
  files.set(
    "sitemap.xml",
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps}\n</sitemapindex>\n`,
  );
  return files;
}

async function fetchActiveBusinesses(supabaseUrl, publishableKey) {
  const endpoint = new URL("/rest/v1/businesses", supabaseUrl);
  endpoint.searchParams.set("select", "id,city,updated_at");
  endpoint.searchParams.set("is_active", "eq.true");
  endpoint.searchParams.set("order", "updated_at.desc,id.asc");

  const businesses = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const response = await fetch(endpoint, {
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
        Range: `${offset}-${offset + PAGE_SIZE - 1}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Sitemap business query failed with HTTP ${response.status}.`);
    }

    const page = await response.json();
    if (!Array.isArray(page)) {
      throw new Error("Sitemap business query returned an invalid response.");
    }
    businesses.push(...page);
    if (page.length < PAGE_SIZE) return businesses;
  }
}

export async function generateSitemap({ env = process.env, cwd = process.cwd() } = {}) {
  const { loadEnv } = await import("vite");
  const fileEnv = loadEnv("production", cwd, "VITE_");
  const supabaseUrl = env.VITE_SUPABASE_URL || fileEnv.VITE_SUPABASE_URL;
  const publishableKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY || fileEnv.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey) {
    throw new Error(
      "Sitemap generation requires VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  const businesses = await fetchActiveBusinesses(supabaseUrl, publishableKey);
  const entries = buildSitemapEntries(businesses);
  const files = buildSitemapFiles(entries);
  const outputDirectory = resolve(cwd, "dist");
  await mkdir(outputDirectory, { recursive: true });
  await Promise.all(
    [...files].map(([name, content]) => writeFile(resolve(outputDirectory, name), content)),
  );

  const cityCount = entries.filter((entry) => entry.loc.includes("/city/")).length;
  console.log(
    `Generated sitemap for ${businesses.length} active businesses and ${cityCount} qualifying cities.`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  generateSitemap().catch((error) => {
    console.error(error instanceof Error ? error.message : "Sitemap generation failed.");
    process.exitCode = 1;
  });
}
