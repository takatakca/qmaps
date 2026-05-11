import { describe, expect, it } from "vitest";
import {
  calculateAverageRating,
  formatAnalyticsCount,
  getAnalyticsDateRange,
  summarizeBusinessEvents,
} from "@/lib/merchantAnalytics";

describe("merchantAnalytics helpers", () => {
  it("summarizeBusinessEvents groups by event_type", () => {
    expect(summarizeBusinessEvents([])).toEqual({});
    expect(
      summarizeBusinessEvents([
        { event_type: "profile_view" },
        { event_type: "profile_view" },
        { event_type: "phone_click" },
      ]),
    ).toEqual({ profile_view: 2, phone_click: 1 });
  });

  it("getAnalyticsDateRange spans correct number of days", () => {
    const { from, to } = getAnalyticsDateRange(7);
    const diffDays = (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000);
    expect(Math.round(diffDays)).toBe(7);
  });

  it("calculateAverageRating averages valid ratings", () => {
    expect(calculateAverageRating([])).toBe(0);
    expect(calculateAverageRating([{ rating: 4 }, { rating: 5 }, { rating: 3 }])).toBe(4);
    expect(calculateAverageRating([{ rating: null }, { rating: 5 }])).toBe(5);
  });

  it("formatAnalyticsCount formats large numbers", () => {
    expect(formatAnalyticsCount(0)).toBe("0");
    expect(formatAnalyticsCount(42)).toBe("42");
    expect(formatAnalyticsCount(1500)).toBe("1.5k");
    expect(formatAnalyticsCount(20000)).toBe("20k");
    expect(formatAnalyticsCount(-1)).toBe("0");
  });
});
