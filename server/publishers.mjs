import { ApiError } from "./accounts.mjs";

export const termsVersion = "2026-11-21";
export async function publishingTerms(pool, id, accept = false) {
  if (!id) throw new ApiError(401, "Connexion requise");
  const result = accept
    ? await pool.query(
        "UPDATE qmaps_private.accounts SET publication_terms=$2 WHERE user_id=$1 AND publication_terms IS DISTINCT FROM 'suspended' RETURNING publication_terms",
        [id, termsVersion],
      )
    : await pool.query(
        "SELECT publication_terms FROM qmaps_private.accounts WHERE user_id=$1",
        [id],
      );
  if (!result.rowCount || result.rows[0].publication_terms === "suspended")
    throw new ApiError(403, "Publication suspendue");
  return {
    version: termsVersion,
    accepted: result.rows[0].publication_terms === termsVersion,
  };
}

export async function blockPublisher(pool, id, place) {
  const result = await pool.query(
    `INSERT INTO qmaps_private.publisher_blocks(viewer,publisher,label)
     SELECT $1,owner_user_id,name FROM public.businesses WHERE id=$2 AND is_active AND owner_user_id<>$1
     ON CONFLICT(viewer,publisher) DO NOTHING RETURNING id`,
    [id, place],
  );
  if (!result.rowCount) {
    const already = await pool.query(
      "SELECT 1 FROM qmaps_private.publisher_blocks p JOIN public.businesses b ON b.owner_user_id=p.publisher WHERE p.viewer=$1 AND b.id=$2",
      [id, place],
    );
    if (!already.rowCount) throw new ApiError(404, "Éditeur indisponible");
  }
}
