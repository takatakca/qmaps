import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("TAKATAK bridge", () => {
  it("adds a nullable workspace id and an owner reply without rewriting existing rows", () => {
    const sql = read("supabase/migrations/20261011120000_takatak_workspace_and_review_reply.sql");
    expect(sql).toMatch(/add column if not exists takatak_client_id text/i);
    expect(sql).toMatch(/add column if not exists owner_reply text/i);
    expect(sql).not.toMatch(/\b(drop|truncate|delete)\b/i);
  });

  it("refuses a link or reply unless the integration secret matches", () => {
    const link = read("supabase/functions/takatak-link-business/index.ts");
    const reply = read("supabase/functions/takatak-reply-review/index.ts");
    const auth = read("supabase/functions/_shared/takatak-auth.ts");
    expect(auth).toMatch(/QMAPS_TAKATAK_INTEGRATION_SECRET/);
    expect(link).toMatch(/integrationAuthorized/);
    expect(reply).toMatch(/integrationAuthorized/);
    expect(link).toMatch(/takatak_client_id/);
    expect(reply).toMatch(/owner_reply/);
  });

  it("lets an admin save a TAKATAK workspace id on a business", () => {
    const page = read("src/pages/admin/AdminBusinesses.tsx");
    expect(page).toMatch(/takatak_client_id/);
    expect(page).toMatch(/Espace TAKATAK enregistré/);
  });
});
