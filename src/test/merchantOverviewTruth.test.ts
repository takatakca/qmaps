import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("MerchantOverview truthful data presentation", () => {
  const code = readFileSync(resolve(process.cwd(), "src/components/merchant/MerchantOverview.tsx"), "utf8");

  it("uses persisted business hours instead of fabricated 24-hour schedules", () => {
    expect(code).toContain("parseWeeklyHours(business.hours_json)");
    expect(code).toContain("formatDayHours(structuredHours[day])");
    expect(code).not.toContain('hours: "Ouvert 24h"');
  });

  it("does not show invented promotions, awards or no-op claim buttons", () => {
    expect(code).not.toContain("10% de réduction pour les nouveaux clients!");
    expect(code).not.toContain("Cuisine locale & bio");
    expect(code).not.toContain("15 ans d'expérience");
    expect(code).not.toContain("Marquer l'entreprise comme revendiquée");
    expect(code).not.toContain("onClick={() => {}}");
    expect(code).not.toContain("Produits & Services FLEXS");
  });

  it("connects call and photo actions to real user flows", () => {
    expect(code).toContain("window.location.href = `tel:${phone}`");
    expect(code).toContain('onClick={() => navigate("/merchant/photos")}');
  });
});
