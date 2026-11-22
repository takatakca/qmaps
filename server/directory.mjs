import { ApiError } from "./accounts.mjs";

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
