import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("QMAPS CTA must not invent promotions", () => {
  const source = readFileSync(resolve(process.cwd(), "src/pages/MerchantCTA.tsx"), "utf8");
  it("does not simulate a paid ad or a fake discount", () => {
    expect(source).not.toContain("CA$2/jour moyenne");
    expect(source).not.toContain("5$ de rabais sur un achat de 25$");
    expect(source).not.toContain("Achetez 2 entrées");
    expect(source).not.toContain("Obtenir l'offre");
    expect(source).toContain("ne sont pas encore activées");
  });
  it("offers only real merchant management routes", () => {
    expect(source).toContain('to="/merchant/business-info"');
    expect(source).toContain('to="/merchant/sponsored"');
    expect(source).toContain("ne crée aucune promotion");
  });
});
