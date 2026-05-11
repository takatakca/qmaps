import { describe, it, expect } from "vitest";
import {
  classifyLaunchIssue,
  getLaunchSeverityLabel,
  buildLaunchCheckSummary,
  shouldBlockLaunch,
} from "@/lib/launchMonitoring";

describe("launchMonitoring", () => {
  describe("classifyLaunchIssue", () => {
    it("returns info when ok", () => {
      expect(classifyLaunchIssue({ area: "auth", ok: true })).toBe("info");
    });
    it("respects explicit severity", () => {
      expect(
        classifyLaunchIssue({ area: "seo", severity: "high", ok: false }),
      ).toBe("high");
    });
    it("treats blocking areas as critical when failing", () => {
      expect(classifyLaunchIssue({ area: "auth", ok: false })).toBe("critical");
      expect(classifyLaunchIssue({ area: "build", ok: false })).toBe("critical");
    });
    it("treats perf/seo as medium when failing", () => {
      expect(classifyLaunchIssue({ area: "seo", ok: false })).toBe("medium");
      expect(classifyLaunchIssue({ area: "performance", ok: false })).toBe(
        "medium",
      );
    });
    it("defaults to low otherwise", () => {
      expect(classifyLaunchIssue({ area: "other", ok: false })).toBe("low");
    });
  });

  describe("getLaunchSeverityLabel", () => {
    it("returns French labels", () => {
      expect(getLaunchSeverityLabel("critical")).toBe("Critique");
      expect(getLaunchSeverityLabel("high")).toBe("Élevé");
      expect(getLaunchSeverityLabel("medium")).toBe("Moyen");
      expect(getLaunchSeverityLabel("low")).toBe("Faible");
      expect(getLaunchSeverityLabel("info")).toBe("Info");
    });
  });

  describe("buildLaunchCheckSummary", () => {
    it("counts passed and failed and severities", () => {
      const summary = buildLaunchCheckSummary([
        { id: "a", ok: true, area: "auth" },
        { id: "b", ok: false, area: "auth" },
        { id: "c", ok: false, area: "seo" },
        { id: "d", ok: false, area: "other" },
      ]);
      expect(summary.total).toBe(4);
      expect(summary.passed).toBe(1);
      expect(summary.failed).toBe(3);
      expect(summary.bySeverity.critical).toBe(1);
      expect(summary.bySeverity.medium).toBe(1);
      expect(summary.bySeverity.low).toBe(1);
    });

    it("returns zeros for empty input", () => {
      const summary = buildLaunchCheckSummary([]);
      expect(summary.total).toBe(0);
      expect(summary.failed).toBe(0);
      expect(summary.bySeverity.critical).toBe(0);
    });
  });

  describe("shouldBlockLaunch", () => {
    it("does not block when all pass", () => {
      expect(
        shouldBlockLaunch([
          { id: "a", ok: true, area: "auth" },
          { id: "b", ok: true, area: "build" },
        ]),
      ).toBe(false);
    });
    it("blocks on a critical failure", () => {
      expect(
        shouldBlockLaunch([{ id: "a", ok: false, area: "auth" }]),
      ).toBe(true);
    });
    it("blocks on explicit high severity", () => {
      expect(
        shouldBlockLaunch([
          { id: "a", ok: false, area: "other", severity: "high" },
        ]),
      ).toBe(true);
    });
    it("does not block on a low/medium-only failure", () => {
      expect(
        shouldBlockLaunch([{ id: "a", ok: false, area: "seo" }]),
      ).toBe(false);
    });
  });
});
