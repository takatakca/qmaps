import { describe, expect, it } from "vitest";
import { getBusinessCompleteness } from "@/lib/businessCompleteness";

describe("getBusinessCompleteness", () => {
  it("empty business has score 0", () => {
    const r = getBusinessCompleteness(null);
    expect(r.score).toBe(0);
    expect(r.completed).toEqual([]);
    expect(r.missing.length).toBeGreaterThan(0);
  });

  it("partially complete business returns intermediate score", () => {
    const r = getBusinessCompleteness({
      name: "QMAPS Test",
      address: "1 rue",
      city: "Montréal",
      phone: "514-555-0000",
      hours: "9-17",
    });
    expect(r.score).toBeGreaterThan(0);
    expect(r.score).toBeLessThan(100);
    expect(r.completed).toContain("name");
    expect(r.completed).toContain("hours");
    expect(r.missing).toContain("photos");
  });

  it("fully complete business scores 100", () => {
    const r = getBusinessCompleteness(
      {
        name: "QMAPS",
        address: "1 rue",
        city: "Montréal",
        phone: "514-555-0000",
        website: "https://example.com",
        hours: "9-17",
        hours_json: {
          monday: { closed: false, blocks: [{ open: "09:00", close: "17:00" }] },
        },
        photos: ["https://example.com/p.jpg"],
        amenities: ["Wifi"],
        payment_methods: ["Visa"],
        languages: ["Français"],
        accessibility: ["Rampe"],
      },
      [{ id: "1", business_id: "b", name: "Item" }],
    );
    expect(r.score).toBe(100);
    expect(r.missing).toEqual([]);
  });

  it("score is clamped to 0..100", () => {
    const r = getBusinessCompleteness({});
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });
});
