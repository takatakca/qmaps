import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { integrationAuthorized } from "../_shared/takatak-auth.ts";
import {
  createReviewVisibilityHandler,
  createReviewStore,
  reviewJSON,
} from "../_shared/takatak-reviews.ts";

Deno.serve(async (request) => {
  const url = Deno.env.get("SUPABASE_URL"),
    key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key)
    return reviewJSON({ ok: false, error: "not_configured" }, 503);
  return createReviewVisibilityHandler({
    authorize: integrationAuthorized,
    store: () =>
      createReviewStore(
        createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
        }),
      ),
  })(request);
});
