import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const sql = read("supabase/migrations/20261014231000_guard_review_moderation_integrity.sql");

describe("QMAPS public review moderation integrity", () => {
  it("forbids review authors from inserting moderation flags and fake reactions", () => {
    expect(sql).toContain("tg_op = 'INSERT'");
    expect(sql).toContain("new.moderation_status is distinct from 'visible'");
    expect(sql).toContain("new.hidden_at is not null");
    expect(sql).toContain("new.hidden_by is not null");
    expect(sql).toContain("new.hidden_reason is not null");
    expect(sql).toContain("new.useful is distinct from 0");
    expect(sql).toContain("new.funny is distinct from 0");
    expect(sql).toContain("new.cool is distinct from 0");
    expect(sql).toMatch(/before insert on public\.reviews/i);
  });

  it("keeps author and business identity immutable for ordinary authenticated callers", () => {
    expect(sql).toContain("new.user_id is distinct from old.user_id");
    expect(sql).toContain("new.business_id is distinct from old.business_id");
    expect(sql).toContain("new.moderation_status is distinct from old.moderation_status");
    expect(sql).toContain("new.hidden_at is distinct from old.hidden_at");
    expect(sql).toMatch(/before update of moderation_status, hidden_at, hidden_by, hidden_reason,/i);
  });

  it("preserves admin/server moderation and separate merchant-reply guard", () => {
    expect(sql).toContain("security invoker");
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain("current_user not in ('service_role', 'postgres', 'supabase_admin')");
    expect(sql).toContain("public.has_role(auth.uid(), 'admin'::public.app_role)");
    expect(sql).toContain("errcode = '42501'");
    expect(sql).not.toContain("drop trigger qmaps_guard_review_owner_reply");
    expect(read("supabase/migrations/20261014190000_guard_takatak_columns_and_review_replies.sql"))
      .toContain("qmaps_guard_review_owner_reply");
  });
});
