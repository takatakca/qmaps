import { mkdir, mkdtemp, readdir, rename, rm, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { exampleListings, ownedListingPermalink } from "../src/lib/ownedListingIdentity.mjs";

export const SITE_ORIGIN = "https://qmaps.ca";
export const SITEMAP_URL_LIMIT = 50_000;
const SITEMAP_BYTE_LIMIT = 50 * 1024 * 1024;
const PAGE_SIZE = 250;
const MAX_PAGES = 2_000;
const staticPaths = ["/", "/services", "/city/montreal", "/release-notes", "/privacy", "/terms", "/cookies", "/support-policy", "/account-deletion-policy"];
const allowedStatuses = new Set(["open", "temporarily_closed", "seasonal"]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const namespace = "http://www.sitemaps.org/schemas/sitemap/0.9";

export function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function hasReviewedProvenance(listing) {
  if (Object.hasOwn(exampleListings, listing.id)) return false;
  const marker = listing.attributes?.qmaps_directory_import;
  // Only import lanes already reviewed for QMAPS publication. No labels,
  // contacts, source URLs or other row fields are copied into the sitemap.
  if (typeof marker?.external_id !== "string") return false;
  return (marker.source === "on2go.ca" && /^[a-z0-9-]{1,100}@[a-z0-9-]{1,40}$/.test(marker.external_id)) ||
    (marker.source === "mtl_food" && marker.licence === "CC-BY-4.0" && /^[1-9][0-9]{0,19}$/.test(marker.external_id));
}

export function buildSitemapEntries(listings) {
  const listingPaths = [...new Set(listings.filter(row =>
    row && typeof row.id === "string" && uuid.test(row.id) &&
    allowedStatuses.has(row.status) && hasReviewedProvenance(row),
  ).map(row => row.id))].sort().map(ownedListingPermalink);
  return [...staticPaths, ...listingPaths].map(path => ({ loc: new URL(path, SITE_ORIGIN).href }));
}

function xmlDocument(tag, children) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${tag} xmlns="${namespace}">\n${children.join("\n")}\n</${tag}>\n`;
  if (Buffer.byteLength(xml) > SITEMAP_BYTE_LIMIT) throw new Error("Sitemap exceeds the uncompressed XML size limit.");
  return xml;
}

const xmlEntries = (tag, locations) => locations.map(loc => `  <${tag}><loc>${escapeXml(loc)}</loc></${tag}>`);

export function buildSitemapFiles(entries) {
  const files = new Map();
  if (entries.length <= SITEMAP_URL_LIMIT) {
    files.set("sitemap.xml", xmlDocument("urlset", xmlEntries("url", entries.map(({ loc }) => loc))));
    return files;
  }
  const index = [];
  for (let offset = 0; offset < entries.length; offset += SITEMAP_URL_LIMIT) {
    const name = `sitemap-${index.length + 1}.xml`;
    const locations = entries.slice(offset, offset + SITEMAP_URL_LIMIT).map(({ loc }) => loc);
    files.set(name, xmlDocument("urlset", xmlEntries("url", locations)));
    index.push(new URL(`/${name}`, SITE_ORIGIN).href);
  }
  files.set("sitemap.xml", xmlDocument("sitemapindex", xmlEntries("sitemap", index)));
  return files;
}

export async function fetchPublicDirectory({ request = fetch, pageSize = PAGE_SIZE } = {}) {
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > PAGE_SIZE) throw new TypeError("Invalid directory page size.");
  const endpoint = new URL("/api/v1/browser/directory", SITE_ORIGIN);
  endpoint.searchParams.set("limit", String(pageSize));
  const listings = [];
  let previous = "";
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await request(new URL(endpoint), {
      headers: { Accept: "application/json", "Cache-Control": "no-cache" },
      credentials: "omit",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status !== 200 || response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json")
      throw new Error(`QMAPS public directory returned HTTP ${response.status} or a non-JSON response.`);
    const payload = await response.json();
    if (!Array.isArray(payload?.items) || payload.items.length > pageSize)
      throw new Error("QMAPS public directory returned an invalid page.");
    for (const row of payload.items) {
      if (typeof row?.id !== "string" || !uuid.test(row.id) || row.id <= previous || !allowedStatuses.has(row.status))
        throw new Error("QMAPS public directory returned an invalid or out-of-order listing.");
      previous = row.id;
      if (hasReviewedProvenance(row)) {
        listings.push({
          id: row.id,
          status: row.status,
          attributes: { qmaps_directory_import: {
            source: row.attributes.qmaps_directory_import.source,
            external_id: row.attributes.qmaps_directory_import.external_id,
            licence: row.attributes.qmaps_directory_import.licence,
          } },
        });
      }
    }
    if (payload.next === null) return listings;
    if (payload.items.length !== pageSize || payload.next !== previous)
      throw new Error("QMAPS public directory returned an invalid continuation.");
    endpoint.searchParams.set("after", previous);
  }
  throw new Error("QMAPS public directory exceeded the safe limit of pages.");
}

export async function generateSitemap({ request = fetch, cwd = process.cwd(), publishStatic = false } = {}) {
  // Build the complete output before replacing any checked-in XML. The standard
  // web build uses those static files and does not call this network command.
  const listings = await fetchPublicDirectory({ request });
  const entries = buildSitemapEntries(listings);
  const files = buildSitemapFiles(entries);
  const outputDirectory = resolve(cwd, publishStatic ? "public" : "dist");
  await mkdir(outputDirectory, { recursive: true });
  const prepared = await mkdtemp(join(outputDirectory, ".qmaps-sitemap-"));
  try {
    await Promise.all([...files].map(([name, content]) => writeFile(join(prepared, name), content)));
    // The index is written last so it cannot refer to a shard not yet present.
    for (const name of files.keys()) await rename(join(prepared, name), join(outputDirectory, name));
    for (const name of await readdir(outputDirectory)) {
      if (/^sitemap-[1-9][0-9]*\.xml$/.test(name) && !files.has(name))
        await rm(join(outputDirectory, name));
    }
  } finally {
    await rm(prepared, { recursive: true, force: true });
  }
  console.log(`Generated sitemap for ${listings.length} source-reviewed public QMAPS listings.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length && args[0] !== "--publish-static")) {
    console.error("Usage: node scripts/generate-sitemap.mjs [--publish-static]");
    process.exitCode = 2;
  } else {
    generateSitemap({ publishStatic: args[0] === "--publish-static" }).catch(error => {
      console.error(error instanceof Error ? error.message : "Sitemap generation failed.");
      process.exitCode = 1;
    });
  }
}
