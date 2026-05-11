import { describe, expect, it } from "vitest";
import { getBusinessTrustBadges } from "@/lib/businessTrustBadges";

describe("getBusinessTrustBadges", () => {
  it("returns empty list for null business", () => {
    expect(getBusinessTrustBadges(null)).toEqual([]);
  });

  it("returns empty for empty business", () => {
    expect(getBusinessTrustBadges({})).toEqual([]);
  });

  it("includes verified owner when claimed", () => {
    const b = getBusinessTrustBadges({ is_claimed: true });
    expect(b.map((x) => x.id)).toContain("verified-owner");
  });

  it("includes hours badge when hours present", () => {
    expect(getBusinessTrustBadges({ hours: "9-5" }).map((x) => x.id)).toContain("hours-confirmed");
    expect(
      getBusinessTrustBadges({ hours_json: { mon: [{ open: "09:00", close: "17:00" }] } }).map((x) => x.id),
    ).toContain("hours-confirmed");
  });

  it("includes menu badge when at least one available item", () => {
    const ids = getBusinessTrustBadges({}, [{ is_available: true }]).map((x) => x.id);
    expect(ids).toContain("menu-available");
  });

  it("includes photo badge when photos exist", () => {
    expect(
      getBusinessTrustBadges({ photos: ["https://x/a.jpg"] }).map((x) => x.id),
    ).toContain("photos-added");
  });

  it("returns all four when fully populated", () => {
    const b = getBusinessTrustBadges(
      { is_claimed: true, hours: "9-5", photos: ["https://x/a.jpg"] },
      [{ is_available: true }],
    );
    expect(b.length).toBe(4);
  });
});
