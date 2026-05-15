import { describe, it, expect } from "vitest";
import {
  ALL_GROUPS,
  BOOLEAN_GROUPS,
  CHOICE_GROUPS,
  attributesToDisplayLabels,
  countSelected,
  emptyAttributes,
  parseAttributes,
  sanitizeAttributes,
  toLegacyAmenities,
} from "@/lib/businessAttributes";

describe("businessAttributes — schema completeness", () => {
  it("includes every required group", () => {
    const titles = ALL_GROUPS.map((g) => g.title);
    for (const required of [
      "Accessibility",
      "Amenities",
      "Diversity",
      "Eco-friendly",
      "Family amenities",
      "Food ordering",
      "Miscellaneous",
      "Payments",
      "Reservations",
      "Seating",
      "Services",
      "Other",
      "Accepted Cards",
      "Parking",
      "Alcohol",
      "Wi-Fi",
      "Large parties gratuity",
      "Tip",
    ]) {
      expect(titles).toContain(required);
    }
  });

  it("declares unique stable ids", () => {
    const ids = ALL_GROUPS.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every group has at least one option", () => {
    for (const g of ALL_GROUPS) expect(g.options.length).toBeGreaterThan(0);
  });
});

describe("businessAttributes — parse / serialize", () => {
  it("returns empty document when nothing is stored", () => {
    expect(parseAttributes({ attributes: null, amenities: null })).toEqual(emptyAttributes());
  });

  it("does not crash on malformed input", () => {
    expect(parseAttributes({ attributes: "not-json", amenities: undefined })).toEqual(
      emptyAttributes()
    );
  });

  it("parses structured JSON when present", () => {
    const out = parseAttributes({
      attributes: {
        boolean: { "Drive-Thru": true, "Has TV": false },
        single: { wifi: "Free" },
        multi: { parking: ["Valet", "Garage"] },
      },
      amenities: null,
    });
    expect(out.boolean["Drive-Thru"]).toBe(true);
    expect(out.boolean["Has TV"]).toBe(false);
    expect(out.single.wifi).toBe("Free");
    expect(out.multi.parking).toEqual(["Valet", "Garage"]);
  });

  it("falls back to legacy flat amenities when JSON is empty", () => {
    const out = parseAttributes({
      attributes: {},
      amenities: ["Drive-Thru", "wifi::Free", "parking::Valet", "parking::Garage"],
    });
    expect(out.boolean["Drive-Thru"]).toBe(true);
    expect(out.single.wifi).toBe("Free");
    expect(out.multi.parking).toEqual(["Valet", "Garage"]);
  });

  it("round-trips structured ↔ legacy without data loss", () => {
    const attrs = {
      boolean: { "Drive-Thru": true, "Outdoor Seating": true },
      single: { alcohol: "Full Bar", wifi: "Free" },
      multi: { accepted_cards: ["Credit", "Debit"] },
    };
    const flat = toLegacyAmenities(attrs);
    const reparsed = parseAttributes({ attributes: {}, amenities: flat });
    expect(reparsed.boolean["Drive-Thru"]).toBe(true);
    expect(reparsed.boolean["Outdoor Seating"]).toBe(true);
    expect(reparsed.single).toEqual({ alcohol: "Full Bar", wifi: "Free" });
    expect(reparsed.multi.accepted_cards.sort()).toEqual(["Credit", "Debit"]);
  });

  it("sanitize strips unknown options", () => {
    const cleaned = sanitizeAttributes({
      boolean: { "Drive-Thru": true, "Bogus Option": true },
      single: { wifi: "Free", unknown_group: "x" },
      multi: { parking: ["Valet", "NotARealLot"], also_unknown: ["x"] },
    });
    expect(cleaned.boolean).toEqual({ "Drive-Thru": true });
    expect(cleaned.single).toEqual({ wifi: "Free" });
    expect(cleaned.multi).toEqual({ parking: ["Valet"] });
  });
});

describe("businessAttributes — display & counting", () => {
  it("public display does not crash on empty input", () => {
    expect(attributesToDisplayLabels({})).toEqual([]);
    expect(attributesToDisplayLabels({ amenities: [], attributes: {} })).toEqual([]);
  });

  it("renders both boolean labels and choice group selections", () => {
    const labels = attributesToDisplayLabels({
      attributes: {
        boolean: { "Drive-Thru": true, "Has TV": false },
        single: { wifi: "Free" },
        multi: { parking: ["Valet", "Garage"] },
      },
    });
    expect(labels).toContain("Drive-Thru");
    expect(labels).not.toContain("Has TV");
    expect(labels).toContain("Wi-Fi: Free");
    expect(labels.find((l) => l.startsWith("Parking:"))).toBe("Parking: Valet, Garage");
  });

  it("counts selected entries correctly", () => {
    expect(
      countSelected({
        boolean: { a: true, b: false, c: true },
        single: { wifi: "Free" },
        multi: { parking: ["Valet", "Garage"] },
      })
    ).toBe(2 + 1 + 2);
  });
});

describe("businessAttributes — legacy backfill safety", () => {
  it("leaves attributes empty for businesses with no flat amenities", () => {
    const out = parseAttributes({ attributes: {}, amenities: [] });
    expect(out).toEqual(emptyAttributes());
  });

  it("preserves a legacy mixed amenities array", () => {
    const legacy = [
      "Wheelchair Accessible",
      "Drive-Thru",
      "alcohol::Full Bar",
      "accepted_cards::Credit",
      "accepted_cards::Debit",
    ];
    const out = parseAttributes({ attributes: {}, amenities: legacy });
    expect(out.boolean["Wheelchair Accessible"]).toBe(true);
    expect(out.boolean["Drive-Thru"]).toBe(true);
    expect(out.single.alcohol).toBe("Full Bar");
    expect(out.multi.accepted_cards.sort()).toEqual(["Credit", "Debit"]);
  });
});

describe("businessAttributes — required individual options", () => {
  const allBoolKeys = new Set(BOOLEAN_GROUPS.flatMap((g) => g.options.map((o) => o.key)));
  const choiceById = new Map(CHOICE_GROUPS.map((g) => [g.id, g.options.map((o) => o.key)]));

  it("includes the headline boolean items", () => {
    for (const k of [
      "Wheelchair Accessible",
      "Drive-Thru",
      "Offers Delivery",
      "Offers Takeout",
      "Takes Reservations",
      "Outdoor Seating",
      "Dogs Allowed",
      "Accepts cash",
      "Bottomless mimosas",
    ]) {
      expect(allBoolKeys.has(k)).toBe(true);
    }
  });

  it("includes the headline choice options", () => {
    expect(choiceById.get("alcohol")).toEqual(["Beer & Wine Only", "Full Bar", "No"]);
    expect(choiceById.get("wifi")).toEqual(["Free", "Paid", "No"]);
    expect(choiceById.get("accepted_cards")).toEqual(["Credit", "Debit", "None"]);
    expect(choiceById.get("parking")).toEqual(["Valet", "Garage", "Street", "Private Lot"]);
    expect(choiceById.get("tip")).toEqual(["We suggest gratuity", "Tipping optional"]);
    expect(choiceById.get("large_party_gratuity")).toEqual([
      "Gratuity included",
      "Tipping optional",
      "Tip",
    ]);
  });
});
