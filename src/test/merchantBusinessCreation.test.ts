import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("Merchant business creation UX", () => {
  it("routes owners to an actual form rather than creating an invented listing", () => {
    const dashboard = read("src/pages/MerchantDashboard.tsx");
    expect(dashboard).toContain('navigate("/add-business")');
    expect(dashboard).not.toContain('name: "Mon entreprise"');
    expect(dashboard).not.toContain('address: "Montréal, QC"');
    expect(dashboard).not.toContain("is_claimed: true");
  });

  it("returns a newly assigned owner to the merchant portal", () => {
    const form = read("src/pages/AddBusiness.tsx");
    expect(form).toContain('owner_user_id: relationship === "owner" ? user.id : null');
    expect(form).toContain('navigate(relationship === "owner" ? "/merchant" : "/")');
  });
});
