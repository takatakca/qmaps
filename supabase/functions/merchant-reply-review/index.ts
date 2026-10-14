// Merchant-owned review reply endpoint (not the TAKATAK server-to-server endpoint).
// The public browser supplies a normal Supabase JWT; service-role stays server-side.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const reply = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return reply({ error: "method_not_allowed" }, 405);

  const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return reply({ error: "unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRole) {
    return reply({ error: "not_configured" }, 503);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return reply({ error: "invalid_json" }, 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return reply({ error: "invalid_request" }, 400);
  }

  const record = body as Record<string, unknown>;
  const reviewId = typeof record.reviewId === "string" ? record.reviewId : "";
  const text = typeof record.body === "string" ? record.body.trim().replace(/\s+/g, " ") : "";
  if (!uuid.test(reviewId) || text.length < 1 || text.length > 2000) {
    return reply({ error: "invalid_request" }, 400);
  }

  // Never take the identity or business ownership from the request body.
  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) return reply({ error: "unauthorized" }, 401);

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: review, error: reviewError } = await admin
    .from("reviews")
    .select("id, business_id")
    .eq("id", reviewId)
    .maybeSingle();
  if (reviewError) return reply({ error: "query_failed" }, 503);
  if (!review) return reply({ error: "not_found" }, 404);

  const { data: business, error: businessError } = await admin
    .from("businesses")
    .select("id, owner_user_id")
    .eq("id", review.business_id)
    .maybeSingle();
  if (businessError) return reply({ error: "query_failed" }, 503);
  if (!business || business.owner_user_id !== userData.user.id) {
    return reply({ error: "forbidden" }, 403);
  }

  const { data: saved, error: saveError } = await admin
    .from("reviews")
    .update({ owner_reply: text, owner_replied_at: new Date().toISOString() })
    .eq("id", reviewId)
    .eq("business_id", business.id)
    .select("id, owner_reply, owner_replied_at")
    .maybeSingle();
  if (saveError) return reply({ error: "save_failed" }, 503);
  if (!saved) return reply({ error: "not_found" }, 404);

  return reply({ ok: true, reviewId: saved.id, repliedAt: saved.owner_replied_at });
});
