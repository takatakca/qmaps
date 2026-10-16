import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "src/pages/AddBusiness.tsx"), "utf8");

describe("QMAPS business discovery and submission reliability", () => {
  it("drops stale search responses and does not label name search as nearby results", () => {
    expect(source).toContain("const request = ++searchRequest.current");
    expect(source).toContain("if (request !== searchRequest.current) return");
    expect(source).toContain("if (error) throw error");
    expect(source).toContain('setSearchError(');
    expect(source).toContain('setSearchLoading(false)');
    expect(source).toContain("Résultats de recherche");
    expect(source).not.toContain("Commerces à proximité");
  });

  it("blocks duplicate submissions and always releases the pending state after failures", () => {
    expect(source).toContain("if (submitInFlight.current) return");
    expect(source).toContain("submitInFlight.current = true");
    expect(source).toContain("submitInFlight.current = false");
    expect(source).toContain("} finally {");
    expect(source).toContain("Ajout non confirmé");
    expect(source).toContain("is_claimed: false");
    expect(source).toContain('owner_user_id: relationship === "owner" ? user.id : null');
  });
});
