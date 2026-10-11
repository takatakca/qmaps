import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { UUID, integrationAuthorized, json } from "../_shared/takatak-auth.ts";

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!(await integrationAuthorized(request))) return json({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json({ error: "Service unavailable" }, 503);

  let body: { reviewId?: unknown; body?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const reviewId = typeof body.reviewId === "string" ? body.reviewId : "";
  const reply = typeof body.body === "string" ? body.body.trim().replace(/\s+/g, " ") : "";
  if (!UUID.test(reviewId) || reply.length < 1 || reply.length > 2000) {
    return json({ error: "Invalid reply" }, 400);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin
    .from("reviews")
    .update({ owner_reply: reply, owner_replied_at: new Date().toISOString() })
    .eq("id", reviewId)
    .select("id, owner_reply")
    .maybeSingle();
  if (error) return json({ error: "Unable to save reply" }, 500);
  if (!data) return json({ error: "Review not found" }, 404);
  return json({ ok: true, reviewId: data.id });
});
