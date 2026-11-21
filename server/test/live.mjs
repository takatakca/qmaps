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
const reviewsPath = "/v1/places/" + place.id + "/reviews";
await request(reviewsPath, "PUT", owner.token, {rating:5,body:"Mon commerce"},403);
const review = await request(reviewsPath,"PUT",customer.token,{rating:4,body:"Essai client"});
assert.equal((await request(reviewsPath))[0].mine,false);
assert.equal((await request(reviewsPath,"GET",customer.token))[0].mine,true);
assert.equal((await request(reviewsPath,"PUT",customer.token,{rating:5,body:"Essai modifié"})).id,review.id);
await request(reviewsPath + "/" + review.id + "/reply","PUT",customer.token,{body:"Réponse"},403);
await request(reviewsPath + "/" + review.id + "/reply","PUT",owner.token,{body:"Merci de votre visite"},204);
assert.equal((await request(reviewsPath))[0].owner_reply,"Merci de votre visite");
await request(reviewsPath,"DELETE",customer.token,undefined,204);
assert.deepEqual(await request(reviewsPath),[]);
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

const origin = "https://qmaps.ca";
const browserHandle = "web-" + handle;
const browserPath = api + "/v1/browser";
const attempt = (originHeader) =>
  fetch(browserPath + "/accounts/register", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: originHeader },
    body: JSON.stringify({ handle: browserHandle, password }),
  });
assert.equal((await attempt("https://example.invalid")).status, 403);
const registered = await attempt(origin);
assert.equal(registered.status, 201);
const cookies = registered.headers.get("set-cookie");
assert.match(cookies, /HttpOnly/);
assert.match(cookies, /Secure/);
assert.match(cookies, /SameSite=Strict/);
assert.equal((await registered.json()).token, undefined);
const cookie = cookies.split(";")[0];
assert.equal(
  (await fetch(browserPath + "/me", { headers: { Cookie: cookie } })).status,
  200,
);
assert.equal(
  (await fetch(browserPath + "/console", { headers: { Cookie: cookie } }))
    .status,
  403,
);
assert.equal((await fetch(browserPath + "/console")).status, 401);
assert.equal(
  (
    await fetch(browserPath + "/accounts/logout", {
      method: "POST",
      headers: { Origin: origin, Cookie: cookie },
    })
  ).status,
  204,
);
assert.equal(
  (await fetch(browserPath + "/me", { headers: { Cookie: cookie } })).status,
  401,
);
console.log(
  "Independent browser sessions, CSRF, role checks and logout passed.",
);
