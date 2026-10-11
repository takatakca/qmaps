import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("TAKATAK bridge", () => {
  it("stores the workspace id and the owner reply in additive columns", () => {
    const sql = read("supabase/migrations/20261011120000_takatak_workspace_and_review_reply.sql");
    expect(sql).toMatch(/add column if not exists takatak_client_id text/i);
    expect(sql).toMatch(/add column if not exists owner_reply text/i);
    expect(sql).not.toMatch(/\bDROP\b/i);
  });

  it("requires the integration secret before writing", () => {
    const link = read("supabase/functions/takatak-link-business/index.ts");
    const reply = read("supabase/functions/takatak-reply-review/index.ts");
    const auth = read("supabase/functions/_shared/takatak-auth.ts");
    expect(auth).toContain("QMAPS_TAKATAK_INTEGRATION_SECRET");
    expect(link).toContain("integrationAuthorized");
    expect(reply).toContain("integrationAuthorized");
    expect(link).toContain("takatak_client_id");
    expect(reply).toContain("owner_reply");
  });
});
