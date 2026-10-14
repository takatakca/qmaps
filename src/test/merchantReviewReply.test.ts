import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../..");
const source = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("QMAPS merchant owner reply boundaries", () => {
  it("requires a real caller identity and business ownership before service-role writes", () => {
    const fn = source("supabase/functions/merchant-reply-review/index.ts");
    expect(fn).toContain("auth.getUser(token)");
    expect(fn).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(fn).toContain("business.owner_user_id !== userData.user.id");
    expect(fn).toContain('.eq("business_id", business.id)');
    expect(fn).toContain("text.length > 2000");
    expect(fn).not.toContain("QMAPS_TAKATAK_INTEGRATION_SECRET");
  });

  it("does not allow the browser to set owner_reply directly", () => {
    const component = source("src/components/merchant/MerchantReviews.tsx");
    expect(component).toContain('functions.invoke("merchant-reply-review"');
    expect(component).not.toContain('.from("reviews").update(');
  });

  it("blocks reviewer self-impersonation and merchant workspace reassignment at database level", () => {
    const migration = source("supabase/migrations/20261014190000_guard_takatak_columns_and_review_replies.sql");
    expect(migration).toContain("security invoker");
    expect(migration).toContain("current_user not in ('service_role', 'postgres', 'supabase_admin')");
    expect(migration).toContain("new.takatak_client_id is distinct from old.takatak_client_id");
    expect(migration).toContain("new.owner_reply is distinct from old.owner_reply");
    expect(migration).toContain("new.owner_replied_at is distinct from old.owner_replied_at");
    expect(migration).toContain("public.has_role(auth.uid(), 'admin'::public.app_role)");
  });

  it("keeps the merchant endpoint behind a verified JWT", () => {
    expect(source("supabase/config.toml")).toContain(
      "[functions.merchant-reply-review]\nverify_jwt = true",
    );
  });
});
