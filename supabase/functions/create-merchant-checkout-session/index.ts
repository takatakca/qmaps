// Phase 7B — Create Stripe Checkout Session for merchant subscriptions.
// Returns a checkout URL for the requested plan, scoped to a business owned by the caller.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Plan = "starter" | "pro" | "premium";
const VALID_PLANS: Plan[] = ["starter", "pro", "premium"];

function planToPriceId(plan: Plan): string | null {
  const map: Record<Plan, string | undefined> = {
    starter: Deno.env.get("STRIPE_STARTER_PRICE_ID"),
    pro: Deno.env.get("STRIPE_PRO_PRICE_ID"),
    premium: Deno.env.get("STRIPE_PREMIUM_PRICE_ID"),
  };
  return map[plan] ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(
        JSON.stringify({
          error: "provider_not_configured",
          message: "Stripe n'est pas encore configuré.",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const body = await req.json().catch(() => null);
    const businessId = typeof body?.business_id === "string" ? body.business_id : null;
    const plan = body?.plan as Plan | undefined;

    if (!businessId || !plan || !VALID_PLANS.includes(plan)) {
      return new Response(
        JSON.stringify({ error: "invalid_input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify ownership
    const { data: biz, error: bizErr } = await supabase
      .from("businesses")
      .select("id, owner_user_id, name")
      .eq("id", businessId)
      .maybeSingle();
    if (bizErr || !biz || biz.owner_user_id !== userId) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const priceId = planToPriceId(plan);
    if (!priceId) {
      return new Response(
        JSON.stringify({
          error: "price_not_configured",
          message: `Le tarif pour le plan ${plan} n'est pas encore configuré.`,
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Look for an existing customer id on the subscription row
    const { data: existingSub } = await supabase
      .from("merchant_subscriptions")
      .select("provider_customer_id")
      .eq("business_id", businessId)
      .maybeSingle();

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    const origin =
      req.headers.get("origin") ||
      req.headers.get("referer") ||
      "https://qmaps.lovable.app";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/merchant/billing?checkout=success`,
      cancel_url: `${origin}/merchant/billing/plans?checkout=cancel`,
      customer: existingSub?.provider_customer_id || undefined,
      client_reference_id: businessId,
      metadata: {
        business_id: businessId,
        user_id: userId,
        plan,
      },
      subscription_data: {
        metadata: {
          business_id: businessId,
          user_id: userId,
          plan,
        },
      },
    });

    return new Response(JSON.stringify({ url: session.url, id: session.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-merchant-checkout-session error", err);
    return new Response(
      JSON.stringify({ error: "internal_error", message: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
