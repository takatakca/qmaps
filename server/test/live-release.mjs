import assert from "node:assert/strict";

// Run with SOURCE_COMMIT=$(git rev-parse HEAD) node server/test/live-release.mjs
// against the disposable Compose API built with that same build-time value.
const sha = process.env.SOURCE_COMMIT ?? "";
assert.match(sha, /^[a-f0-9]{40}$/, "Expected the complete checkout revision");
const api = new URL(process.env.QMAPS_TEST_ORIGIN ?? "http://127.0.0.1:3102");
assert.ok(
  ["localhost", "127.0.0.1", "[::1]"].includes(api.hostname) &&
    api.protocol === "http:" && !api.username && !api.password,
  "A disposable loopback API is required",
);

async function check(path, body, noStore = false) {
  const response = await fetch(new URL(path, api), {
    headers: { Accept: "application/json" },
    redirect: "error",
    signal: AbortSignal.timeout(10000),
  });
  assert.equal(response.status, 200, path);
  assert.match(response.headers.get("content-type") ?? "", /^application\/json(?:\s*;|$)/i, path);
  if (noStore) assert.equal(response.headers.get("cache-control"), "no-store", path);
  assert.deepEqual(await response.json(), body, path);
}

await check("/v1/health", { service: "QMAPS", database: "PostgreSQL", version: 1 });
const release = { service: "QMAPS", component: "api", sha };
await check("/v1/release", release, true);
await check("/v1/browser/release", release, true);
console.log(`QMAPS API image revision verified through both aliases: ${sha}`);
