import { describe, expect, it } from "vitest";
import { exampleListingTitle } from "@/lib/exampleListing";

describe("known fixture titles", () => {
  it.each(["Bistro de nuit", "Café du quartier", "Atelier de services"])("matches %s before and after the database rename", (name) => {
    const suffix = { "Bistro de nuit": 1, "Café du quartier": 2, "Atelier de services": 3 }[name];
    const id = "a9bf0001-0000-4000-8000-00000000000" + suffix;
    expect(exampleListingTitle({ id, name: "QMAPS Démo — " + name })).toBe(name);
    expect(exampleListingTitle({ id, name })).toBe(name);
  });

  it("leaves a real name and a changed fixture record untouched", () => {
    expect(exampleListingTitle({ id: "another-id", name: "QMAPS Démo — Bistro de nuit" })).toBeUndefined();
    expect(exampleListingTitle({ id: "a9bf0001-0000-4000-8000-000000000001", name: "Un autre commerce" })).toBeUndefined();
  });
});
