import { ApiError } from "./accounts.mjs";

export async function listPhotos(pool, business, viewer, offset) {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 1000000)
    throw new ApiError(400, "Position de galerie invalide");
  const { rows } = await pool.query(
    `SELECT m.id, m.created_at,
            coalesce(m.user_id=b.owner_user_id,false) AS merchant_photo,
            coalesce(m.user_id=$2::uuid,false) AS mine,
            coalesce(c.photo_id=m.id,false) AS cover
     FROM qmaps_private.media m
     JOIN public.businesses b ON b.id=m.business_id AND b.is_active
     LEFT JOIN qmaps_private.gallery_covers c ON c.business_id=b.id
     WHERE b.id=$1
     ORDER BY cover DESC,m.created_at DESC,m.id LIMIT 25 OFFSET $3`,
    [business, viewer, offset],
  );
  return {
    photos: rows.slice(0, 24),
    next: rows.length === 25 ? offset + 24 : null,
  };
}

export async function changePhoto(pool, photo, viewer, action) {
  if (!viewer) throw new ApiError(401, "Connexion requise");
  if (action === "delete") {
    const result = await pool.query(
      "DELETE FROM qmaps_private.media WHERE id=$1 AND user_id=$2",
      [photo, viewer],
    );
    if (!result.rowCount)
      throw new ApiError(404, "Photo personnelle introuvable");
  } else if (action === "cover") {
    const result = await pool.query(
      `INSERT INTO qmaps_private.gallery_covers(business_id,photo_id)
       SELECT b.id,m.id FROM public.businesses b JOIN qmaps_private.media m ON m.business_id=b.id
       WHERE m.id=$1 AND b.is_active AND m.user_id=$2 AND b.owner_user_id=$2
       ON CONFLICT(business_id) DO UPDATE SET photo_id=excluded.photo_id`,
      [photo, viewer],
    );
    if (!result.rowCount)
      throw new ApiError(403, "Une photo de votre commerce est requise");
  } else {
    const result = await pool.query(
      `WITH eligible AS (
        SELECT m.id FROM qmaps_private.media m JOIN public.businesses b ON b.id=m.business_id
        WHERE m.id=$1 AND b.is_active AND m.user_id<>$2
      ), report AS (
        INSERT INTO qmaps_private.gallery_reports(photo_id,reporter_id)
        SELECT id,$2 FROM eligible ON CONFLICT DO NOTHING
      ) SELECT id FROM eligible`,
      [photo, viewer],
    );
    if (!result.rowCount) throw new ApiError(404, "Photo introuvable");
  }
}
