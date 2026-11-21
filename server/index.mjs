import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import pg from "pg";
import {
  account,
  ApiError,
  logout,
  transaction,
  userFor,
} from "./accounts.mjs";

const pool = new pg.Pool({
  max: 12,
  connectionTimeoutMillis: 4000,
  statement_timeout: 8000,
});
pool.on("error", () => console.error("QMAPS database connection closed"));
const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const placeRoute = new RegExp(
  "^/v1/places/(" +
    uuid +
    ")(?:/(bookmark|guest-settings|waitlist|photos|posts|reviews))?$",
  "i",
);
const photoRoute = new RegExp("^/v1/photos/(" + uuid + ")$", "i");
const catalogue =
  "id,name,city,address,description,latitude,longitude,price_level,avg_rating,reviews_count,hours_json";
function reply(res, status, value) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(value === undefined ? undefined : JSON.stringify(value));
}
async function read(req, limit) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new ApiError(413, "Fichier trop volumineux");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
async function body(req) {
  if (req.headers["content-type"]?.split(";")[0] !== "application/json")
    throw new ApiError(415, "JSON requis");
  let obj;
  try {
    obj = JSON.parse((await read(req, 16384)).toString());
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(400, "JSON invalide");
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj))
    throw new ApiError(400, "Objet requis");
  return obj;
}
function field(data, name, maximum) {
  const x = data[name];
  if (typeof x !== "string" || !x.trim() || x.trim().length > maximum)
    throw new ApiError(400, "Champ invalide: " + name);
  return x.trim();
}
function requireUser(id) {
  if (!id) throw new ApiError(401, "Connexion requise");
  return id;
}
function first(result) {
  if (!result.rowCount) throw new ApiError(404, "Introuvable");
  return result.rows[0];
}
function scoped(id, fn) {
  return transaction(pool, async (db) => {
    await db.query(id ? "SET LOCAL ROLE authenticated" : "SET LOCAL ROLE anon");
    await db.query("SELECT set_config('qmaps.user_id',$1,true)", [id || ""]);
    return fn(db);
  });
}
function imageType(buf) {
  if (
    buf.length >= 24 &&
    buf.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))
  )
    return "image/png";
  if (
    buf.length >= 4 &&
    buf[0] === 255 &&
    buf[1] === 216 &&
    buf[2] === 255 &&
    buf.at(-2) === 255 &&
    buf.at(-1) === 217
  )
    return "image/jpeg";
  throw new ApiError(415, "Image PNG ou JPEG requise");
}
async function route(req, res) {
  const url = new URL(req.url, "http://localhost"),
    browser = url.pathname.startsWith("/v1/browser/"),
    path = browser
      ? url.pathname.replace("/v1/browser/", "/v1/")
      : url.pathname,
    method = req.method;
  const cookieName = "__Host-qmaps_session";
  const writeCookie = (value, age) =>
    res.setHeader(
      "Set-Cookie",
      cookieName +
        "=" +
        value +
        "; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=" +
        age,
    );
  if (
    browser &&
    !["GET", "HEAD"].includes(method) &&
    req.headers.origin !== "https://qmaps.ca" &&
    req.headers.origin !== "https://www.qmaps.ca"
  )
    throw new ApiError(403, "Origine non autorisée");
  const cookie = (req.headers.cookie || "")
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(cookieName + "="))
    ?.slice(cookieName.length + 1);
  const authorization = browser
    ? cookie
      ? "Bearer " + cookie
      : undefined
    : req.headers.authorization;
  if (path === "/v1/health" && method === "GET") {
    await pool.query("SELECT 1 FROM qmaps_private.accounts LIMIT 0");
    return reply(res, 200, {
      service: "QMAPS",
      database: "PostgreSQL",
      version: 1,
    });
  }
  if (
    /^\/v1\/accounts\/(register|login|recover)$/.test(path) &&
    method === "POST"
  ) {
    const action = path.split("/").pop();
    const result = await account(
      pool,
      action,
      await body(req),
      req.socket.remoteAddress || "local",
    );
    if (browser) {
      writeCookie(result.token, result.expires_in);
      const { token: unused, ...safe } = result;
      return reply(res, action === "register" ? 201 : 200, safe);
    }
    return reply(res, action === "register" ? 201 : 200, result);
  }
  if (path === "/v1/accounts/logout" && method === "POST") {
    if (browser) writeCookie("", 0);
    if (authorization) {
      try {
        await logout(pool, authorization);
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 401)) throw error;
      }
    }
    return reply(res, 204);
  }
  const id = await userFor(pool, authorization);
  if (path === "/v1/console" && method === "GET") {
    requireUser(id);
    const roles = await scoped(id, (db) =>
      db.query(
        "SELECT 1 FROM public.user_roles WHERE user_id=$1 AND role='admin'",
        [id],
      ),
    );
    if (!roles.rowCount) throw new ApiError(403, "Accès propriétaire requis");
    const stats = await pool.query(
      "SELECT (SELECT count(*)::int FROM public.businesses WHERE is_active) AS places, (SELECT count(*)::int FROM qmaps_private.accounts) AS accounts, (SELECT count(*)::int FROM qmaps_private.media) AS media",
    );
    return reply(res, 200, {
      ...stats.rows[0],
      database: "PostgreSQL / PostGIS",
      api: "QMAPS",
      source: "https://github.com/takatakca/qmaps",
    });
  }
  if (path === "/v1/me" && method === "GET") {
    requireUser(id);
    const result = await pool.query(
      "SELECT handle FROM qmaps_private.accounts WHERE user_id=$1",
      [id],
    );
    const roles = await scoped(id, (db) =>
      db.query("SELECT role FROM public.user_roles WHERE user_id=$1", [id]),
    );
    return reply(res, 200, {
      id,
      handle: first(result).handle,
      roles: roles.rows.map((r) => r.role),
    });
  }
  if (path === "/v1/places" && method === "GET") {
    const city = (url.searchParams.get("city") || "").slice(0, 120),
      q = (url.searchParams.get("q") || "").slice(0, 150);
    const result = await scoped(null, (db) =>
      db.query(
        `SELECT ${catalogue} FROM public.businesses WHERE is_active AND ($1='' OR lower(unaccent(city))=lower(unaccent($1))) AND ($2='' OR strpos(lower(unaccent(name)),lower(unaccent($2)))>0) ORDER BY name,id LIMIT 100`,
        [city, q],
      ),
    );
    return reply(res, 200, result.rows);
  }
  if (path === "/v1/places" && method === "POST") {
    requireUser(id);
    const obj = await body(req),
      name = field(obj, "name", 100),
      city = field(obj, "city", 100),
      address = field(obj, "address", 250);
    const result = await scoped(id, async (db) => {
      await db.query("SELECT pg_advisory_xact_lock(hashtext($1))", [id]);
      const owned = await db.query(
        "SELECT 1 FROM public.businesses WHERE owner_user_id=$1 LIMIT 10",
        [id],
      );
      if (owned.rowCount >= 10)
        throw new ApiError(429, "Limite de fiches atteinte");
      return db.query(
        "INSERT INTO public.businesses(name,city,address,owner_user_id) VALUES($1,$2,$3,$4) RETURNING id,name,city",
        [name, city, address, id],
      );
    });
    return reply(res, 201, first(result));
  }
  if (path === "/v1/me/places" && method === "GET") {
    requireUser(id);
    return reply(
      res,
      200,
      (
        await scoped(id, (db) =>
          db.query(
            "SELECT id,name,city FROM public.businesses WHERE owner_user_id=$1 ORDER BY name",
            [id],
          ),
        )
      ).rows,
    );
  }
  if (path === "/v1/me/bookmarks" && method === "GET") {
    requireUser(id);
    return reply(
      res,
      200,
      (
        await scoped(id, (db) =>
          db.query(
            "SELECT b.id,b.name,b.city FROM public.bookmarks m JOIN public.businesses b ON b.id=m.business_id WHERE m.user_id=$1 ORDER BY b.name",
            [id],
          ),
        )
      ).rows,
    );
  }
  const ownerReply = new RegExp("^/v1/places/(" + uuid + ")/reviews/(" + uuid + ")/reply$", "i").exec(path);
  if (ownerReply && method === "PUT") {
    requireUser(id);
    const message = field(await body(req), "body", 2000);
    const answer = await scoped(id, db => db.query(
      "SELECT public.qmaps_publish_owner_reply($1,$2,$3) AS updated",
      [ownerReply[1],ownerReply[2],message]));
    if (!answer.rows[0].updated) throw new ApiError(404, "Avis introuvable");
    return reply(res,204);
  }
  const photo = photoRoute.exec(path);
  if (photo && method === "GET") {
    const value = first(
      await pool.query(
        "SELECT m.mime,m.data FROM qmaps_private.media m JOIN public.businesses b ON b.id=m.business_id AND b.is_active WHERE m.id=$1",
        [photo[1]],
      ),
    );
    res.writeHead(200, {
      "Content-Type": value.mime,
      "Content-Security-Policy": "default-src 'none'",
      "Content-Length": value.data.length,
    });
    return res.end(value.data);
  }
  const place = placeRoute.exec(path);
  if (!place) throw new ApiError(404, "Introuvable");
  const [, business, action] = place;
  if (!action && method === "GET")
    return reply(
      res,
      200,
      first(
        await scoped(null, (db) =>
          db.query(
            `SELECT ${catalogue} FROM public.businesses WHERE id=$1 AND is_active`,
            [business],
          ),
        ),
      ),
    );
  if (action === "reviews" && method === "GET") {
    const reviews = await scoped(id, db => db.query(
      `SELECT r.id,r.rating,r.body,r.created_at,r.owner_reply,r.owner_replied_at,
              COALESCE(p.display_name,'Membre QMAPS') AS author,
              COALESCE(r.user_id=auth.uid(),false) AS mine
       FROM public.reviews r JOIN public.businesses b ON b.id=r.business_id AND b.is_active
       LEFT JOIN public.profiles p ON p.id=r.user_id
       WHERE r.business_id=$1 AND r.moderation_status IN ('visible','trusted')
       ORDER BY r.created_at DESC,r.id LIMIT 100`,[business]));
    return reply(res,200,reviews.rows);
  }
  if (action === "reviews" && method === "PUT") {
    requireUser(id);
    const data = await body(req);
    if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5)
      throw new ApiError(400, "Note de 1 à 5 requise");
    const message = field(data, "body", 4000);
    const review = await scoped(id,async db => {
      const place = first(await db.query(
        "SELECT owner_user_id=$2 AS own FROM public.businesses WHERE id=$1 AND is_active",[business,id]));
      if (place.own) throw new ApiError(403,"Un propriétaire ne peut pas évaluer son commerce");
      return first(await db.query(
        `INSERT INTO public.reviews(business_id,user_id,rating,body) VALUES ($1,$2,$3,$4)
         ON CONFLICT(business_id,user_id) DO UPDATE SET rating=excluded.rating,body=excluded.body RETURNING id`,
        [business,id,data.rating,message]));
    });
    return reply(res,200,review);
  }
  if (action === "reviews" && method === "DELETE") {
    requireUser(id);
    await scoped(id, db => db.query("DELETE FROM public.reviews WHERE business_id=$1 AND user_id=$2",[business,id]));
    return reply(res,204);
  }
  if (action === "posts" && method === "GET")
    return reply(
      res,
      200,
      (
        await scoped(null, (db) =>
          db.query(
            "SELECT id,title,body FROM public.business_content WHERE business_id=$1 AND is_published ORDER BY created_at DESC",
            [business],
          ),
        )
      ).rows,
    );
  if (action === "guest-settings" && method === "GET")
    return reply(
      res,
      200,
      (
        await scoped(null, (db) =>
          db.query(
            "SELECT reservations,waitlist FROM public.guest_services WHERE business_id=$1",
            [business],
          ),
        )
      ).rows[0] || { reservations: false, waitlist: false },
    );
  requireUser(id);
  if (action === "bookmark" && ["PUT", "DELETE"].includes(method)) {
    await scoped(id, async (db) => {
      if (method === "PUT") {
        first(
          await db.query(
            "SELECT id FROM public.businesses WHERE id=$1 AND is_active",
            [business],
          ),
        );
        await db.query(
          "INSERT INTO public.bookmarks(user_id,business_id,list_name) VALUES($1,$2,'saved') ON CONFLICT DO NOTHING",
          [id, business],
        );
      } else
        await db.query(
          "DELETE FROM public.bookmarks WHERE user_id=$1 AND business_id=$2",
          [id, business],
        );
    });
    return reply(res, 204);
  }
  if (action === "posts" && method === "POST") {
    const obj = await body(req);
    return reply(
      res,
      201,
      first(
        await scoped(id, (db) =>
          db.query(
            "INSERT INTO public.business_content(business_id,kind,title,body,is_published) VALUES($1,'post',$2,$3,true) RETURNING id,title",
            [business, field(obj, "title", 100), field(obj, "body", 2000)],
          ),
        ),
      ),
    );
  }
  if (action === "guest-settings" && method === "PUT") {
    const obj = await body(req);
    if (
      typeof obj.waitlist !== "boolean" ||
      typeof obj.reservations !== "boolean"
    )
      throw new ApiError(400, "Choix des services requis");
    await scoped(id, (db) =>
      db.query(
        "INSERT INTO public.guest_services(business_id,waitlist,reservations) VALUES($1,$2,$3) ON CONFLICT(business_id) DO UPDATE SET waitlist=excluded.waitlist,reservations=excluded.reservations",
        [business, obj.waitlist, obj.reservations],
      ),
    );
    return reply(res, 204);
  }
  if (action === "waitlist" && method === "POST") {
    const obj = await body(req);
    if (
      !Number.isInteger(obj.party_size) ||
      obj.party_size < 1 ||
      obj.party_size > 30
    )
      throw new ApiError(400, "Nombre de personnes invalide");
    return reply(
      res,
      201,
      first(
        await scoped(id, (db) =>
          db.query(
            "INSERT INTO public.guest_requests(business_id,kind,party_size,guest_name) VALUES($1,'waitlist',$2,$3) RETURNING id,status",
            [business, obj.party_size, field(obj, "name", 80)],
          ),
        ),
      ),
    );
  }
  if (action === "photos" && method === "POST") {
    const data = await read(req, 3 * 1024 * 1024),
      mime = imageType(data),
      photoId = randomUUID();
    await scoped(id, (db) =>
      db
        .query("SELECT id FROM public.businesses WHERE id=$1 AND is_active", [
          business,
        ])
        .then(first),
    );
    await transaction(pool, async (db) => {
      await db.query("SELECT pg_advisory_xact_lock(hashtext($1))", [id]);
      const used = await db.query(
        "SELECT coalesce(sum(octet_length(data)),0)::int AS bytes FROM qmaps_private.media WHERE user_id=$1",
        [id],
      );
      if (used.rows[0].bytes + data.length > 20 * 1024 * 1024)
        throw new ApiError(413, "Quota de médias atteint");
      await db.query(
        "INSERT INTO qmaps_private.media(id,business_id,user_id,mime,data) VALUES($1,$2,$3,$4,$5)",
        [photoId, business, id, mime, data],
      );
    });
    return reply(res, 201, { id: photoId });
  }
  throw new ApiError(404, "Introuvable");
}
const server = createServer(
  { requestTimeout: 30000, headersTimeout: 15000 },
  async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store");
    try {
      await route(req, res);
    } catch (err) {
      const dbError = { 23505: 409, 23503: 409, 23514: 400, 42501: 403 };
      const status =
        err instanceof ApiError ? err.status : dbError[err.code] || 500;
      if (status === 500)
        console.error("QMAPS request failed", err.code || err.name);
      if (!res.headersSent)
        reply(res, status, {
          error:
            err instanceof ApiError
              ? err.message
              : status === 403
                ? "Accès refusé"
                : status === 409
                  ? "Conflit"
                  : "Requête impossible",
        });
    }
  },
);
server.listen(Number(process.env.PORT || 3000), "0.0.0.0");
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => server.close(() => pool.end()));
