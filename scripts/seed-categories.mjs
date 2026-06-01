#!/usr/bin/env node
/**
 * Québec category reseed generator.
 *
 * Reads src/data/quebecCategories.ts and emits an idempotent SQL file at
 *   /tmp/qmaps-categories-seed.sql
 *
 * The SQL:
 *   - Upserts every root by stable `slug` (ON CONFLICT (slug) DO UPDATE).
 *   - Upserts every child by stable `slug`, resolving parent_id via slug lookup
 *     so existing UUIDs are preserved.
 *   - Sets is_active = true, category_type = 'business'.
 *   - Runs integrity checks (total, duplicates, orphans) at the end.
 *
 * Usage:
 *   1. node scripts/seed-categories.mjs
 *   2. Paste /tmp/qmaps-categories-seed.sql into Lovable Cloud → SQL editor,
 *      or `psql "$DATABASE_URL" -f /tmp/qmaps-categories-seed.sql`.
 *
 * Safe to re-run: existing UUIDs are kept; only mutable fields (name, icon,
 * sort_order, parent_id) are refreshed.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, "..", "src/data/quebecCategories.ts");
const OUT = process.argv[2] || "/tmp/qmaps-categories-seed.sql";

const raw = readFileSync(SRC, "utf8");
// Extract the QUEBEC_CATEGORIES array literal between `[` and the closing `];`.
const start = raw.indexOf("QUEBEC_CATEGORIES");
const arrStart = raw.indexOf("[", start);
const arrEnd = raw.indexOf("\n];", arrStart);
if (arrStart < 0 || arrEnd < 0) {
  console.error("Could not locate QUEBEC_CATEGORIES array literal");
  process.exit(1);
}
const body = raw.slice(arrStart + 1, arrEnd);

const re =
  /\{\s*slug:\s*"([^"]+)",\s*name:\s*"((?:[^"\\]|\\.)*)",\s*parentSlug:\s*(null|"([^"]+)"),\s*icon:\s*(null|"([^"]+)"),\s*sortOrder:\s*(\d+)\s*\}/g;
const items = [];
let m;
while ((m = re.exec(body)) !== null) {
  items.push({
    slug: m[1],
    name: m[2].replace(/\\"/g, '"'),
    parentSlug: m[3] === "null" ? null : m[4],
    icon: m[5] === "null" ? null : m[6],
    sortOrder: Number(m[7]),
  });
}
if (!items.length) {
  console.error("No categories parsed.");
  process.exit(1);
}

const roots = items.filter((c) => !c.parentSlug);
const children = items.filter((c) => c.parentSlug);

const esc = (s) => (s == null ? "NULL" : `'${String(s).replace(/'/g, "''")}'`);

const chunks = [];
chunks.push(`-- QMAPS Québec category seed (generated ${new Date().toISOString()})`);
chunks.push(`-- Idempotent: ON CONFLICT (slug) DO UPDATE. Run in Lovable Cloud SQL editor as service_role.\n`);

chunks.push(`BEGIN;\n`);

// Roots
chunks.push(`-- ${roots.length} root categories`);
chunks.push(
  `INSERT INTO public.categories (slug, name, parent_id, icon, sort_order, is_active, category_type) VALUES`,
);
chunks.push(
  roots
    .map(
      (r) =>
        `  (${esc(r.slug)}, ${esc(r.name)}, NULL, ${esc(r.icon)}, ${r.sortOrder}, true, 'business')`,
    )
    .join(",\n") + "\nON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order, parent_id=EXCLUDED.parent_id, is_active=true, category_type=EXCLUDED.category_type;\n",
);

// Children in batches of 500, resolving parent via slug lookup
const BATCH = 500;
for (let i = 0; i < children.length; i += BATCH) {
  const batch = children.slice(i, i + BATCH);
  chunks.push(`-- children batch ${i / BATCH + 1} (${batch.length} rows)`);
  chunks.push(
    `INSERT INTO public.categories (slug, name, parent_id, icon, sort_order, is_active, category_type)`,
  );
  chunks.push(`SELECT v.slug, v.name, p.id, v.icon, v.sort_order, true, 'business'`);
  chunks.push(`FROM (VALUES`);
  chunks.push(
    batch
      .map(
        (c) =>
          `  (${esc(c.slug)}, ${esc(c.name)}, ${esc(c.parentSlug)}, ${esc(c.icon)}, ${c.sortOrder})`,
      )
      .join(",\n"),
  );
  chunks.push(`) AS v(slug, name, parent_slug, icon, sort_order)`);
  chunks.push(`LEFT JOIN public.categories p ON p.slug = v.parent_slug`);
  chunks.push(
    `ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order, parent_id=EXCLUDED.parent_id, is_active=true, category_type=EXCLUDED.category_type;\n`,
  );
}

chunks.push(`COMMIT;\n`);

// Integrity checks
chunks.push(`-- ===== Integrity checks =====`);
chunks.push(`-- expected total >= ${items.length}`);
chunks.push(`SELECT 'total' AS check, count(*) FROM public.categories;`);
chunks.push(`-- expected roots = ${roots.length}`);
chunks.push(`SELECT 'roots' AS check, count(*) FROM public.categories WHERE parent_id IS NULL;`);
chunks.push(`-- expected 0 duplicate slugs`);
chunks.push(`SELECT 'dup_slugs' AS check, count(*) FROM (SELECT slug FROM public.categories GROUP BY slug HAVING count(*) > 1) d;`);
chunks.push(`-- expected 0 orphan children`);
chunks.push(
  `SELECT 'orphans' AS check, count(*) FROM public.categories c WHERE c.parent_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.categories p WHERE p.id = c.parent_id);`,
);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, chunks.join("\n"));
console.log(`Wrote ${OUT}`);
console.log(`  roots: ${roots.length}`);
console.log(`  children: ${children.length}`);
console.log(`  total: ${items.length}`);
