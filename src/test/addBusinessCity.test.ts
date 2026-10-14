import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Public business submission integrity", () => {
  const source = readFileSync(resolve(process.cwd(), "src/pages/AddBusiness.tsx"), "utf8");

  it("requires a real city, not the database default of Montreal", () => {
    expect(source).toContain('city: ""');
    expect(source).toContain("form.city.trim().length < 2");
    expect(source).toContain("city: form.city.trim()");
    expect(source).toContain('aria-label="Ville du commerce"');
  });

  it("does not mark a self-submitted business as verified", () => {
    expect(source).toContain('owner_user_id: relationship === "owner" ? user.id : null');
    expect(source).not.toContain("is_claimed: true");
    expect(source).toContain("propriétaire ou gestionnaire");
  });
});
