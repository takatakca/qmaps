import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "src/pages/MerchantOnboarding.tsx"), "utf8");

describe("merchant listing geography integrity", () => {
  it("does not supply a fictitious city when creating a new merchant account", () => {
    expect(source).toContain('const [city, setCity] = useState("");');
    expect(source).not.toContain('const [city, setCity] = useState("Montréal");');
    expect(source).toContain("city.trim().length >= 2");
    expect(source).toContain("setCity(existing.city)");
  });

  it("does not claim unsupported photo conversion outcomes", () => {
    expect(source).not.toContain("Une belle photo augmente les visites de 3x.");
    expect(source).toContain("Ajoutez des photos authentiques");
  });
});
