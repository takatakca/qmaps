import { describe, it, expect } from "vitest";
import {
  getReviewModerationSignals,
  getBusinessModerationSignals,
  scoreModerationSignals,
} from "@/lib/moderationSignals";

describe("moderationSignals", () => {
  it("flags very short text", () => {
    const s = getReviewModerationSignals({ body: "ok", rating: 3 });
    expect(s.find((x) => x.id === "very_short_text")).toBeTruthy();
  });

  it("flags repeated characters", () => {
    const s = getReviewModerationSignals({ body: "amazingggggg place", rating: 5 });
    expect(s.find((x) => x.id === "repeated_chars")).toBeTruthy();
  });

  it("flags suspicious link", () => {
    const s = getReviewModerationSignals({ body: "visit http://spam.example", rating: 1 });
    expect(s.find((x) => x.id === "suspicious_link")).toBeTruthy();
  });

  it("flags extreme rating with no text", () => {
    const s = getReviewModerationSignals({ body: "", rating: 1 });
    expect(s.find((x) => x.id === "extreme_rating_no_text")).toBeTruthy();
  });

  it("flags duplicate body", () => {
    const s = getReviewModerationSignals({ body: "Great place to eat", rating: 5 }, { duplicateBodyForBusiness: true });
    expect(s.find((x) => x.id === "duplicate_body")).toBeTruthy();
  });

  it("scores severity levels", () => {
    expect(scoreModerationSignals([{ id: "a", label: "x", severity: "low" }]).level).toBe("low");
    expect(scoreModerationSignals([{ id: "b", label: "x", severity: "medium" }]).level).toBe("medium");
    expect(scoreModerationSignals([
      { id: "c", label: "x", severity: "high" },
    ]).level).toBe("high");
  });

  it("flags many reports on business", () => {
    const s = getBusinessModerationSignals({ id: "1" }, { reportCount: 5 });
    expect(s.find((x) => x.id === "many_reports")).toBeTruthy();
  });
});
