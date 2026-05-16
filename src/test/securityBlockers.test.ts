import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Phase 8 — Pre-publish security blocker tests.
 *
 * These tests verify the *intent* of the RLS migrations as written in SQL files,
 * because vitest does not have direct access to a Postgres instance in CI.
 * They guard against accidental regression of the privilege-escalation fix.
 */

const MIGRATIONS_DIR = join(process.cwd(), "supabase/migrations");

function allMigrationSql(): string {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .map((f) => readFileSync(join(MIGRATIONS_DIR, f), "utf8"))
    .join("\n");
}

describe("user_roles RLS — privilege escalation guard", () => {
  const sql = allMigrationSql();

  it("does not contain a self-insert policy that allows ANY role", () => {
    // The dangerous legacy policy: WITH CHECK (auth.uid() = user_id)  — no role restriction
    // It must be dropped in a later migration.
    expect(sql).toMatch(/DROP POLICY IF EXISTS "Users can insert own roles"/);
  });

  it("self-insert policy restricts role to user or merchant only", () => {
    expect(sql).toMatch(
      /Users can insert own non-admin roles[\s\S]+role IN \('user'::public\.app_role, 'merchant'::public\.app_role\)/
    );
  });

  it("self-update policy blocks switching to admin", () => {
    expect(sql).toMatch(/Users can update own non-admin roles/);
    expect(sql).toMatch(
      /Users can update own non-admin roles[\s\S]+role IN \('user'::public\.app_role, 'merchant'::public\.app_role\)/
    );
  });
});

describe("businesses INSERT RLS — owner enforcement", () => {
  const sql = allMigrationSql();

  it("hardened insert policy enforces owner_user_id = auth.uid()", () => {
    expect(sql).toMatch(/Authenticated users can create owned business/);
    expect(sql).toMatch(/owner_user_id IS NULL OR owner_user_id = auth\.uid\(\)/);
  });

  it("hardened insert policy blocks pre-claimed inserts", () => {
    expect(sql).toMatch(
      /Authenticated users can create owned business[\s\S]+is_claimed = false/
    );
  });
});

describe("storage photo delete — scope restriction", () => {
  const sql = allMigrationSql();

  it("drops the open 'Users can delete own photos' policy", () => {
    expect(sql).toMatch(/DROP POLICY IF EXISTS "Users can delete own photos"/);
  });

  it("only admins can delete from the photos bucket via storage", () => {
    expect(sql).toMatch(/Admins can delete photos[\s\S]+has_role\(auth\.uid\(\), 'admin'/);
  });
});
