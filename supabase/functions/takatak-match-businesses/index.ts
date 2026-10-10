import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";
import {
  matchBusinessAreas,
  matchScopeScore,
  type ServiceArea,
} from "../_shared/takatak-matching.ts";

const encoder = new TextEncoder();
const MAX_BODY_BYTES = 12_000;
const MAX_AGE_MS = 5 * 60 * 1000;

type CandidateRequest = {
  version: 1;
  requestId: string;
  categorySlug: string;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  limit: number;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}

function hexToBytes(value: string): Uint8Array | null {
  if (!/^[a-f0-9]{64}$/i.test(value)) return null;
  const out = new Uint8Array(value.length / 2);
  for (let i = 0; i < value.length; i += 2) {
    out[i / 2] = Number.parseInt(value.slice(i, i + 2), 16);
  }
  return out;
}

async function verifySignature(
  rawBody: string,
  req: Request,
  integrationId: string,
  secret: string,
): Promise<{ ok: true; eventId: string } | { ok: false }> {
  const receivedIntegration = req.headers.get("x-integration-id")?.trim();
  const eventId = req.headers.get("x-event-id")?.trim() ?? "";
  const timestamp = req.headers.get("x-timestamp")?.trim() ?? "";
  const signature = (
    req.headers.get("x-signature")?.trim().replace(/^sha256=/i, "") ?? ""
  );
  const signatureBytes = hexToBytes(signature);

  if (
    receivedIntegration !== integrationId ||
    !eventId ||
    eventId.length > 160 ||
    !/^\d{10}$/.test(timestamp) ||
    !signatureBytes
  ) {
    return { ok: false };
  }

  const timestampMs = Number(timestamp) * 1000;
  if (
    !Number.isFinite(timestampMs) ||
    Math.abs(Date.now() - timestampMs) > MAX_AGE_MS
  ) {
    return { ok: false };
  }

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    encoder.encode(`${timestamp}.${eventId}.${rawBody}`),
  );

  return valid ? { ok: true, eventId } : { ok: false };
}

function optionalText(value: unknown, max: number): string | null | undefined {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return undefined;
  const clean = value.trim();
  if (!clean || clean.length > max) return undefined;
  return clean;
}

function parseRequest(raw: unknown): CandidateRequest | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const body = raw as Record<string, unknown>;

  if (body.version !== 1) return null;

  const requestId = optionalText(body.requestId, 160);
  const categorySlug = optionalText(body.categorySlug, 160);
  if (
    !requestId ||
    !/^[A-Za-z0-9._:-]{8,160}$/.test(requestId) ||
    !categorySlug ||
    !/^[a-z0-9-]{1,160}$/.test(categorySlug)
  ) {
    return null;
  }

  const city = optionalText(body.city, 120);
  const region = optionalText(body.region, 120);
  const postalCode = optionalText(body.postalCode, 20);
  if (city === undefined || region === undefined || postalCode === undefined) {
    return null;
  }
  if (!city && !region && !postalCode) return null;

  const rawLimit = body.limit ?? 20;
  if (
    typeof rawLimit !== "number" ||
    !Number.isInteger(rawLimit) ||
    rawLimit < 1 ||
    rawLimit > 50
  ) {
    return null;
  }

  return {
    version: 1,
    requestId,
    categorySlug,
    city,
    region,
    postalCode,
    limit: rawLimit,
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return json({ ok: false, error: "unsupported_media_type" }, 415);
  }

  const integrationId = Deno.env.get("TAKATAK_QMAPS_INTEGRATION_ID")?.trim() ?? "";
  const secret = Deno.env.get("TAKATAK_QMAPS_MATCHING_SECRET")?.trim() ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim() ?? "";
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? "";

  if (!integrationId || secret.length < 32 || !supabaseUrl || !serviceRole) {
    return json({ ok: false, error: "not_configured" }, 503);
  }

  const rawBody = await req.text();
  if (encoder.encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return json({ ok: false, error: "payload_too_large" }, 413);
  }

  const auth = await verifySignature(rawBody, req, integrationId, secret);
  if (!auth.ok) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(rawBody);
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const input = parseRequest(decoded);
  if (!input || input.requestId !== auth.eventId) {
    return json({ ok: false, error: "invalid_request" }, 400);
  }

  const db = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: category, error: categoryError } = await db
    .from("categories")
    .select("id, slug, name")
    .eq("slug", input.categorySlug)
    .eq("is_active", true)
    .maybeSingle();

  if (categoryError) {
    console.error("takatak-match category lookup failed", categoryError.code);
    return json({ ok: false, error: "query_failed" }, 503);
  }

  if (!category) {
    return json({
      ok: true,
      requestId: input.requestId,
      categoryFound: false,
      candidates: [],
    });
  }

  const { data: categoryLinks, error: categoryLinksError } = await db
    .from("merchant_service_categories")
    .select("business_id")
    .eq("category_id", category.id)
    .limit(500);

  if (categoryLinksError) {
    console.error("takatak-match category links failed", categoryLinksError.code);
    return json({ ok: false, error: "query_failed" }, 503);
  }

  const businessIds = Array.from(
    new Set((categoryLinks ?? []).map((row) => row.business_id).filter(Boolean)),
  );

  if (businessIds.length === 0) {
    return json({
      ok: true,
      requestId: input.requestId,
      categoryFound: true,
      category: { id: category.id, slug: category.slug, name: category.name },
      candidates: [],
    });
  }

  const [{ data: businesses, error: businessError }, { data: areaRows, error: areaError }] =
    await Promise.all([
      db
        .from("businesses")
        .select(
          "id, name, city, region, postal_code, is_claimed, avg_rating, reviews_count, status",
        )
        .in("id", businessIds)
        .eq("is_active", true)
        .in("status", ["open", "seasonal"])
        .limit(500),
      db
        .from("merchant_service_areas")
        .select("business_id, city, region, postal_code_prefix")
        .in("business_id", businessIds)
        .limit(2000),
    ]);

  if (businessError || areaError) {
    console.error(
      "takatak-match candidate lookup failed",
      businessError?.code ?? areaError?.code ?? "unknown",
    );
    return json({ ok: false, error: "query_failed" }, 503);
  }

  const areas = (areaRows ?? []) as ServiceArea[];
  const candidates = (businesses ?? [])
    .map((business) => {
      const areaMatch = matchBusinessAreas(
        business.id,
        areas,
        {
          city: input.city,
          region: input.region,
          postalCode: input.postalCode,
        },
      );

      if (!areaMatch.matches) return null;

      return {
        qmapsBusinessId: business.id,
        name: business.name,
        city: business.city,
        region: business.region,
        postalCode: business.postal_code,
        isClaimed: business.is_claimed === true,
        avgRating: Number(business.avg_rating ?? 0),
        reviewsCount: Number(business.reviews_count ?? 0),
        status: business.status,
        matchScope: areaMatch.scope,
        matchScore: matchScopeScore(areaMatch.scope),
      };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate))
    .sort(
      (a, b) =>
        b.matchScore - a.matchScore ||
        b.avgRating - a.avgRating ||
        b.reviewsCount - a.reviewsCount ||
        a.name.localeCompare(b.name, "fr-CA"),
    )
    .slice(0, input.limit)
    .map(({ matchScore: _score, ...candidate }) => candidate);

  return json({
    ok: true,
    requestId: input.requestId,
    categoryFound: true,
    category: { id: category.id, slug: category.slug, name: category.name },
    candidates,
  });
});
