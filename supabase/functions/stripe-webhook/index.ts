// Phase 7B — Stripe webhook handler. Source of truth for subscription state.
// Persist a Stripe receipt and any subscription change in one database transaction.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

function acknowledge(duplicate = false) {
  return new Response(JSON.stringify(duplicate ? { received: true, duplicate: true } : { received: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

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
  } catch {
    console.warn("Webhook signature verification failed");
    return new Response("Invalid signature", { status: 400, headers: corsHeaders });
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: existingEvent, error: lookupError } = await admin
      .from("merchant_billing_events")
      .select("id")
      .eq("provider", "stripe")
      .eq("provider_event_id", event.id)
      .limit(1)
      .maybeSingle();
    if (lookupError) throw new Error("Unable to check the Stripe event receipt");
    if (existingEvent) return acknowledge(true);

    let businessId: string | null = null;
    let userId: string | null = null;
    let plan: string | null = null;

    const retrieveSubscription = async (id: string) => {
      try {
        return await stripe.subscriptions.retrieve(id);
      } catch {
        throw new Error("Unable to read the current Stripe subscription");
      }
    };

    const subscriptionState = (sub: Stripe.Subscription, planKey: string) => ({
      plan: planKey,
      status: mapStatus(sub.status),
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
    });
    let subscription: ReturnType<typeof subscriptionState> | null = null;

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
          const sub = await retrieveSubscription(subId);
          subscription = subscriptionState(sub, plan);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const snapshot = event.data.object as Stripe.Subscription;
        businessId = snapshot.metadata?.business_id || null;
        userId = snapshot.metadata?.user_id || null;
        plan = snapshot.metadata?.plan || null;
        if (businessId && userId && plan) {
          // Stripe can deliver an earlier active snapshot after cancellation.
          // Deletion is terminal; creation and updates must use current state.
          const sub = event.type === "customer.subscription.deleted"
            ? snapshot
            : await retrieveSubscription(snapshot.id);
          const currentPlan = sub.metadata?.plan;
          if (sub.id !== snapshot.id || sub.metadata?.business_id !== businessId ||
              sub.metadata?.user_id !== userId || !currentPlan) {
            throw new Error("Stripe subscription no longer matches the event target");
          }
          plan = currentPlan;
          subscription = subscriptionState(sub, currentPlan);
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
        // Ignore events that are not associated with this billing flow.
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
      const { data: applied, error } = await admin.rpc("qmaps_apply_stripe_billing_event", {
        p_event_id: event.id,
        p_event_type: event.type,
        p_business_id: businessId,
        p_user_id: userId,
        p_metadata: safeMetadata,
        p_subscription: subscription,
      });
      if (error || typeof applied !== "boolean") throw new Error("Unable to apply the Stripe event transaction");
      return acknowledge(!applied);
    } else {
      console.warn("Webhook event without business_id metadata", event.id, event.type);
    }

    return acknowledge();
  } catch (err) {
    console.error("stripe-webhook handler error", err);
    return new Response(JSON.stringify({ error: "handler_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
