import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { directoryResults } from "../directory.mjs";

const normalize = sql => sql.replace(/\bb\./g, "").replace(/\s+/g, " ").trim().toLowerCase();

test("the default directory query matches the partial ordered index", async () => {
  const migration = normalize(await readFile(new URL(
    "../db/upgrades/006-directory-recommended-index.sql", import.meta.url,
  ), "utf8"));
  const queries = [];
  const db = { async query(sql, values) {
    queries.push({ sql: normalize(sql), values });
    return { rows: [] };
  } };
  assert.deepEqual(await directoryResults(db, new URLSearchParams(), null), { items: [], next: null });
  assert.equal(queries.length, 1);
  const { sql, values } = queries[0];
  const rank = sql.match(/\bselect id, (.+?) as rank_key\b/)?.[1];
  const partial = sql.match(/\bwhere (is_active and status in \([^)]+\))/)?.[1];
  assert.ok(rank, "default SQL must select its ranking expression");
  assert.ok(partial, "default SQL must restrict the public visibility states");
  assert.ok(migration.includes(`on public.businesses ((${rank}), id) where ${partial};`));
  assert.match(sql, /order by ordered\.rank_key, ordered\.id limit \$1$/);
  assert.deepEqual(values, [25]);
});
