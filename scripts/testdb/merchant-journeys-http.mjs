import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";

const api = "http://127.0.0.1:25490";
const business = "20000000-0000-0000-0000-000000000001";
const owner = "10000000-0000-0000-0000-000000000001";
const otherOwner = "10000000-0000-0000-0000-000000000002";
const customer = "10000000-0000-0000-0000-000000000003";
const secret = process.env.PGRST_JWT_SECRET;
assert.ok(secret, "Set the disposable test API signing secret");

function token(user) {
  const encode = (object) => Buffer.from(JSON.stringify(object)).toString("base64url");
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({ role: "authenticated", sub: user, exp: Math.floor(Date.now() / 1000) + 300 });
  const signature = createHmac("sha256", secret).update(header + "." + payload).digest("base64url");
  return [header, payload, signature].join(".");
}

async function request(path, user, { method = "GET", data, expectedStatus } = {}) {
  const headers = { "Content-Type": "application/json", Prefer: "return=representation" };
  if (user) headers.Authorization = "Bearer " + token(user);
  const response = await fetch(api + "/" + path, { method, headers, body: JSON.stringify(data) });
  const result = await response.json();
  assert.equal(response.status, expectedStatus ?? (method === "POST" ? 201 : 200), path + " " + JSON.stringify(result));
  return result;
}

const [action] = await request("business_content", owner, { method: "POST", data: {
  business_id: business, kind: "action", title: "Réserver", link_url: "https://example.org/reserver", is_published: false,
} });
const actionPath = "business_content?id=eq." + action.id;
assert.deepEqual(await request(actionPath), []);
await request(actionPath, owner, { method: "PATCH", data: { is_published: true } });
assert.equal((await request(actionPath))[0].link_url, "https://example.org/reserver");
assert.deepEqual(await request(actionPath, otherOwner, { method: "PATCH", data: { title: "Autre titre" } }), []);
console.log("Passed merchant publication and public action");

await request("guest_services", owner, { method: "POST", data: { business_id: business, reservations: true, waitlist: true } });
const [reservation] = await request("guest_requests", customer, { method: "POST", data: {
  business_id: business, kind: "reservation", guest_name: "Cliente", party_size: 2,
  requested_time: new Date(Date.now() + 86_400_000).toISOString().slice(0, 19),
} });
const reservationPath = "guest_requests?id=eq." + reservation.id;
assert.deepEqual(await request(reservationPath, otherOwner), []);
await request(reservationPath, undefined, { expectedStatus: 401 });
await request(reservationPath, owner, { method: "PATCH", data: { status: "accepted" } });
assert.equal((await request(reservationPath, customer))[0].status, "accepted");
console.log("Passed customer reservation and merchant confirmation");

const thread = { business_id: business, customer_id: customer, merchant_id: owner };
await request("business_mail", customer, { method: "POST", data: { ...thread, id: randomUUID(), body: "Question" } });
await request("business_mail", owner, { method: "POST", data: { ...thread, id: randomUUID(), body: "Réponse" } });
assert.deepEqual((await request("business_mail?order=created_at.asc", customer)).map(row => row.body), ["Question", "Réponse"]);
assert.equal((await request("business_mail_threads", customer)).length, 1);
assert.deepEqual(await request("business_mail_threads", otherOwner), []);
console.log("Passed private two-way customer and merchant messaging");
