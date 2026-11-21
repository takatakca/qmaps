import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";

const origin = new URL(process.env.SUPABASE_URL);
assert.equal(origin.origin, "http://supabase-kong:8000", "Run inside the QMAPS Studio container");
assert.equal(process.argv[2], "--qmaps-test", "Explicit fixture creation required");
const visitorOrigin = process.argv.includes("--public") ? new URL("https://qmaps.ca/qmaps-api/") : origin;
const anon = process.env.SUPABASE_ANON_KEY;
const operator = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
assert.ok(anon && operator, "Studio integration unavailable");
const run = randomUUID();
const fixtureId = randomUUID();
const users = [];
const cleanup = [];
const admin = { key: operator, token: operator };

async function api(path, options = {}) {
  const { method = "GET", key = anon, token = key, body, binary, expected = 200 } = options;
  const headers = { apikey: key, Authorization: "Bearer " + token, Prefer: "return=representation" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (binary) headers["Content-Type"] = "image/png";
  // Operator calls stay inside the service network, including fixture cleanup.
  const target = new URL(path.slice(1), key === operator ? origin : visitorOrigin);
  const res = await fetch(target, { method, headers, body: binary || JSON.stringify(body), signal: AbortSignal.timeout(20000) });
  if (res.status !== expected) {
    const data = await res.json().catch(() => ({}));
    throw new Error(method + " " + path.split("?")[0] + " returned " + res.status + " " + (data.code || data.error_code || ""));
  }
  if (res.headers.get("content-type")?.includes("image/")) return Buffer.from(await res.arrayBuffer());
  const text = await res.text();
  return text && JSON.parse(text);
}
async function createFixture(label) {
  const email = "qmaps-" + label + "-" + run + "@example.invalid";
  const password = randomBytes(32).toString("hex");
  const created = await api("/auth/v1/admin/users", { ...admin, method: "POST", body: { email, password, email_confirm: true } });
  users.push(created.id);
  const auth = await api("/auth/v1/token?grant_type=password", { method: "POST", body: { email, password } });
  assert.equal(auth.user.id, created.id);
  return { id: auth.user.id, token: auth.access_token };
}
try {
  const demos = await api("/rest/v1/businesses?select=id&id=eq.a9bf0001-0000-4000-8000-000000000001");
  assert.equal(demos.length, 1, "The QMAPS demonstration catalogue must be installed");
  const owner = await createFixture("merchant");
  const customer = await createFixture("client");
  const outsider = await createFixture("other");
  console.log("PASS three confirmed test accounts and password logins");
  await api("/rest/v1/businesses", { ...admin, method: "POST", expected: 201, body: { id: fixtureId, name: "QMAPS Démo — vérification temporaire", address: "Adresse fictive", owner_user_id: owner.id } });
  const [draft] = await api("/rest/v1/business_content", { token: owner.token, method: "POST", expected: 201, body: { business_id: fixtureId, title: "Essai QMAPS", kind: "post", is_published: false } });
  const postPath = "/rest/v1/business_content?id=eq." + draft.id;
  assert.deepEqual(await api(postPath), []);
  await api(postPath, { token: owner.token, method: "PATCH", body: { is_published: true } });
  assert.equal((await api(postPath))[0].title, "Essai QMAPS");
  await api("/rest/v1/guest_services", { token: owner.token, method: "POST", expected: 201, body: { business_id: fixtureId, waitlist: true } });
  const [seat] = await api("/rest/v1/guest_requests", { token: customer.token, method: "POST", expected: 201, body: { business_id: fixtureId, kind: "waitlist", party_size: 2, guest_name: "Visiteur fictif" } });
  const guestPath = "/rest/v1/guest_requests?id=eq." + seat.id;
  assert.deepEqual(await api(guestPath, { token: outsider.token }), []);
  await api(guestPath, { token: owner.token, method: "PATCH", body: { status: "accepted" } });
  assert.equal((await api(guestPath, { token: customer.token }))[0].status, "accepted");
  console.log("PASS merchant publication and isolated waitlist confirmation");
  const [collection] = await api("/rest/v1/collections", { token: customer.token, method: "POST", expected: 201, body: { user_id: customer.id, name: "Essai privé", is_public: false } });
  const collections = "/rest/v1/collections?id=eq." + collection.id;
  assert.deepEqual(await api(collections, { token: outsider.token }), []);
  assert.deepEqual(await api(collections), []);
  assert.equal((await api(collections, { token: customer.token }))[0].id, collection.id);
  console.log("PASS private collection isolation");
  const file = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5+sAAAAASUVORK5CYII=", "base64");
  const object = "photos/customer-media/" + customer.id + "/" + fixtureId + "/" + run + ".png";
  await api("/storage/v1/object/" + object, { token: customer.token, method: "POST", binary: file });
  cleanup.push(() => api("/storage/v1/object/" + object, { ...admin, method: "DELETE" }));
  assert.deepEqual(await api("/storage/v1/object/public/" + object), file);
  console.log("PASS photo upload and byte-for-byte public read");
} finally {
  const errs = [];
  cleanup.push(() => api("/rest/v1/businesses?id=eq." + fixtureId, { ...admin, method: "DELETE" }));
  for (const id of users) cleanup.push(() => api("/auth/v1/admin/users/" + id, { ...admin, method: "DELETE" }));
  for (const remove of cleanup) { try { await remove(); } catch (e) { errs.push(e); } }
  if (errs.length) throw new AggregateError(errs, "QMAPS fixture cleanup requires attention");
  console.log("PASS removal of temporary test data");
}
