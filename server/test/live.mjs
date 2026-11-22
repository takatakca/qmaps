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
await request(
  "/v1/places",
  "POST",
  owner.token,
  { name: "Refusé", city: "Laval", address: "Test" },
  403,
);
for (const member of [owner, customer]) {
  assert.equal(
    (await request("/v1/me/publication-terms", "GET", member.token)).accepted,
    false,
  );
  await request(
    "/v1/me/publication-terms",
    "PUT",
    member.token,
    { version: "ancienne" },
    400,
  );
  assert.equal(
    (
      await request("/v1/me/publication-terms", "PUT", member.token, {
        version: "2026-11-21",
      })
    ).accepted,
    true,
  );
}
const place = await request(
  "/v1/places",
  "POST",
  owner.token,
  { name: "QMAPS test", city: "Laval", address: "Adresse fictive" },
  201,
);
const montreal = await request("/v1/directory?city=Montreal");
assert.equal(montreal.items.length, 2);
assert.equal(montreal.next, null);
const firstPage = await request("/v1/directory?city=Montr%C3%A9al&limit=1");
const lastPage = await request("/v1/directory?city=Montreal&limit=1&after=" + firstPage.next);
assert.deepEqual([...firstPage.items, ...lastPage.items], montreal.items);
assert.equal(lastPage.next, null);
const bistro = montreal.items.find(row => row.name.includes("Bistro"));
const restaurant = bistro.business_categories.find(link => link.categories.slug === "restaurants").categories;
assert.equal((await request("/v1/directory?category=restaurants&city=Laval")).items.length, 0);
assert.equal((await request("/v1/directory?city=Montreal&price=2&category=restaurants")).items[0].id, bistro.id);
assert.equal((await request("/v1/directory?q=tables&match=" + restaurant.id)).items.length, 2);
assert.deepEqual((await request("/v1/directory?q=%25")).items, []);
const catalogRow = await request("/v1/directory/" + place.id);
assert.equal(catalogRow.name, place.name);
assert.equal("owner_user_id" in catalogRow, false);
const cats = await request("/v1/directory/categories?limit=1");
assert.equal(cats.items.length, 1);
assert.notEqual((await request("/v1/directory/categories?limit=1&after=" + cats.next)).items[0].id, cats.items[0].id);
for (const bad of ["after=no", "match=no", "price=6", "rating=NaN", "limit=0", "limit=251"])
  await request("/v1/directory?" + bad, "GET", null, undefined, 400);
const safety = "/v1/places/" + place.id;
await request(
  safety + "/report",
  "POST",
  null,
  { subject: "business", details: "Essai" },
  401,
);
await request(
  safety + "/report",
  "POST",
  owner.token,
  { subject: "user", details: "Essai" },
  404,
);
for (const subject of ["business", "user"]) {
  await request(
    safety + "/report",
    "POST",
    customer.token,
    { subject, details: "Essai de modération" },
    204,
  );
}
await request(
  safety + "/block-publisher",
  "PUT",
  customer.token,
  undefined,
  204,
);
await request(
  safety + "/block-publisher",
  "PUT",
  customer.token,
  undefined,
  204,
);
assert.equal(
  (await request("/v1/places?city=Laval", "GET", customer.token)).some(
    (p) => p.id === place.id,
  ),
  false,
);
assert.equal(
  (await request("/v1/places?city=Laval", "GET", owner.token)).some(
    (p) => p.id === place.id,
  ),
  true,
);
await request(safety, "GET", customer.token, undefined, 404);
assert.equal((await request("/v1/directory?city=Laval", "GET", customer.token)).items.some(row => row.id === place.id), false);
await request("/v1/directory/" + place.id, "GET", customer.token, undefined, 404);
assert.equal((await request("/v1/directory/" + place.id, "GET", owner.token)).id, place.id);
await request(safety + "/posts", "GET", customer.token, undefined, 404);
const blocks = await request(
  "/v1/me/blocked-publishers",
  "GET",
  customer.token,
);
assert.equal(blocks.length, 1);
await request(
  "/v1/me/blocked-publishers/" + blocks[0].id,
  "DELETE",
  owner.token,
  undefined,
  204,
);
assert.equal(
  (await request("/v1/me/blocked-publishers", "GET", customer.token)).length,
  1,
);
await request(
  "/v1/me/blocked-publishers/" + blocks[0].id,
  "DELETE",
  customer.token,
  undefined,
  204,
);
await request(safety, "GET", customer.token);
await request(
  "/v1/console/listing-reports",
  "GET",
  customer.token,
  undefined,
  403,
);
const closure = "/v1/me/closure";
await request(closure, "GET", null, undefined, 401);
assert.equal((await request(closure, "GET", customer.token)).request, null);
await request(closure, "POST", customer.token, { confirmation: "" }, 400);
const attempts = await Promise.all(
  [1, 2].map(() =>
    request(closure, "POST", customer.token, { confirmation: "DELETE" }),
  ),
);
assert.equal(attempts[0].request.id, attempts[1].request.id);
assert.equal(attempts[0].request.status, "pending");
assert.equal((await request(closure, "GET", owner.token)).request, null);
await request("/v1/console/closures", "GET", customer.token, undefined, 403);
await request(
  "/v1/console/closures/" + attempts[0].request.id + "/start",
  "POST",
  customer.token,
  undefined,
  403,
);
await request(closure, "DELETE", owner.token, undefined, 409);
for (let retry = 0; retry < 2; retry++)
  assert.equal(
    (await request(closure, "DELETE", customer.token)).request.status,
    "canceled",
  );
const next = await request(closure, "POST", customer.token, {
  confirmation: "DELETE",
});
assert.notEqual(next.request.id, attempts[0].request.id);
const reviewsPath = "/v1/places/" + place.id + "/reviews";
await request(
  reviewsPath,
  "PUT",
  owner.token,
  { rating: 5, body: "Mon commerce" },
  403,
);
const review = await request(reviewsPath, "PUT", customer.token, {
  rating: 4,
  body: "Essai client",
});
assert.equal((await request(reviewsPath))[0].mine, false);
assert.equal((await request(reviewsPath, "GET", customer.token))[0].mine, true);
assert.equal(
  (
    await request(reviewsPath, "PUT", customer.token, {
      rating: 5,
      body: "Essai modifié",
    })
  ).id,
  review.id,
);
await request(
  reviewsPath + "/" + review.id + "/reply",
  "PUT",
  customer.token,
  { body: "Réponse" },
  403,
);
await request(
  reviewsPath + "/" + review.id + "/reply",
  "PUT",
  owner.token,
  { body: "Merci de votre visite" },
  204,
);
assert.equal(
  (await request(reviewsPath))[0].owner_reply,
  "Merci de votre visite",
);
await request(reviewsPath, "DELETE", customer.token, undefined, 204);
assert.deepEqual(await request(reviewsPath), []);
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
const visitorPhoto = (await upload.json()).id;
const photoPath = "/v1/photos/" + visitorPhoto;
const galleryPath = "/v1/places/" + place.id + "/photos";
const image = await fetch(api + photoPath);
assert.equal(image.status, 200);
assert.deepEqual(Buffer.from(await image.arrayBuffer()), png);
assert.equal((await request(galleryPath)).photos[0].mine, false);
assert.equal(
  (await request(galleryPath, "GET", customer.token)).photos[0].mine,
  true,
);
await request(photoPath, "DELETE", owner.token, undefined, 404);
await request(photoPath + "/cover", "PUT", owner.token, undefined, 403);
await request(photoPath + "/report", "POST", owner.token, undefined, 204);
await request(photoPath + "/report", "POST", owner.token, undefined, 204);
await request("/v1/console/photo-reports", "GET", owner.token, undefined, 403);
await request(
  "/v1/console/photo-reports/" + visitorPhoto + "/remove",
  "POST",
  owner.token,
  undefined,
  403,
);
const ownerUpload = await fetch(api + galleryPath, {
  method: "POST",
  headers: {
    Authorization: "Bearer " + owner.token,
    "Content-Type": "image/png",
  },
  body: png,
});
assert.equal(ownerUpload.status, 201);
const ownerPhoto = (await ownerUpload.json()).id;
await request(
  "/v1/photos/" + ownerPhoto + "/cover",
  "PUT",
  owner.token,
  undefined,
  204,
);
const gallery = await request(galleryPath);
assert.equal(gallery.photos[0].id, ownerPhoto);
assert.equal(gallery.photos[0].cover, true);
assert.equal(gallery.photos[0].merchant_photo, true);
await request(photoPath, "DELETE", customer.token, undefined, 204);
await request(
  "/v1/photos/" + ownerPhoto,
  "DELETE",
  owner.token,
  undefined,
  204,
);
assert.deepEqual((await request(galleryPath)).photos, []);
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
