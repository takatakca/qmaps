import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Guest Manager honest prelaunch handling", () => {
  const source = readFileSync(resolve(process.cwd(), "src/pages/MerchantGuestManager.tsx"), "utf8");
  it("does not pretend to send or store an unhandled booking inquiry", () => {
    expect(source).not.toContain("setTimeout");
    expect(source).not.toContain("Demande envoyée!");
    expect(source).toContain("n'est pas encore activé");
    expect(source).toContain("ne sera pas envoyé sans votre intervention");
  });
  it("does not invent paid plans, testimonials or reservations", () => {
    expect(source).not.toContain("149");
    expect(source).not.toContain("299");
    expect(source).not.toContain("Des millions");
    expect(source).not.toContain("Marie L.");
    expect(source).not.toContain("30%");
    expect(source).toContain('to="/support-policy"');
  });
});
