import { createHash } from "node:crypto";
import { ApiError } from "./accounts.mjs";
import { matchesDirectoryOpen, matchesDirectoryServices, quebecSearchTime, services } from "./directory-result-filters.mjs";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const visible = `b.is_active AND b.status IN ('open', 'temporarily_closed', 'seasonal')
  AND public.qmaps_can_see_publisher(b.owner_user_id)`;
const columns = `b.id, b.name, b.city, b.address, b.description, b.phone, b.website,
  b.latitude, b.longitude, b.avg_rating::float8 AS avg_rating, b.reviews_count,
  b.price_level, b.is_open, b.status, b.hours, b.hours_json, b.special_hours,
  b.amenities, b.attributes, b.image_url, b.photos, b.is_claimed, b.created_at,
  coalesce((
    SELECT json_agg(json_build_object('categories', json_build_object(
      'id', c.id, 'name', c.name, 'slug', c.slug)) ORDER BY c.sort_order, c.name, c.id)
    FROM public.business_categories bc JOIN public.categories c ON c.id = bc.category_id
    WHERE bc.business_id = b.id AND c.is_active
  ), '[]'::json) AS business_categories`;

function cursor(params) {
  const after = params.get("after");
  if (after !== null && !uuid.test(after)) throw new ApiError(400, "Curseur invalide");
  return after;
}

function limit(params) {
  const value = params.get("limit") ?? "100";
  if (!/^\d{1,3}$/.test(value) || Number(value) < 1 || Number(value) > 250)
    throw new ApiError(400, "Taille de page invalide");
  return Number(value);
}

function page(rows, size) {
  const items = rows.slice(0, size);
  return { items, next: rows.length > size ? items[items.length - 1].id : null };
}

function coordinate(params, key, bound) {
  const values = params.getAll(key);
  const value = Number(values[0]);
  if (values.length !== 1 || !/^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(values[0]) ||
      !Number.isFinite(value) || Math.abs(value) > bound)
    throw new ApiError(400, "Coordonnées invalides");
  return value;
}

export async function directoryCategories(db, params) {
  const size = limit(params);
  const { rows } = await db.query(`
    SELECT id, name, slug, icon, parent_id, category_type, sort_order
    FROM public.categories
    WHERE is_active AND ($1::uuid IS NULL OR id > $1::uuid)
    ORDER BY id LIMIT $2`, [cursor(params), size + 1]);
  return page(rows, size);
}

export async function directoryDetail(db, id) {
  const { rows } = await db.query(`
    SELECT ${columns} FROM public.businesses b
    WHERE ${visible} AND b.id = $1`, [id]);
  if (!rows.length) throw new ApiError(404, "Fiche introuvable");
  return rows[0];
}

export async function directorySearch(db, params) {
  const size = limit(params);
  const ranked = params.get("order") === "rating";
  if (ranked && params.has("after")) throw new ApiError(400, "Curseur incompatible avec le classement");
  const name = (params.get("q") ?? "").trim();
  const city = (params.get("city") ?? "").trim();
  const category = (params.get("category") ?? "").trim();
  const matches = params.getAll("match");
  const prices = params.getAll("price");
  const rating = params.get("rating");
  if (name.length > 150 || city.length > 120 || category.length > 150 ||
      matches.length > 100 || matches.some(value => !uuid.test(value)) ||
      prices.length > 4 || prices.some(value => !/^[1-4]$/.test(value)) ||
      (rating !== null && (!/^[0-5](?:\.\d+)?$/.test(rating) || Number(rating) > 5)))
    throw new ApiError(400, "Filtres de recherche invalides");

  const { rows } = await db.query(`
    SELECT ${columns} FROM public.businesses b
    WHERE ${visible}
      AND ($1 = '' OR lower(unaccent(b.city)) = lower(unaccent($1)))
      AND ($2::uuid IS NULL OR b.id > $2::uuid)
      AND ($3::int[] = '{}' OR b.price_level = ANY($3::int[]))
      AND ($4::float8 IS NULL OR b.avg_rating >= $4::float8)
      AND ($5 = '' OR EXISTS (
        SELECT 1 FROM public.business_categories bc
        JOIN public.categories c ON c.id = bc.category_id AND c.is_active
        JOIN public.categories chosen ON chosen.slug = $5 AND chosen.is_active
        WHERE bc.business_id = b.id AND (c.id = chosen.id OR c.parent_id = chosen.id)))
      AND ($6 = '' OR strpos(lower(unaccent(b.name)), lower(unaccent($6))) > 0
        OR strpos(lower(unaccent(b.city)), lower(unaccent($6))) > 0
        OR strpos(lower(unaccent(coalesce(b.description, ''))), lower(unaccent($6))) > 0
        OR ($5 = '' AND EXISTS (
          SELECT 1 FROM public.business_categories bc JOIN public.categories c ON c.id = bc.category_id AND c.is_active
          WHERE bc.business_id = b.id AND (c.id = ANY($7::uuid[]) OR c.parent_id = ANY($7::uuid[])))))
    ORDER BY CASE WHEN $9::boolean THEN b.avg_rating END DESC NULLS LAST, b.id LIMIT $8`,
    [city, cursor(params), prices.map(Number), rating === null ? null : Number(rating),
      category, name, matches, ranked ? size : size + 1, ranked]);
  return page(rows, size);
}

export async function directoryNearby(db, params) {
  const latitude = coordinate(params, "lat", 90);
  const longitude = coordinate(params, "lng", 180);
  const limits = params.getAll("limit");
  const requested = limits[0] ?? "6";
  const size = Number(requested);
  if (limits.length > 1 || !/^\d{1,2}$/.test(requested) || size < 1 || size > 24)
    throw new ApiError(400, "Taille de page invalide");

  const { rows } = await db.query(`
    SELECT ${columns}, ST_Distance(b.location, origin.point) AS distance_meters
    FROM public.businesses b
    CROSS JOIN (
      SELECT ST_SetSRID(ST_MakePoint($1::float8, $2::float8), 4326)::geography AS point
    ) AS origin
    WHERE ${visible} AND b.location IS NOT NULL
      AND ST_DWithin(b.location, origin.point, 10000)
    ORDER BY distance_meters, b.id LIMIT $3`, [longitude, latitude, size]);
  return { items: rows, next: null };
}

const missingDistance = "1e20::float8";
const resultRanks = new Map([
  ["recommended", "CASE WHEN b.avg_rating = 0 THEN 0::float8 ELSE -(b.avg_rating::float8 * log(10 + greatest(0, b.reviews_count)::float8)) END"],
  ["rating", "-b.avg_rating::float8"],
  ["reviews", "-b.reviews_count::float8"],
  ["newest", "-extract(epoch FROM b.created_at)::float8"],
  ["distance", `coalesce(distance.meters, ${missingDistance})`],
]);
const resultsVisible = `b.is_active AND b.status IN ('open', 'temporarily_closed', 'seasonal')
  AND (b.owner_user_id IS NULL OR public.qmaps_can_see_publisher(b.owner_user_id))`;
const uniqueSorted = values => [...new Set(values)].sort();
function one(params, key, fallback = null) {
  const values = params.getAll(key);
  if (values.length > 1) throw new ApiError(400, "Filtres de recherche invalides");
  return values[0] ?? fallback;
}
function readResultsOptions(params) {
  const size = one(params, "limit", "24"), name = one(params, "q", "").trim();
  const city = one(params, "city", "").trim(), category = one(params, "category", "").trim();
  const matches = params.getAll("match"), prices = params.getAll("price"), requested = params.getAll("service");
  const rating = one(params, "rating"), sort = one(params, "sort", "recommended");
  const open = one(params, "open"), radius = one(params, "radius");
  const after = one(params, "after");
  const useCoordinates = params.has("lat") || params.has("lng") || radius !== null || sort === "distance";
  if (!/^\d{1,2}$/.test(size) || Number(size) < 1 || Number(size) > 48)
    throw new ApiError(400, "Taille de page invalide");
  if (name.length > 150 || city.length > 120 || category.length > 150 ||
      matches.length > 100 || matches.some(value => !uuid.test(value)) ||
      prices.length > 4 || prices.some(value => !/^[1-4]$/.test(value)) ||
      (rating !== null && (!/^[0-5](?:\.\d+)?$/.test(rating) || Number(rating) > 5)) ||
      requested.length > services.length || requested.some(value => !services.includes(value)) ||
      !resultRanks.has(sort) || (open !== null && open !== "1") ||
      (radius !== null && !["1", "3", "5", "10", "25", "50"].includes(radius)))
    throw new ApiError(400, "Filtres de recherche invalides");
  return { size: Number(size), after, search: {
    name, city, category, matches: name && !category ? uniqueSorted(matches.map(v => v.toLowerCase())) : [],
    prices: uniqueSorted(prices.map(Number)), rating: rating === null ? null : Number(rating),
    sort, open: open === "1", services: uniqueSorted(requested), radius: radius === null ? null : Number(radius),
    latitude: useCoordinates ? coordinate(params, "lat", 90) : null,
    longitude: useCoordinates ? coordinate(params, "lng", 180) : null,
  } };
}

function readResultsCursor(value, fingerprint) {
  if (value === null) return null;
  let decoded;
  try {
    if (!/^[A-Za-z0-9_-]{1,512}$/.test(value)) throw Error();
    const bytes = Buffer.from(value, "base64url");
    if (bytes.toString("base64url") !== value) throw Error();
    decoded = JSON.parse(bytes.toString("utf8"));
    if (!Array.isArray(decoded) || decoded.length !== 4 || decoded[0] !== 1 ||
        typeof decoded[1] !== "string" || !/^[a-f0-9]{64}$/.test(decoded[1]) ||
        !Number.isFinite(decoded[2]) || typeof decoded[3] !== "string" || !uuid.test(decoded[3]))
      throw Error();
  } catch {
    throw new ApiError(400, "Curseur invalide");
  }
  if (decoded[1] !== fingerprint) throw new ApiError(409, "Curseur périmé");
  return { rank: decoded[2], id: decoded[3] };
}

function resultDistance(latitude, longitude) {
  // Same rounded spherical distance as the pre-pagination browser filter.
  // ST_DWithin is only the indexed prefilter, using a 1m allowance for the
  // two spherical radius constants and rounding at the exact boundary.
  return `CROSS JOIN LATERAL (
    SELECT CASE WHEN b.location IS NOT NULL THEN round(12742000 * asin(sqrt(least(1,
      sin(radians(b.latitude - ${latitude}::float8) / 2) ^ 2 +
      cos(radians(${latitude}::float8)) * cos(radians(b.latitude)) *
      sin(radians(b.longitude - ${longitude}::float8) / 2) ^ 2
    )))) END AS meters
  ) distance`;
}

export async function directoryResults(db, params, viewer) {
  const { size, after, search } = readResultsOptions(params);
  if (search.name || search.city) {
    const { rows } = await db.query(
      "SELECT lower(unaccent($1::text)) AS name, lower(unaccent($2::text)) AS city",
      [search.name, search.city]);
    Object.assign(search, rows[0]);
  }
  const fingerprint = createHash("sha256").update(JSON.stringify([viewer, search])).digest("hex");
  const position = readResultsCursor(after, fingerprint);
  const values = [], where = [resultsVisible];
  const arg = value => "$" + values.push(value);
  let distance = "";
  if (search.latitude !== null && (search.radius !== null || search.sort === "distance")) {
    const lat = arg(search.latitude), lng = arg(search.longitude);
    distance = resultDistance(lat, lng);
    if (search.radius !== null) {
      const radius = arg(search.radius * 1000);
      where.push(`b.location IS NOT NULL
        AND ST_DWithin(b.location, ST_SetSRID(ST_MakePoint(${lng}::float8, ${lat}::float8), 4326)::geography,
          ${radius}::float8 + 1, false)
        AND distance.meters <= ${radius}::float8`);
    }
  }
  if (search.city) where.push(`lower(unaccent(b.city)) = ${arg(search.city)}`);
  if (search.prices.length) where.push(`b.price_level = ANY(${arg(search.prices)}::int[])`);
  if (search.rating !== null) where.push(`b.avg_rating >= ${arg(search.rating)}::numeric`);
  if (search.category) where.push(`EXISTS (
    SELECT 1 FROM public.business_categories bc
      JOIN public.categories c ON c.id = bc.category_id AND c.is_active
      JOIN public.categories chosen ON chosen.slug = ${arg(search.category)} AND chosen.is_active
    WHERE bc.business_id = b.id AND (c.id = chosen.id OR c.parent_id = chosen.id))`);
  if (search.name) {
    const q = arg(search.name);
    const matchIds = search.matches.length ? arg(search.matches) : null;
    const matches = matchIds ? `OR EXISTS (
      SELECT 1 FROM public.business_categories bc
        JOIN public.categories c ON c.id = bc.category_id AND c.is_active
      WHERE bc.business_id = b.id AND
        (c.id = ANY(${matchIds}::uuid[]) OR c.parent_id = ANY(${matchIds}::uuid[])))` : "";
    where.push(`(strpos(lower(unaccent(b.name)), ${q}) > 0
      OR strpos(lower(unaccent(b.city)), ${q}) > 0
      OR strpos(lower(unaccent(coalesce(b.description, ''))), ${q}) > 0 ${matches})`);
  }
  const postColumns = [];
  if (search.open) {
    where.push("(b.status = 'open' AND (b.hours_json IS NOT NULL OR b.special_hours IS NOT NULL OR b.is_open))");
    postColumns.push("b.status", "b.hours_json", "b.special_hours", "b.is_open", "b.hours");
  }
  if (search.services.length) {
    where.push("(cardinality(b.amenities) > 0 OR jsonb_typeof(b.attributes->'boolean') = 'object')");
    postColumns.push("b.amenities", "b.attributes");
  }
  const keyset = position
    ? `WHERE (ordered.rank_key, ordered.id) > (${arg(position.rank)}::float8, ${arg(position.id)}::uuid)` : "";
  const budget = postColumns.length ? 384 : size;
  const { rows: candidates } = await db.query(`
    SELECT * FROM (
      SELECT b.id, ${resultRanks.get(search.sort)} AS rank_key
        ${postColumns.length ? ", " + postColumns.join(", ") : ""}
      FROM public.businesses b ${distance}
      WHERE ${where.join("\n        AND ")}
    ) ordered ${keyset}
    ORDER BY ordered.rank_key, ordered.id LIMIT ${arg(budget + 1)}`, values);
  const ids = [], time = search.open ? quebecSearchTime() : null;
  let examined = 0;
  while (examined < Math.min(candidates.length, budget) && ids.length < size) {
    const row = candidates[examined++];
    if (time && !matchesDirectoryOpen(row, time)) continue;
    if (search.services.length && !matchesDirectoryServices(row, search.services)) continue;
    ids.push(row.id);
  }
  // Resume after the last inspected candidate, not after the last match.
  // A sparse page may be empty without being the end of the global lane.
  const final = candidates[examined - 1];
  const next = examined < candidates.length
    ? Buffer.from(JSON.stringify([1, fingerprint, final.rank_key, final.id])).toString("base64url")
    : null;
  if (!ids.length) return { items: [], next };
  const hasCoords = search.latitude !== null;
  const { rows: items } = await db.query(`
    SELECT ${columns}${hasCoords ? ", distance.meters AS distance_meters" : ""}
    FROM public.businesses b ${hasCoords ? resultDistance("$2", "$3") : ""}
    WHERE b.id = ANY($1::uuid[]) AND ${resultsVisible}
    ORDER BY array_position($1::uuid[], b.id)`,
  hasCoords ? [ids, search.latitude, search.longitude] : [ids]);
  return { items, next };
}

export async function directoryPreferences(db, userId) {
  const { rows } = await db.query(`
    WITH recent AS (
      SELECT business_id FROM public.qmaps_directory_preferences
      WHERE user_id = $1 AND NOT dismissed AND viewed_at IS NOT NULL
      ORDER BY viewed_at DESC, business_id LIMIT 25
    )
    SELECT b.id, b.city, false AS dismissed, ARRAY(
      SELECT c.id FROM public.business_categories bc
      JOIN public.categories c ON c.id = bc.category_id AND c.is_active
      WHERE bc.business_id = b.id ORDER BY c.id
    ) AS category_ids
    FROM recent JOIN public.businesses b ON b.id = recent.business_id WHERE ${visible}
    UNION ALL
    SELECT business_id, NULL, true, '{}'::uuid[]
    FROM public.qmaps_directory_preferences WHERE user_id = $1 AND dismissed`, [userId]);
  return rows;
}

export async function saveDirectoryPreference(db, userId, businessId, action) {
  if (!["view", "dismiss"].includes(action)) throw new ApiError(400, "Action invalide");
  const result = await db.query(`
    INSERT INTO public.qmaps_directory_preferences (user_id, business_id, viewed_at, dismissed)
    SELECT $1, b.id, CASE WHEN $3 = 'view' THEN now() END, $3 = 'dismiss'
    FROM public.businesses b WHERE b.id = $2 AND ${visible}
    ON CONFLICT (user_id, business_id) DO UPDATE SET
      viewed_at = coalesce(excluded.viewed_at, qmaps_directory_preferences.viewed_at),
      dismissed = excluded.dismissed OR qmaps_directory_preferences.dismissed
    WHERE excluded.dismissed OR NOT qmaps_directory_preferences.dismissed`, [userId, businessId, action]);
  if (!result.rowCount) {
    // A dismissed listing stays dismissed when visited again.
    await directoryDetail(db, businessId);
  }
}
