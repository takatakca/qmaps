import { describe, expect, it } from "vitest";
import {
  defaultWeeklyHours,
  emptyWeeklyHours,
  formatDayHours,
  getReviewRatingDistribution,
  isOpenAt,
  isValidBlock,
  parseWeeklyHours,
  timeToMinutes,
} from "@/lib/businessHours";

const at = (iso: string) => new Date(iso);

describe("businessHours", () => {
  it("validates HH:MM blocks", () => {
    expect(isValidBlock({ open: "09:00", close: "17:00" })).toBe(true);
    expect(isValidBlock({ open: "17:00", close: "09:00" })).toBe(false);
    expect(isValidBlock({ open: "9:00", close: "17:00" })).toBe(false);
    expect(isValidBlock({ open: "25:00", close: "26:00" })).toBe(false);
  });

  it("converts time to minutes", () => {
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("09:30")).toBe(570);
    expect(timeToMinutes("23:59")).toBe(23 * 60 + 59);
    expect(Number.isNaN(timeToMinutes("bad"))).toBe(true);
  });

  it("parses a valid weekly JSON shape", () => {
    const week = parseWeeklyHours({
      monday: { closed: false, blocks: [{ open: "09:00", close: "17:00" }] },
      sunday: { closed: true, blocks: [] },
    });
    expect(week).not.toBeNull();
    expect(week!.monday.closed).toBe(false);
    expect(week!.monday.blocks).toHaveLength(1);
    expect(week!.sunday.closed).toBe(true);
    // Days not provided default to closed.
    expect(week!.friday.closed).toBe(true);
  });

  it("rejects junk shapes", () => {
    expect(parseWeeklyHours(null)).toBeNull();
    expect(parseWeeklyHours("9-5")).toBeNull();
    expect(parseWeeklyHours({ foo: "bar" })).toBeNull();
  });

  it("isOpenAt: normal open day", () => {
    const week = defaultWeeklyHours();
    // 2024-04-15 was a Monday at 10:00 local time.
    expect(isOpenAt(week, at("2024-04-15T10:00:00"))).toBe(true);
  });

  it("isOpenAt: closed day", () => {
    const week = defaultWeeklyHours();
    expect(isOpenAt(week, at("2024-04-14T10:00:00"))).toBe(false); // Sunday
  });

  it("isOpenAt: before opening / after closing", () => {
    const week = defaultWeeklyHours();
    expect(isOpenAt(week, at("2024-04-15T08:59:00"))).toBe(false);
    expect(isOpenAt(week, at("2024-04-15T17:00:00"))).toBe(false); // close is exclusive
    expect(isOpenAt(week, at("2024-04-15T16:59:00"))).toBe(true);
  });

  it("isOpenAt: split shift", () => {
    const week = emptyWeeklyHours();
    week.monday = {
      closed: false,
      blocks: [
        { open: "09:00", close: "12:00" },
        { open: "14:00", close: "18:00" },
      ],
    };
    expect(isOpenAt(week, at("2024-04-15T11:30:00"))).toBe(true);
    expect(isOpenAt(week, at("2024-04-15T13:00:00"))).toBe(false);
    expect(isOpenAt(week, at("2024-04-15T15:00:00"))).toBe(true);
  });

  it("isOpenAt: missing hours fallback (empty week is closed everywhere)", () => {
    const week = emptyWeeklyHours();
    expect(isOpenAt(week, at("2024-04-15T10:00:00"))).toBe(false);
  });

  it("formatDayHours renders Fermé and time blocks", () => {
    expect(formatDayHours({ closed: true, blocks: [] })).toBe("Fermé");
    expect(
      formatDayHours({
        closed: false,
        blocks: [
          { open: "09:00", close: "12:00" },
          { open: "14:00", close: "18:00" },
        ],
      }),
    ).toBe("09:00 – 12:00, 14:00 – 18:00");
  });
});

describe("getReviewRatingDistribution", () => {
  it("handles empty reviews", () => {
    const d = getReviewRatingDistribution([]);
    expect(d.total).toBe(0);
    expect(d.counts).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    expect(d.percentages[5]).toBe(0);
  });

  it("counts and percentages add up", () => {
    const d = getReviewRatingDistribution([
      { rating: 5 },
      { rating: 5 },
      { rating: 4 },
      { rating: 1 },
      { rating: null },
      null,
    ]);
    expect(d.total).toBe(4);
    expect(d.counts[5]).toBe(2);
    expect(d.counts[4]).toBe(1);
    expect(d.counts[1]).toBe(1);
    expect(d.percentages[5]).toBe(50);
  });
});
