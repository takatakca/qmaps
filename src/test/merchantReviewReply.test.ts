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


describe("TAKATAK and owner-reply INSERT integrity", () => {
  it("blocks direct creation of a forged owner reply or tenant workspace link", () => {
    const sql = source("supabase/migrations/20261014210000_guard_inserts_and_business_owner_assignment.sql");
    expect(sql).toContain("tg_op = 'INSERT'");
    expect(sql).toContain("new.owner_reply is not null");
    expect(sql).toContain("new.takatak_client_id is not null");
    expect(sql).toMatch(/before insert on public\.reviews/i);
    expect(sql).toMatch(/before insert on public\.businesses/i);
  });

  it("forbids assigning a business to another authenticated user", () => {
    const sql = source("supabase/migrations/20261014210000_guard_inserts_and_business_owner_assignment.sql");
    expect(sql).toContain("new.owner_user_id is distinct from auth.uid()");
    expect(sql).toContain("qmaps_guard_business_owner_update");
    expect(sql).toContain("qmaps_guard_business_owner_insert");
    expect(sql).toContain("new.owner_user_id is not null");
  });
});
