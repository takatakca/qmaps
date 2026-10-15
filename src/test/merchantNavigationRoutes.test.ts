import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
describe("merchant menu links to real routes", () => {
  it("opens a real dashboard reviews tab", () => {
    const menu = read("src/pages/MerchantMore.tsx");
    const dashboard = read("src/pages/MerchantDashboard.tsx");
    expect(menu).toContain('navigate("/merchant?tab=reviews")');
    expect(menu).not.toContain('navigate("/merchant/reviews")');
    expect(dashboard).toContain("useSearchParams()");
    expect(dashboard).toContain('deepLinkedTab === "reviews"');
  });
  it("opens existing account, legal and support screens", () => {
    const menu = read("src/pages/MerchantMore.tsx");
    const app = read("src/App.tsx");
    for (const route of ["/privacy", "/terms", "/support", "/settings"]) {
      expect(menu).toContain(`navigate("${route}")`);
      expect(app).toContain(`path="${route}"`);
    }
    expect(menu).not.toContain("Outils de planification");
  });
});
