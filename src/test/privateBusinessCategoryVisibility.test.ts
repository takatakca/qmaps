import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("category associations for private QMAPS drafts", () => {
  const initial = read("supabase/migrations/20260228064647_762193f7-9d35-40f8-b8ce-5d2d1a86a376.sql");
  const migration = read("supabase/migrations/20261016180000_private_business_category_visibility.sql");

  it("replaces the historically unrestricted public SELECT policy", () => {
    expect(initial).toContain('CREATE POLICY "Business categories readable by all"');
    expect(migration).toContain('drop policy if exists "Business categories readable by all"');
    expect(migration).toContain('create policy "Visible business categories only"');
    expect(migration).toContain("for select");
  });

  it("permits public active listings while limiting drafts to owner or admin", () => {
    expect(migration).toContain("b.id = business_id");
    expect(migration).toContain("b.is_active = true");
    expect(migration).toContain("b.owner_user_id = auth.uid()");
    expect(migration).toContain("public.has_role(auth.uid(), 'admin'::public.app_role)");
    expect(migration).not.toMatch(/using\s*\(\s*true\s*\)/i);
  });

  it("keeps owner editing policies and all historical data intact", () => {
    expect(initial).toContain('CREATE POLICY "Owners can manage business categories"');
    expect(migration).not.toMatch(/\bdelete\s+from\b|\btruncate\b|\bdrop\s+table\b/i);
    expect(migration).not.toContain('drop policy if exists "Owners can manage business categories"');
  });
});
