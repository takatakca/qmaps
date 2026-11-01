// QMAPS-owned server adapter. No user profiles, contacts, private moderation
// details, or service-role credentials cross the TAKATAK review boundary.
export const REVIEW_BODY_LIMIT = 16_384;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_STATUS = ["visible", "trusted"];
export type ReviewCursor = { createdAt: string; id: string };
export type QmapsReview = {
  id: string;
  businessId: string;
  author: string;
  rating: number;
  body: string | null;
  createdAt: string;
  updatedAt: string;
  ownerReply: string | null;
  ownerRepliedAt: string | null;
};
export interface ReviewStore {
  linkedBusiness(clientId: string, businessId: string): Promise<boolean>;
  reviews(
    businessId: string,
    take: number,
    cursor: ReviewCursor | null,
  ): Promise<QmapsReview[]>;
  reply(
    businessId: string,
    reviewId: string,
    body: string,
    now: string,
  ): Promise<{ id: string; ownerReply: string; ownerRepliedAt: string } | null>;
}
type Dependencies = {
  authorize: (request: Request) => Promise<boolean>;
  store: () => ReviewStore;
  now?: () => Date;
};
const record = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
const keys = (value: Record<string, unknown>, allowed: string[]) =>
  Object.keys(value).every((key) => allowed.includes(key));
const id = (value: unknown): value is string =>
  typeof value === "string" && UUID.test(value);
export function reviewJSON(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
function timestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parts =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.exec(
      value,
    );
  if (!parts || !Number.isFinite(Date.parse(value))) return false;
  const year = Number(parts[1]),
    month = Number(parts[2]),
    day = Number(parts[3]);
  return (
    year >= 1970 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= new Date(Date.UTC(year, month, 0)).getUTCDate() &&
    Number(parts[4]) < 24 &&
    Number(parts[5]) < 60 &&
    Number(parts[6]) < 60
  );
}
export function parseReviewCursor(value: unknown): ReviewCursor | null | false {
  if (value === undefined || value === null) return null;
  const row = record(value);
  if (
    !row ||
    !keys(row, ["createdAt", "id"]) ||
    !timestamp(row.createdAt) ||
    !id(row.id)
  )
    return false;
  return { createdAt: row.createdAt, id: row.id };
}
export async function readReviewJSON(
  request: Request,
): Promise<
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; response: Response }
> {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .includes("application/json")
  )
    return {
      ok: false,
      response: reviewJSON({ ok: false, error: "unsupported_media_type" }, 415),
    };
  const reader = request.body?.getReader();
  if (!reader)
    return {
      ok: false,
      response: reviewJSON({ ok: false, error: "invalid_json" }, 400),
    };
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > REVIEW_BODY_LIMIT) {
        await reader.cancel();
        return {
          ok: false,
          response: reviewJSON({ ok: false, error: "payload_too_large" }, 413),
        };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const value = record(
      JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)),
    );
    if (!value) throw new Error("invalid_json");
    return { ok: true, value };
  } catch {
    return {
      ok: false,
      response: reviewJSON({ ok: false, error: "invalid_json" }, 400),
    };
  }
}
async function authorizedInput(request: Request, deps: Dependencies) {
  if (request.method !== "POST")
    return {
      ok: false as const,
      response: reviewJSON({ ok: false, error: "method_not_allowed" }, 405),
    };
  if (!(await deps.authorize(request)))
    return {
      ok: false as const,
      response: reviewJSON({ ok: false, error: "unauthorized" }, 401),
    };
  return readReviewJSON(request);
}
export function createReviewFeedHandler(deps: Dependencies) {
  return async (request: Request): Promise<Response> => {
    try {
      const decoded = await authorizedInput(request, deps);
      if (decoded.ok === false) return decoded.response;
      const input = decoded.value;
      const cursor = parseReviewCursor(input.cursor),
        limit = input.limit ?? 50;
      if (
        !keys(input, [
          "version",
          "clientId",
          "businessId",
          "limit",
          "cursor",
        ]) ||
        input.version !== 1 ||
        !id(input.clientId) ||
        !id(input.businessId) ||
        !Number.isInteger(limit) ||
        typeof limit !== "number" ||
        limit < 1 ||
        limit > 100 ||
        cursor === false
      )
        return reviewJSON({ ok: false, error: "invalid_request" }, 400);
      const store = deps.store();
      if (!(await store.linkedBusiness(input.clientId, input.businessId)))
        return reviewJSON({ ok: false, error: "not_found" }, 404);
      const all = await store.reviews(input.businessId, limit + 1, cursor);
      const hasMore = all.length > limit,
        reviews = all.slice(0, limit);
      const last = reviews[reviews.length - 1];
      return reviewJSON({
        ok: true,
        version: 1,
        clientId: input.clientId,
        businessId: input.businessId,
        reviews,
        hasMore,
        nextCursor:
          hasMore && last ? { createdAt: last.createdAt, id: last.id } : null,
      });
    } catch {
      return reviewJSON({ ok: false, error: "source_unavailable" }, 503);
    }
  };
}
export function createReviewReplyHandler(deps: Dependencies) {
  return async (request: Request): Promise<Response> => {
    try {
      const decoded = await authorizedInput(request, deps);
      if (decoded.ok === false) return decoded.response;
      const input = decoded.value;
      const body =
        typeof input.body === "string"
          ? input.body.trim().replace(/\s+/g, " ")
          : "";
      if (
        !keys(input, [
          "version",
          "clientId",
          "businessId",
          "reviewId",
          "body",
        ]) ||
        input.version !== 1 ||
        !id(input.clientId) ||
        !id(input.businessId) ||
        !id(input.reviewId) ||
        !body ||
        body.length > 2000 ||
        Array.from(body).some((character) => {
          const code = character.charCodeAt(0);
          return (code < 32 && ![9, 10, 13].includes(code)) || code === 127;
        })
      )
        return reviewJSON({ ok: false, error: "invalid_reply" }, 400);
      const store = deps.store();
      if (!(await store.linkedBusiness(input.clientId, input.businessId)))
        return reviewJSON({ ok: false, error: "not_found" }, 404);
      const saved = await store.reply(
        input.businessId,
        input.reviewId,
        body,
        (deps.now?.() ?? new Date()).toISOString(),
      );
      if (!saved) return reviewJSON({ ok: false, error: "not_found" }, 404);
      if (
        saved.id !== input.reviewId ||
        saved.ownerReply !== body ||
        !timestamp(saved.ownerRepliedAt)
      )
        return reviewJSON({ ok: false, error: "source_unavailable" }, 503);
      return reviewJSON({
        ok: true,
        version: 1,
        clientId: input.clientId,
        businessId: input.businessId,
        reviewId: saved.id,
        ownerReply: saved.ownerReply,
        ownerRepliedAt: saved.ownerRepliedAt,
      });
    } catch {
      return reviewJSON({ ok: false, error: "source_unavailable" }, 503);
    }
  };
}

// Minimal server-owned Supabase query surface. Kept injectable so tests execute
// the actual scope/keyset filters rather than merely searching source strings.
type Result = { data: unknown; error: unknown };
interface Query extends PromiseLike<Result> {
  select(columns: string): Query;
  eq(column: string, value: unknown): Query;
  in(column: string, values: string[]): Query;
  is(column: string, value: null): Query;
  or(filter: string): Query;
  order(column: string, options: { ascending: boolean }): Query;
  limit(take: number): Query;
  update(value: Record<string, unknown>): Query;
  maybeSingle(): Query;
}
export function createReviewStore(database: {
  from(table: string): unknown;
}): ReviewStore {
  const query = (table: string) => database.from(table) as Query;
  return {
    async linkedBusiness(clientId, businessId) {
      const { data, error } = await query("businesses")
        .select("id,takatak_client_id")
        .eq("id", businessId)
        .eq("takatak_client_id", clientId)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw new Error("business_query_failed");
      const row = record(data);
      return row?.id === businessId && row.takatak_client_id === clientId;
    },
    async reviews(businessId, take, cursor) {
      let scoped = query("reviews")
        .select(
          "id,business_id,rating,body,created_at,updated_at,owner_reply,owner_replied_at",
        )
        .eq("business_id", businessId)
        .in("moderation_status", ALLOWED_STATUS)
        .is("hidden_at", null)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(take);
      if (cursor)
        scoped = scoped.or(
          `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
        );
      const { data, error } = await scoped;
      if (error || !Array.isArray(data)) throw new Error("review_query_failed");
      return data.map((value) => {
        const row = record(value);
        if (
          !row ||
          !id(row.id) ||
          row.business_id !== businessId ||
          !Number.isInteger(row.rating) ||
          typeof row.rating !== "number" ||
          row.rating < 1 ||
          row.rating > 5 ||
          !timestamp(row.created_at) ||
          !timestamp(row.updated_at) ||
          (row.body !== null && typeof row.body !== "string") ||
          (row.owner_reply !== null && typeof row.owner_reply !== "string") ||
          (row.owner_replied_at !== null && !timestamp(row.owner_replied_at))
        )
          throw new Error("invalid_source_review");
        return {
          id: row.id,
          businessId,
          author: "QMAPS customer",
          rating: row.rating,
          body: row.body as string | null,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          ownerReply: row.owner_reply as string | null,
          ownerRepliedAt: row.owner_replied_at as string | null,
        };
      });
    },
    async reply(businessId, reviewId, body, now) {
      const { data, error } = await query("reviews")
        .update({ owner_reply: body, owner_replied_at: now })
        .eq("id", reviewId)
        .eq("business_id", businessId)
        .in("moderation_status", ALLOWED_STATUS)
        .is("hidden_at", null)
        .select("id,owner_reply,owner_replied_at")
        .maybeSingle();
      if (error) throw new Error("reply_query_failed");
      const row = record(data);
      return row
        ? {
            id: String(row.id),
            ownerReply: String(row.owner_reply),
            ownerRepliedAt: String(row.owner_replied_at),
          }
        : null;
    },
  };
}
