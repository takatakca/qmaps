import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";
import { resolveCheckoutReturnOrigin } from "../../supabase/functions/_shared/checkout-return-origin";

type Handler = (request: Request) => Promise<Response>;
type StripeRoute =
  | "create-merchant-checkout-session"
  | "create-merchant-billing-portal-session"
  | "stripe-webhook";

const businessId = "10000000-0000-4000-8000-000000000001";
const userId = "20000000-0000-4000-8000-000000000001";

function loadHandler(route: StripeRoute, supabase: object, stripe: object) {
  const source = readFileSync(join(process.cwd(), "supabase/functions", route, "index.ts"), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  const env = {
    STRIPE_SECRET_KEY: "local-test-key",
    STRIPE_WEBHOOK_SECRET: "local-test-signature-secret",
    STRIPE_PRO_PRICE_ID: "price_test_pro",
    SUPABASE_URL: "https://test.invalid",
    SUPABASE_ANON_KEY: "local-test-anon",
    SUPABASE_SERVICE_ROLE_KEY: "local-test-service-role",
  };
  let handler: Handler | undefined;
  runInNewContext(outputText, {
    exports: {},
    Deno: {
      env: { get: (key: keyof typeof env) => env[key] },
      serve: (run: Handler) => { handler = run; },
    },
    Response,
    console: { error: vi.fn(), warn: vi.fn() },
    require: (specifier: string) => {
      if (specifier.startsWith("https://esm.sh/@supabase/supabase-js@")) {
        return { createClient: () => supabase };
      }
      if (specifier.startsWith("https://esm.sh/stripe@")) {
        return class { constructor() { return stripe; } };
      }
      if (specifier === "../_shared/checkout-return-origin.ts") return { resolveCheckoutReturnOrigin };
      throw new Error("Unexpected dependency " + specifier);
    },
  }, { filename: route + "/index.ts" });
  if (!handler) throw new Error("Edge function did not register its handler");
  return handler;
}

describe("merchant Stripe sessions", () => {
  it.each([
    ["create-merchant-checkout-session", "checkout"],
    ["create-merchant-billing-portal-session", "portal"],
  ] as const)("authenticates with the pinned Supabase client in %s", async (route, sessionKind) => {
    const getUser = vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null });
    const checkout = vi.fn().mockResolvedValue({ url: "https://checkout.stripe.test/session" });
    const portal = vi.fn().mockResolvedValue({ url: "https://billing.stripe.test/session" });
    const supabase = {
      auth: { getUser },
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: table === "businesses"
                ? { id: businessId, owner_user_id: userId, name: "Test" }
                : sessionKind === "portal" ? { provider_customer_id: "cus_test" } : null,
              error: null,
            }),
          }),
        }),
      }),
    };
    const handler = loadHandler(route, supabase, {
      checkout: { sessions: { create: checkout } },
      billingPortal: { sessions: { create: portal } },
    });

    const response = await handler(new Request("https://qmaps.ca/" + route, {
      method: "POST",
      headers: {
        Authorization: "Bearer local-session-token",
        "Content-Type": "application/json",
        origin: "https://qmaps.ca",
      },
      body: JSON.stringify({ business_id: businessId, plan: "pro" }),
    }));

    expect(getUser).toHaveBeenCalledWith("local-session-token");
    expect(response.status).toBe(200);
    expect(sessionKind === "checkout" ? checkout : portal).toHaveBeenCalledOnce();
    expect(sessionKind === "checkout" ? portal : checkout).not.toHaveBeenCalled();
  });
});

const recordedStripeSubscription = {
  provider: "stripe", provider_subscription_id: "sub_existing", provider_customer_id: "cus_existing",
};

function checkoutFixture(row: object | null = recordedStripeSubscription, status = "active") {
  const checkout = vi.fn().mockResolvedValue({ url: "https://checkout.stripe.test/session", id: "cs_test" });
  const retrieve = vi.fn().mockResolvedValue({
    id: "sub_existing", status, customer: "cus_existing", cancel_at_period_end: true,
  });
  const supabase = {
    auth: { getUser: async () => ({ data: { user: { id: userId } }, error: null }) },
    from: (table: string) => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({
        data: table === "businesses" ? { id: businessId, owner_user_id: userId } : row, error: null,
      }) }) }),
    }),
  };
  const handler = loadHandler("create-merchant-checkout-session", supabase, {
    subscriptions: { retrieve }, checkout: { sessions: { create: checkout } },
  });
  const purchase = () => handler(new Request("https://qmaps.ca/checkout", {
    method: "POST", headers: { Authorization: "Bearer local", "Content-Type": "application/json" },
    body: JSON.stringify({ business_id: businessId, plan: "pro" }),
  }));
  return { purchase, retrieve, checkout };
}

describe("Stripe Checkout with a previous subscription", () => {
  it.each(["active", "trialing", "past_due", "incomplete", "unpaid", "paused", "unknown"])(
    "does not start a second Checkout when Stripe reports %s",
    async status => {
      const { purchase, retrieve, checkout } = checkoutFixture(recordedStripeSubscription, status);
      const response = await purchase();
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({ error: "subscription_exists" });
      expect(retrieve).toHaveBeenCalledExactlyOnceWith("sub_existing");
      expect(checkout).not.toHaveBeenCalled();
    },
  );

  it.each(["canceled", "incomplete_expired"])("allows a fresh Checkout after %s", async status => {
    const { purchase, retrieve, checkout } = checkoutFixture(recordedStripeSubscription, status);
    expect((await purchase()).status).toBe(200);
    expect(retrieve).toHaveBeenCalledExactlyOnceWith("sub_existing");
    expect(checkout).toHaveBeenCalledWith(expect.objectContaining({ customer: "cus_existing" }));
  });

  it("does not start Checkout when a recorded Stripe subscription cannot be verified", async () => {
    const { purchase, retrieve, checkout } = checkoutFixture();
    retrieve.mockRejectedValue(new Error("Provider unavailable"));
    expect((await purchase()).status).toBe(500);
    expect(checkout).not.toHaveBeenCalled();
  });

  it.each(["stripe", null])("does not treat a %s record with only a Stripe customer ID as a first purchase", async provider => {
    const { purchase, retrieve, checkout } = checkoutFixture({
      ...recordedStripeSubscription, provider, provider_subscription_id: null,
    });
    const response = await purchase();
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: "subscription_unverified" });
    expect(retrieve).not.toHaveBeenCalled();
    expect(checkout).not.toHaveBeenCalled();
  });

  it("does not redirect to an unavailable portal when the recorded customer ID is missing", async () => {
    const { purchase, retrieve, checkout } = checkoutFixture({ ...recordedStripeSubscription, provider_customer_id: null });
    const response = await purchase();
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: "subscription_unverified" });
    expect(retrieve).toHaveBeenCalledExactlyOnceWith("sub_existing");
    expect(checkout).not.toHaveBeenCalled();
  });

  it("does not reuse a customer reference from another billing provider", async () => {
    const { purchase, retrieve, checkout } = checkoutFixture({
      provider: "manual", provider_subscription_id: "manual-subscription", provider_customer_id: "manual-customer",
    });
    expect((await purchase()).status).toBe(200);
    expect(retrieve).not.toHaveBeenCalled();
    expect(checkout).toHaveBeenCalledWith(expect.objectContaining({ customer: undefined }));
  });

  it("allows a first purchase with no subscription record", async () => {
    const { purchase, retrieve, checkout } = checkoutFixture(null);
    expect((await purchase()).status).toBe(200);
    expect(retrieve).not.toHaveBeenCalled();
    expect(checkout).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ customer: undefined }));
  });

  it("does not start Checkout with mismatched Stripe customer data", async () => {
    const { purchase, retrieve, checkout } = checkoutFixture();
    retrieve.mockResolvedValue({ id: "sub_existing", status: "canceled", customer: "cus_other" });
    expect((await purchase()).status).toBe(500);
    expect(checkout).not.toHaveBeenCalled();
  });
});

const subscription = (status = "active") => ({
  id: "sub_mock",
  customer: "cus_mock",
  status,
  metadata: { business_id: businessId, user_id: userId, plan: "pro" },
});

const checkoutSession = {
  subscription: "sub_mock", client_reference_id: businessId, metadata: { user_id: userId, plan: "pro" },
};

function webhookFixture(failure?: "lookup" | "transaction" | "retrieve", existing = false) {
  const error = { code: "XX000", message: "Mock storage failure" };
  const lookup = vi.fn().mockResolvedValue({
    data: existing ? { id: "existing-billing-event" } : null,
    error: failure === "lookup" ? error : null,
  });
  const rpc = vi.fn().mockResolvedValue({ data: failure === "transaction" ? null : true, error: failure === "transaction" ? error : null });
  const auditSelect = { eq: () => ({ eq: () => ({ limit: () => ({ maybeSingle: lookup }) }) }) };
  const supabase = {
    from: () => ({ select: () => auditSelect }),
    rpc,
  };
  const retrieve = vi.fn().mockResolvedValue(subscription());
  if (failure === "retrieve") retrieve.mockRejectedValue(new Error("Mock provider read failure"));
  const constructEventAsync = vi.fn();
  const stripe = { webhooks: { constructEventAsync }, subscriptions: { retrieve } };
  const handler = loadHandler("stripe-webhook", supabase, stripe);
  const request = () => new Request("https://qmaps.ca/stripe-webhook", {
    method: "POST",
    headers: { "stripe-signature": "local-test-signature" },
    body: "{}",
  });
  const deliver = (type = "customer.subscription.updated", object: object = subscription(), id = "evt_mock") => {
    constructEventAsync.mockResolvedValueOnce({ id, type, data: { object } });
    return handler(request());
  };
  return { deliver, retrieve, rpc };
}

describe("Stripe webhook acknowledgement", () => {
  it.each(["lookup", "transaction"] as const)(
    "returns a retryable response after a %s failure",
    async (failure) => {
      const { deliver, retrieve, rpc } = webhookFixture(failure);
      const response = await deliver();

      expect(response.status).toBe(500);
      if (failure === "lookup") {
        expect(retrieve).not.toHaveBeenCalled();
        expect(rpc).not.toHaveBeenCalled();
      } else {
        expect(rpc).toHaveBeenCalledOnce();
      }
    },
  );

  it("persists subscription and receipt through one transaction", async () => {
    const { deliver, rpc } = webhookFixture();
    const response = await deliver();

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledExactlyOnceWith("qmaps_apply_stripe_billing_event", expect.objectContaining({
      p_business_id: businessId,
      p_user_id: userId,
      p_event_id: "evt_mock",
      p_subscription: expect.objectContaining({ provider_subscription_id: "sub_mock", status: "active" }),
    }));
  });

  it("acknowledges an already recorded event without writing it again", async () => {
    const { deliver, retrieve, rpc } = webhookFixture(undefined, true);
    const response = await deliver();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, duplicate: true });
    expect(retrieve).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("acknowledges a duplicate reported by the database after the initial lookup", async () => {
    const { deliver, rpc } = webhookFixture();
    rpc.mockResolvedValueOnce({ data: false, error: null });
    const response = await deliver();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, duplicate: true });
    expect(rpc).toHaveBeenCalledOnce();
  });

  it("keeps a canceled subscription canceled when an older active delivery arrives", async () => {
    const { deliver, retrieve, rpc } = webhookFixture();
    retrieve.mockResolvedValueOnce(subscription("canceled"));

    expect((await deliver("customer.subscription.deleted", subscription("canceled"), "evt_cancel")).status).toBe(200);
    expect((await deliver("customer.subscription.updated", subscription("active"), "evt_older")).status).toBe(200);

    expect(rpc.mock.calls.map(([, { p_subscription }]) => p_subscription.status)).toEqual(["canceled", "canceled"]);
    expect(retrieve).toHaveBeenCalledExactlyOnceWith("sub_mock");
    expect(rpc.mock.calls.map(([, { p_event_id }]) => p_event_id)).toEqual(["evt_cancel", "evt_older"]);
  });

  it.each([
    ["customer.subscription.updated", subscription()],
    ["checkout.session.completed", checkoutSession],
  ] as const)("retries %s when Stripe cannot confirm the subscription state", async (type, object) => {
    const { deliver, rpc } = webhookFixture("retrieve");

    expect((await deliver(type, object)).status).toBe(500);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("does not accept a current subscription attached to another business", async () => {
    const { deliver, retrieve, rpc } = webhookFixture();
    retrieve.mockResolvedValueOnce({
      ...subscription(), metadata: { ...subscription().metadata, business_id: "different-business" },
    });

    expect((await deliver()).status).toBe(500);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("loads its Stripe subscription before the Checkout event transaction", async () => {
    const { deliver, retrieve, rpc } = webhookFixture();

    const response = await deliver("checkout.session.completed", checkoutSession);

    expect(response.status).toBe(200);
    expect(retrieve).toHaveBeenCalledExactlyOnceWith("sub_mock");
    expect(rpc).toHaveBeenCalledExactlyOnceWith("qmaps_apply_stripe_billing_event", expect.objectContaining({
      p_business_id: businessId,
      p_event_type: "checkout.session.completed",
      p_subscription: expect.objectContaining({ status: "active" }),
    }));
    expect(retrieve.mock.invocationCallOrder[0]).toBeLessThan(rpc.mock.invocationCallOrder[0]);
  });

  it("stores an invoice receipt without changing the subscription", async () => {
    const { deliver, retrieve, rpc } = webhookFixture();
    const response = await deliver("invoice.payment_succeeded", {
      subscription_details: { metadata: subscription().metadata }, amount_due: 4900, amount_paid: 4900, currency: "cad",
    });
    expect(response.status).toBe(200);
    expect(retrieve).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledExactlyOnceWith("qmaps_apply_stripe_billing_event", expect.objectContaining({
      p_event_type: "invoice.payment_succeeded",
      p_subscription: null,
      p_metadata: expect.objectContaining({ amount_paid: 4900, currency: "cad" }),
    }));
  });
});
