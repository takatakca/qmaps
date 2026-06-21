// Phase 7B — Stripe webhook handler. Source of truth for subscription state.
// Signature is verified; idempotency enforced via merchant_billing_events.provider_event_id.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

function mapStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case "trialing":
    case "active":
    case "past_due":
    case "canceled":
    case "incomplete":
      return stripeStatus;
    case "incomplete_expired":
      return "incomplete";
    case "unpaid":
      return "past_due";
    case "paused":
      return "canceled";
    default:
      return "incomplete";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    return new Response(
      JSON.stringify({ error: "provider_not_configured" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response("Missing signature", { status: 400, headers: corsHeaders });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return new Response("Invalid signature", { status: 400, headers: corsHeaders });
  }

  // Use service role for trusted server-side writes.
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Idempotency: skip if we've already processed this event id.
  const { data: existingEvent } = await admin
    .from("merchant_billing_events")
    .select("id")
    .eq("provider", "stripe")
    .eq("provider_event_id", event.id)
    .maybeSingle();
  if (existingEvent) {
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    let businessId: string | null = null;
    let userId: string | null = null;
    let plan: string | null = null;

    const upsertSubscription = async (
      sub: Stripe.Subscription,
      bId: string,
      uId: string,
      planKey: string
    ) => {
      const row = {
        business_id: bId,
        user_id: uId,
        plan: planKey,
        status: mapStatus(sub.status),
        provider: "stripe",
        provider_customer_id:
          typeof sub.customer === "string" ? sub.customer : sub.customer.id,
        provider_subscription_id: sub.id,
        current_period_start: sub.current_period_start
          ? new Date(sub.current_period_start * 1000).toISOString()
          : null,
        current_period_end: sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null,
        cancel_at_period_end: !!sub.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      };
      await admin
        .from("merchant_subscriptions")
        .upsert(row, { onConflict: "business_id" });
    };

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        businessId =
          (session.metadata?.business_id as string) ||
          (session.client_reference_id as string) ||
          null;
        userId = (session.metadata?.user_id as string) || null;
        plan = (session.metadata?.plan as string) || null;
        if (businessId && userId && plan && session.subscription) {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await upsertSubscription(sub, businessId, userId, plan);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        businessId = (sub.metadata?.business_id as string) || null;
        userId = (sub.metadata?.user_id as string) || null;
        plan = (sub.metadata?.plan as string) || null;
        if (businessId && userId && plan) {
          await upsertSubscription(sub, businessId, userId, plan);
        }
        break;
      }
      case "invoice.payment_succeeded":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        businessId = (invoice.subscription_details?.metadata?.business_id as string) || null;
        userId = (invoice.subscription_details?.metadata?.user_id as string) || null;
        plan = (invoice.subscription_details?.metadata?.plan as string) || null;
        // Status will follow via subscription.updated; we just log this event below.
        break;
      }
      default:
        // Unhandled events still get logged for audit trail.
        break;
    }

    // Build a compact, safe metadata payload — never the full Stripe object.
    const safeMetadata: Record<string, unknown> = {
      plan,
      raw_type: event.type,
    };
    if (event.type.startsWith("invoice.")) {
      const inv = event.data.object as Stripe.Invoice;
      safeMetadata.amount_due = inv.amount_due;
      safeMetadata.amount_paid = inv.amount_paid;
      safeMetadata.currency = inv.currency;
    }

    if (businessId) {
      await admin.from("merchant_billing_events").insert({
        business_id: businessId,
        user_id: userId,
        event_type: event.type,
        provider: "stripe",
        provider_event_id: event.id,
        metadata: safeMetadata as never,
      });
    } else {
      console.warn("Webhook event without business_id metadata", event.id, event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("stripe-webhook handler error", err);
    return new Response(JSON.stringify({ error: "handler_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
