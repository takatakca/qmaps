import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { UUID, integrationAuthorized, json } from "../_shared/takatak-auth.ts";
import { readReviewJSON } from "../_shared/takatak-reviews.ts";

Deno.serve(async (request) => {
  if (request.method !== "POST")
    return json({ error: "Method not allowed" }, 405);
  if (!(await integrationAuthorized(request)))
    return json({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey)
    return json({ error: "Service unavailable" }, 503);

  const decoded = await readReviewJSON(request);
  if (decoded.ok === false) return decoded.response;
  const body = decoded.value;
  const businessId = typeof body.businessId === "string" ? body.businessId : "";
  const clientId = typeof body.clientId === "string" ? body.clientId : "";
  if (!UUID.test(businessId) || !UUID.test(clientId))
    return json({ error: "Invalid ids" }, 400);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin
    .from("businesses")
    .update({ takatak_client_id: clientId })
    .eq("id", businessId)
    .or(`takatak_client_id.is.null,takatak_client_id.eq.${clientId}`)
    .select("id, takatak_client_id")
    .maybeSingle();
  if (error) return json({ error: "Unable to link business" }, 500);
  if (!data)
    return json(
      { error: "Business unavailable or linked to another workspace" },
      404,
    );
  return json({
    ok: true,
    businessId: data.id,
    clientId: data.takatak_client_id,
  });
});
