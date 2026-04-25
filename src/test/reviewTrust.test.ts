import { describe, it, expect } from "vitest";
import {
  calculateRiskLevel,
  computeLocalReviewSignals,
  computeRiskFromSignals,
  formatRiskLevelPublic,
  scoreReviewLocally,
} from "@/lib/reviewTrust";

describe("reviewTrust: calculateRiskLevel", () => {
  it.each([
    [0, "low"],
    [24, "low"],
    [25, "medium"],
    [49, "medium"],
    [50, "high"],
    [74, "high"],
    [75, "critical"],
    [100, "critical"],
  ])("score %i → %s", (score, level) => {
    expect(calculateRiskLevel(score)).toBe(level);
  });

  it("clamps out-of-range values", () => {
    expect(calculateRiskLevel(-50)).toBe("low");
    expect(calculateRiskLevel(9999)).toBe("critical");
  });
});

describe("reviewTrust: computeLocalReviewSignals", () => {
  it("flags extreme rating + short body", () => {
    const sigs = computeLocalReviewSignals({ body: "Bad", rating: 1 });
    const types = sigs.map((s) => s.signal_type);
    expect(types).toContain("extreme_rating");
    expect(types).toContain("short_low_context");
  });

  it("flags brand-new account on extreme rating with high severity", () => {
    const sigs = computeLocalReviewSignals({
      body: "Excellent",
      rating: 5,
      user_created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    });
    const newAcct = sigs.find((s) => s.signal_type === "new_account");
    expect(newAcct?.severity).toBe("high");
  });

  it("flags burst activity at >= 5 reviews/24h", () => {
    const sigs = computeLocalReviewSignals({
      body: "Great place with lots to say about it",
      rating: 4,
      user_review_count_last_24h: 6,
    });
    expect(sigs.find((s) => s.signal_type === "burst_activity")?.severity).toBe("high");
  });

  it("rewards trusted history", () => {
    const sigs = computeLocalReviewSignals({
      body: "Solid spot, came back after a few months",
      rating: 4,
      user_review_count_total: 50,
      user_review_count_last_24h: 0,
    });
    expect(sigs.some((s) => s.signal_type === "trusted_history")).toBe(true);
  });

  it("flags duplicate text as critical at >= 4 occurrences", () => {
    const sigs = computeLocalReviewSignals({
      body: "Same text",
      rating: 5,
      same_text_count_by_user: 5,
    });
    const dup = sigs.find((s) => s.signal_type === "duplicate_text");
    expect(dup?.severity).toBe("critical");
  });

  it("returns no signals for a normal review", () => {
    const sigs = computeLocalReviewSignals({
      body: "Friendly staff, decent prices, would come back next time",
      rating: 4,
      user_review_count_last_24h: 1,
      user_review_count_total: 8,
    });
    expect(sigs).toHaveLength(0);
  });
});

describe("reviewTrust: computeRiskFromSignals", () => {
  it("clamps risk_score to 0-100", () => {
    const result = computeRiskFromSignals([
      { signal_type: "duplicate_text", severity: "critical", score: 0, explanation: "x" },
      { signal_type: "admin_flagged", severity: "critical", score: 0, explanation: "x" },
      { signal_type: "burst_activity", severity: "high", score: 0, explanation: "x" },
    ]);
    expect(result.risk_score).toBeLessThanOrEqual(100);
    expect(result.risk_score).toBeGreaterThanOrEqual(0);
    expect(result.risk_level).toBe("critical");
  });

  it("returns low risk for empty signals", () => {
    const result = computeRiskFromSignals([]);
    expect(result.risk_score).toBe(0);
    expect(result.risk_level).toBe("low");
    expect(result.trust_score).toBe(1);
  });

  it("trusted_history reduces risk", () => {
    const without = computeRiskFromSignals([
      { signal_type: "extreme_rating", severity: "medium", score: 0, explanation: "x" },
    ]);
    const withTrust = computeRiskFromSignals([
      { signal_type: "extreme_rating", severity: "medium", score: 0, explanation: "x" },
      { signal_type: "trusted_history", severity: "low", score: 0, explanation: "x" },
    ]);
    expect(withTrust.risk_score).toBeLessThan(without.risk_score);
  });
});

describe("reviewTrust: formatRiskLevelPublic", () => {
  it("never reveals 'fake' or 'risque' wording to public", () => {
    for (const level of ["low", "medium", "high", "critical"] as const) {
      const text = formatRiskLevelPublic(level).toLowerCase();
      expect(text).not.toMatch(/fake|faux|risque|fraud/);
    }
  });
});

describe("reviewTrust: scoreReviewLocally end-to-end", () => {
  it("returns a complete result envelope", () => {
    const r = scoreReviewLocally({ body: "Bad", rating: 1 });
    expect(r).toHaveProperty("risk_score");
    expect(r).toHaveProperty("risk_level");
    expect(r).toHaveProperty("trust_score");
    expect(r).toHaveProperty("applied");
    expect(r).toHaveProperty("summary");
  });
});
