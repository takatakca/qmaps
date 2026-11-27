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
                : { provider_customer_id: "cus_test" },
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

const subscription = (status = "active") => ({
  id: "sub_mock",
  customer: "cus_mock",
  status,
  metadata: { business_id: businessId, user_id: userId, plan: "pro" },
});

const checkoutSession = {
  subscription: "sub_mock", client_reference_id: businessId, metadata: { user_id: userId, plan: "pro" },
};

function webhookFixture(failure?: "lookup" | "subscription" | "audit" | "retrieve", existing = false) {
  const error = { code: "XX000", message: "Mock storage failure" };
  const lookup = vi.fn().mockResolvedValue({
    data: existing ? { id: "existing-billing-event" } : null,
    error: failure === "lookup" ? error : null,
  });
  const upsert = vi.fn().mockResolvedValue({ error: failure === "subscription" ? error : null });
  const insert = vi.fn().mockResolvedValue({ error: failure === "audit" ? error : null });
  const auditSelect = { eq: () => ({ eq: () => ({ limit: () => ({ maybeSingle: lookup }) }) }) };
  const supabase = {
    from: (table: string) => table === "merchant_subscriptions"
      ? { upsert }
      : { select: () => auditSelect, insert },
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
  return { deliver, retrieve, upsert, insert };
}

describe("Stripe webhook acknowledgement", () => {
  it.each(["lookup", "subscription", "audit"] as const)(
    "returns a retryable response after a %s failure",
    async (failure) => {
      const { deliver, upsert, insert } = webhookFixture(failure);
      const response = await deliver();

      expect(response.status).toBe(500);
      if (failure === "lookup") expect(upsert).not.toHaveBeenCalled();
      if (failure !== "audit") expect(insert).not.toHaveBeenCalled();
    },
  );

  it("acknowledges after persisting both subscription and audit event", async () => {
    const { deliver, upsert, insert } = webhookFixture();
    const response = await deliver();

    expect(response.status).toBe(200);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ business_id: businessId, provider_subscription_id: "sub_mock" }),
      { onConflict: "business_id" },
    );
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      business_id: businessId,
      provider_event_id: "evt_mock",
    }));
  });

  it("acknowledges an already recorded event without writing it again", async () => {
    const { deliver, retrieve, upsert, insert } = webhookFixture(undefined, true);
    const response = await deliver();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, duplicate: true });
    expect(retrieve).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it("keeps a canceled subscription canceled when an older active delivery arrives", async () => {
    const { deliver, retrieve, upsert, insert } = webhookFixture();
    retrieve.mockResolvedValueOnce(subscription("canceled"));

    expect((await deliver("customer.subscription.deleted", subscription("canceled"), "evt_cancel")).status).toBe(200);
    expect((await deliver("customer.subscription.updated", subscription("active"), "evt_older")).status).toBe(200);

    expect(upsert.mock.calls.map(([row]) => row.status)).toEqual(["canceled", "canceled"]);
    expect(retrieve).toHaveBeenCalledExactlyOnceWith("sub_mock");
    expect(insert.mock.calls.map(([row]) => row.provider_event_id)).toEqual(["evt_cancel", "evt_older"]);
  });

  it.each([
    ["customer.subscription.updated", subscription()],
    ["checkout.session.completed", checkoutSession],
  ] as const)("retries %s when Stripe cannot confirm the subscription state", async (type, object) => {
    const { deliver, upsert, insert } = webhookFixture("retrieve");

    expect((await deliver(type, object)).status).toBe(500);
    expect(upsert).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it("does not accept a current subscription attached to another business", async () => {
    const { deliver, retrieve, upsert, insert } = webhookFixture();
    retrieve.mockResolvedValueOnce({
      ...subscription(), metadata: { ...subscription().metadata, business_id: "different-business" },
    });

    expect((await deliver()).status).toBe(500);
    expect(upsert).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it("records Checkout only after loading and writing its Stripe subscription", async () => {
    const { deliver, retrieve, upsert, insert } = webhookFixture();

    const response = await deliver("checkout.session.completed", checkoutSession);

    expect(response.status).toBe(200);
    expect(retrieve).toHaveBeenCalledExactlyOnceWith("sub_mock");
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ status: "active", business_id: businessId }),
      { onConflict: "business_id" });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ event_type: "checkout.session.completed" }));
    expect(retrieve.mock.invocationCallOrder[0]).toBeLessThan(upsert.mock.invocationCallOrder[0]);
    expect(upsert.mock.invocationCallOrder[0]).toBeLessThan(insert.mock.invocationCallOrder[0]);
  });
});
