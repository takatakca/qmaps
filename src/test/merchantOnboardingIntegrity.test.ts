import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("QMAPS merchant onboarding contract", () => {
  it("creates unverified businesses, consistent with the existing RLS policy", () => {
    const source = read("src/pages/MerchantOnboarding.tsx");
    const policy = read("supabase/migrations/20260516233716_e0b4a1f5-7dcf-43b9-9913-bdaeb6ea527f.sql");
    expect(source).toContain("is_claimed: false");
    expect(source).not.toContain("is_claimed: true");
    expect(policy).toContain("is_claimed = false");
  });

  it("does not auto-geolocate new businesses at an invented Montreal position", () => {
    const migration = read("supabase/migrations/20261014220000_nullable_business_coordinates_no_fallback.sql");
    for (const coordinate of ["latitude", "longitude"]) {
      expect(migration).toContain(`alter column ${coordinate} drop not null`);
      expect(migration).toContain(`alter column ${coordinate} drop default`);
    }
    expect(migration).toContain("new.location := null");
    expect(migration).not.toMatch(/update public\.businesses set (latitude|longitude)/i);
  });

  it("models business coordinates as nullable in the frontend types", () => {
    const source = read("src/integrations/supabase/types.ts");
    const businesses = source.split("      businesses: {")[1].split("      categories: {")[0];
    expect(businesses).toContain("latitude: number | null");
    expect(businesses).toContain("longitude: number | null");
  });
});
