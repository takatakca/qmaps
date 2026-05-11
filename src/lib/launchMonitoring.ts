/**
 * Phase 15J — Launch monitoring helpers.
 *
 * Pure helpers used by the admin launch status surface and any future
 * monitoring widgets. No side effects, no React, no fetch.
 */

export type LaunchSeverity = "info" | "low" | "medium" | "high" | "critical";

export type LaunchIssueArea =
  | "auth"
  | "admin"
  | "search"
  | "business_detail"
  | "build"
  | "tests"
  | "launch_check"
  | "go_no_go"
  | "performance"
  | "seo"
  | "other";

export interface LaunchIssue {
  id?: string;
  area: LaunchIssueArea;
  severity: LaunchSeverity;
  message?: string;
  ok?: boolean;
}

export interface LaunchCheckLike {
  id: string;
  ok: boolean;
  severity?: LaunchSeverity;
  area?: LaunchIssueArea;
  message?: string;
}

export interface LaunchCheckSummary {
  total: number;
  passed: number;
  failed: number;
  bySeverity: Record<LaunchSeverity, number>;
}

const SEVERITY_LABELS: Record<LaunchSeverity, string> = {
  info: "Info",
  low: "Faible",
  medium: "Moyen",
  high: "Élevé",
  critical: "Critique",
};

const BLOCKING_AREAS: LaunchIssueArea[] = [
  "auth",
  "admin",
  "search",
  "business_detail",
  "build",
  "tests",
  "launch_check",
  "go_no_go",
];

/**
 * Map a free-form issue (failing check, runtime signal) to a normalized
 * severity. Pure — used to drive UI badges and blocking decisions.
 */
export const classifyLaunchIssue = (
  issue: Pick<LaunchIssue, "area" | "severity" | "ok">,
): LaunchSeverity => {
  if (issue.ok === true) return "info";
  if (issue.severity) return issue.severity;
  if (BLOCKING_AREAS.includes(issue.area)) return "critical";
  if (issue.area === "performance" || issue.area === "seo") return "medium";
  return "low";
};

export const getLaunchSeverityLabel = (severity: LaunchSeverity): string =>
  SEVERITY_LABELS[severity] ?? "Inconnu";

const emptyBySeverity = (): Record<LaunchSeverity, number> => ({
  info: 0,
  low: 0,
  medium: 0,
  high: 0,
  critical: 0,
});

export const buildLaunchCheckSummary = (
  checks: LaunchCheckLike[],
): LaunchCheckSummary => {
  const summary: LaunchCheckSummary = {
    total: checks.length,
    passed: 0,
    failed: 0,
    bySeverity: emptyBySeverity(),
  };
  for (const c of checks) {
    if (c.ok) {
      summary.passed += 1;
    } else {
      summary.failed += 1;
      const sev = classifyLaunchIssue({
        area: c.area ?? "other",
        severity: c.severity,
        ok: c.ok,
      });
      summary.bySeverity[sev] += 1;
    }
  }
  return summary;
};

/**
 * Returns true if the launch should be blocked given the current checks.
 *
 * Blocks when:
 *  - any failing check has severity `critical` or `high`
 *  - any failing check is in a blocking area (auth, admin, search, etc.)
 */
export const shouldBlockLaunch = (checks: LaunchCheckLike[]): boolean => {
  for (const c of checks) {
    if (c.ok) continue;
    const sev = classifyLaunchIssue({
      area: c.area ?? "other",
      severity: c.severity,
      ok: c.ok,
    });
    if (sev === "critical" || sev === "high") return true;
    if (c.area && BLOCKING_AREAS.includes(c.area)) return true;
  }
  return false;
};
