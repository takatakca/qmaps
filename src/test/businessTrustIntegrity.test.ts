import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const newSql = read("supabase/migrations/20261014230000_protect_business_verification_and_rating_integrity.sql");

describe("verified merchant trust and review-score authorization", () => {
  it("guards INSERT and UPDATE paths for verification and rating counters", () => {
    expect(newSql).toContain("tg_op = 'INSERT'");
    expect(newSql).toContain("new.is_claimed is distinct from false");
    expect(newSql).toContain("new.avg_rating is distinct from 0::numeric");
    expect(newSql).toContain("new.reviews_count is distinct from 0");
    expect(newSql).toContain("new.is_claimed is distinct from old.is_claimed");
    expect(newSql).toContain("new.avg_rating is distinct from old.avg_rating");
    expect(newSql).toContain("new.reviews_count is distinct from old.reviews_count");
    expect(newSql).toMatch(/before insert on public\.businesses/i);
    expect(newSql).toMatch(/before update of is_claimed, avg_rating, reviews_count on public\.businesses/i);
  });

  it("rejects ordinary authenticated users while preserving trusted admin and service writes", () => {
    expect(newSql).toContain("security invoker");
    expect(newSql).toContain("set search_path = ''");
    expect(newSql).toContain("current_user not in ('service_role', 'postgres', 'supabase_admin')");
    expect(newSql).toContain("public.has_role(auth.uid(), 'admin'::public.app_role)");
    expect(newSql).toContain("errcode = '42501'");
  });

  it("keeps the existing automated rating refresh trigger in place", () => {
    const original = read("supabase/migrations/20260228064647_762193f7-9d35-40f8-b8ce-5d2d1a86a376.sql");
    expect(original).toContain("SECURITY DEFINER SET search_path = public");
    expect(original).toContain("reviews_refresh_business_aiud");
    expect(newSql).not.toContain("drop trigger reviews_refresh_business_aiud");
  });
});
