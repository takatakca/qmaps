import { describe, expect, it } from "vitest";
import {
  formatDateKey,
  getHoursForDate,
  isOpenAtWithSpecialHours,
  parseSpecialHours,
  parseWeeklyHours,
  type WeeklyHours,
} from "@/lib/businessHours";

const baseWeek = (): WeeklyHours =>
  parseWeeklyHours({
    monday: { closed: false, blocks: [{ open: "09:00", close: "17:00" }] },
    tuesday: { closed: false, blocks: [{ open: "09:00", close: "17:00" }] },
    wednesday: { closed: false, blocks: [{ open: "09:00", close: "17:00" }] },
    thursday: { closed: false, blocks: [{ open: "09:00", close: "17:00" }] },
    friday: { closed: false, blocks: [{ open: "09:00", close: "17:00" }] },
    saturday: { closed: true, blocks: [] },
    sunday: { closed: true, blocks: [] },
  })!;

describe("special hours", () => {
  it("formatDateKey produces YYYY-MM-DD", () => {
    expect(formatDateKey(new Date(2026, 11, 25, 10))).toBe("2026-12-25");
  });

  it("parses valid special hours and rejects bad keys", () => {
    const parsed = parseSpecialHours({
      "2026-12-25": { closed: true, blocks: [], note: "Noël" },
      "bad-key": { closed: true },
      "2026-12-24": { closed: false, blocks: [{ open: "10:00", close: "15:00" }] },
    });
    expect(parsed).not.toBeNull();
    expect(parsed!["2026-12-25"].closed).toBe(true);
    expect(parsed!["2026-12-25"].note).toBe("Noël");
    expect(parsed!["2026-12-24"].blocks).toHaveLength(1);
    expect((parsed as any)["bad-key"]).toBeUndefined();
  });

  it("returns null for empty/invalid input", () => {
    expect(parseSpecialHours(null)).toBeNull();
    expect(parseSpecialHours({})).toBeNull();
    expect(parseSpecialHours({ "bad": {} })).toBeNull();
  });

  it("special closed overrides normally open day", () => {
    const week = baseWeek();
    const special = parseSpecialHours({
      "2026-12-25": { closed: true, blocks: [] },
    });
    // Friday Dec 25, 2026 — normally open
    const date = new Date(2026, 11, 25, 12, 0);
    expect(isOpenAtWithSpecialHours(week, special, date)).toBe(false);
  });

  it("special open overrides normally closed day", () => {
    const week = baseWeek();
    const special = parseSpecialHours({
      "2026-12-26": { closed: false, blocks: [{ open: "10:00", close: "14:00" }] },
    });
    // Saturday Dec 26, 2026 — normally closed
    const date = new Date(2026, 11, 26, 12, 0);
    expect(isOpenAtWithSpecialHours(week, special, date)).toBe(true);
  });

  it("getHoursForDate falls back to weekly when no special", () => {
    const week = baseWeek();
    const res = getHoursForDate(week, null, new Date(2026, 11, 21, 10)); // Monday
    expect(res.isSpecial).toBe(false);
    expect(res.day?.closed).toBe(false);
  });

  it("invalid block times are filtered out", () => {
    const parsed = parseSpecialHours({
      "2026-12-24": { closed: false, blocks: [{ open: "bad", close: "15:00" }] },
    });
    expect(parsed!["2026-12-24"].closed).toBe(true);
  });
});
