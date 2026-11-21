import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
const api = (process.env.QMAPS_TEST_ORIGIN || "http://127.0.0.1:3102").replace(
  /\/$/,
  "",
);
if (!["localhost", "127.0.0.1"].includes(new URL(api).hostname))
  throw Error("A disposable local database is required");
async function request(path, method = "GET", token, body, status = 200) {
  const headers = {};
  if (token) headers.Authorization = "Bearer " + token;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const r = await fetch(api + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  assert.equal(r.status, status, method + " " + path);
  return r.status === 204 ? null : r.json();
}
const password = randomBytes(24).toString("base64url"),
  handle = "qa-" + randomUUID().slice(0, 12);
const owner = await request(
  "/v1/accounts/register",
  "POST",
  null,
  { handle, password },
  201,
);
const customer = await request(
  "/v1/accounts/register",
  "POST",
  null,
  { handle: "c-" + handle, password },
  201,
);
assert.equal(
  (await request("/v1/accounts/login", "POST", null, { handle, password }))
    .user_id,
  owner.user_id,
);
assert.equal((await request("/v1/places?city=Montreal")).length, 2);
const place = await request(
  "/v1/places",
  "POST",
  owner.token,
  { name: "QMAPS test", city: "Laval", address: "Adresse fictive" },
  201,
);
await request(
  "/v1/places/" + place.id + "/posts",
  "POST",
  owner.token,
  { title: "Annonce", body: "Démo" },
  201,
);
await request(
  "/v1/places/" + place.id + "/posts",
  "POST",
  customer.token,
  { title: "Autre", body: "Essai" },
  403,
);
assert.equal(
  (await request("/v1/places/" + place.id + "/posts"))[0].title,
  "Annonce",
);
await request(
  "/v1/places/" + place.id + "/guest-settings",
  "PUT",
  owner.token,
  { reservations: false, waitlist: true },
  204,
);
assert.equal(
  (
    await request(
      "/v1/places/" + place.id + "/waitlist",
      "POST",
      customer.token,
      { party_size: 2, name: "Fictif" },
      201,
    )
  ).status,
  "pending",
);
await request(
  "/v1/places/" + place.id + "/bookmark",
  "PUT",
  customer.token,
  undefined,
  204,
);
assert.equal(
  (await request("/v1/me/bookmarks", "GET", customer.token))[0].id,
  place.id,
);
assert.deepEqual(await request("/v1/me/bookmarks", "GET", owner.token), []);
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5+sAAAAASUVORK5CYII=",
  "base64",
);
const upload = await fetch(api + "/v1/places/" + place.id + "/photos", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + customer.token,
    "Content-Type": "image/png",
  },
  body: png,
});
assert.equal(upload.status, 201);
const image = await fetch(api + "/v1/photos/" + (await upload.json()).id);
assert.equal(image.status, 200);
assert.deepEqual(Buffer.from(await image.arrayBuffer()), png);
const recovery = await request("/v1/accounts/recover", "POST", null, {
  handle,
  password: password + "xx",
  recovery_code: owner.recovery_code,
});
assert.notEqual(recovery.recovery_code, owner.recovery_code);
await request("/v1/me", "GET", owner.token, undefined, 401);
await request(
  "/v1/accounts/recover",
  "POST",
  null,
  { handle, password: password + "zz", recovery_code: owner.recovery_code },
  401,
);
await request("/v1/accounts/logout", "POST", recovery.token, undefined, 204);
await request("/v1/me", "GET", recovery.token, undefined, 401);
console.log(
  "Independent account lifecycle, customer and merchant permissions, catalogue and media passed.",
);
