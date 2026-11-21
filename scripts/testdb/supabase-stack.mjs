import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const config = JSON.parse(await readFile(process.argv[2], "utf8"));
const origin = new URL(config.API_URL);
const db = new URL(config.DB_URL);
for (const target of [origin, db]) {
  assert.ok(["127.0.0.1", "localhost"].includes(target.hostname), "This smoke test requires a local disposable stack");
}
const apiKey = config.ANON_KEY || config.PUBLISHABLE_KEY;
assert.ok(apiKey, "Missing public key for the local stack");

async function request(path, { method = "GET", session, body, expected = 200 } = {}) {
  const headers = { apikey: apiKey, "Content-Type": "application/json", Prefer: "return=representation" };
  if (session) headers.Authorization = "Bearer " + session.access_token;
  const response = await fetch(new URL(path, origin), { method, headers, body: JSON.stringify(body) });
  assert.equal(response.status, expected, method + " " + path);
  return response.json();
}

async function signInNewUser() {
  const credentials = { email: randomUUID() + "@example.test", password: randomBytes(24).toString("hex") };
  const created = await request("/auth/v1/signup", { method: "POST", body: credentials });
  const signed = await request("/auth/v1/token?grant_type=password", { method: "POST", body: credentials });
  assert.ok(signed.access_token);
  assert.equal(signed.user.id, created.user.id);
  return signed;
}

const owner = await signInNewUser();
const secondOwner = await signInNewUser();
const customer = await signInNewUser();
const business = randomUUID();
const otherBusiness = randomUUID();
// The fixture assigns existing Auth identities to two active listings. All journey writes use their sessions.
execFileSync("psql", [db.href, "-X", "-v", "ON_ERROR_STOP=1", "-v", "business=" + business,
  "-v", "second=" + otherBusiness, "-v", "owner=" + owner.user.id, "-v", "other=" + secondOwner.user.id], {
  input: "insert into public.businesses(id,name,address,owner_user_id,is_active) values (:'business','Restaurant de test','Rue Test',:'owner',true),(:'second','Autre restaurant','Rue Test',:'other',true);",
});
console.log("Passed account creation and password sign-in for three local users");

const table = "/rest/v1/";
const [post] = await request(table + "business_content", {
  method: "POST", expected: 201, session: owner, body: { business_id: business, kind: "post", title: "Nouvelle", is_published: false },
});
const postPath = table + "business_content?id=eq." + post.id;
assert.deepEqual(await request(postPath), []);
await request(postPath, { method: "PATCH", session: owner, body: { is_published: true } });
assert.equal((await request(postPath))[0].title, "Nouvelle");

await request(table + "guest_services", { method: "POST", expected: 201, session: owner,
  body: { business_id: business, waitlist: true } });
const [guest] = await request(table + "guest_requests", { method: "POST", expected: 201, session: customer,
  body: { business_id: business, kind: "waitlist", party_size: 2, guest_name: "Cliente de test" } });
const guestPath = table + "guest_requests?id=eq." + guest.id;
assert.deepEqual(await request(guestPath, { session: secondOwner }), []);
await request(guestPath, { method: "PATCH", session: owner, body: { status: "accepted" } });
assert.equal((await request(guestPath, { session: customer }))[0].status, "accepted");
console.log("Passed real-session listing publication and waitlist confirmation");

const file = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5+sAAAAASUVORK5CYII=", "base64");
const object = "photos/customer-media/" + customer.user.id + "/" + business + "/" + randomUUID() + ".png";
const upload = await fetch(new URL("/storage/v1/object/" + object, origin), { method: "POST",
  headers: { apikey: apiKey, Authorization: "Bearer " + customer.access_token, "Content-Type": "image/png" }, body: file });
assert.ok(upload.ok, "Storage upload returned " + upload.status);
const photo = await fetch(new URL("/storage/v1/object/public/" + object, origin));
assert.equal(photo.status, 200);
assert.ok(file.equals(Buffer.from(await photo.arrayBuffer())), "Storage bytes changed");
console.log("Passed authenticated Storage upload and public image download");

const collections = table + "collections";
const [list] = await request(collections, { method: "POST", session: customer, expected: 201,
  body: { user_id: customer.user.id, name: "Mes adresses", is_public: false } });
await request(table + "bookmarks", { method: "POST", session: customer, expected: 201,
  body: { user_id: customer.user.id, business_id: business, list_name: "saved" } });
await request(table + "collection_items", { method: "POST", session: customer, expected: 201,
  body: { collection_id: list.id, business_id: business } });
const collectionPath = collections + "?id=eq." + list.id;
const summaryPath = collectionPath + "&select=id,collection_items(count),preview:collection_items(businesses(name))&preview.limit=1";
assert.deepEqual(await request(summaryPath, { session: secondOwner }), []);
assert.deepEqual(await request(summaryPath), []);
assert.equal((await request(summaryPath, { session: customer }))[0].collection_items[0].count, 1);
await request(collectionPath, { method: "PATCH", session: customer, body: { is_public: true } });
assert.equal((await request(summaryPath))[0].preview[0].businesses.name, "Restaurant de test");
assert.deepEqual(await request(table + "bookmarks?user_id=eq." + customer.user.id, { session: secondOwner }), []);
console.log("Passed saved listing, private collection isolation, public preview and exact count");
