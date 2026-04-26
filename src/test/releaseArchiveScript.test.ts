import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Phase 14C — Smoke test for the release-archive builder.
 *
 * Verifies the script and supporting docs are in place. Does NOT
 * execute the script (it would write to the repo on every test run).
 */
const ROOT = resolve(__dirname, "..", "..");

describe("release archive package", () => {
  it("scripts/build-release-archive.mjs exists", () => {
    expect(existsSync(resolve(ROOT, "scripts/build-release-archive.mjs"))).toBe(
      true,
    );
  });

  it("package.json exposes the release:archive script", () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
    expect(pkg.scripts).toBeTruthy();
    expect(pkg.scripts["release:archive"]).toContain("build-release-archive");
  });

  it("docs/release-archive-index.md references the major required docs", () => {
    const md = readFileSync(
      resolve(ROOT, "docs/release-archive-index.md"),
      "utf8",
    );
    for (const required of [
      "release-status.md",
      "final-launch-handoff.md",
      "final-owner-signoff.md",
      "launch-checklist.md",
      "release-candidate-checklist.md",
      "post-launch-checklist.md",
      "production-verification-log.md",
      "post-launch-issue-tracker.md",
      "go-no-go-report.generated.json",
      "admin/incident-response-playbook.md",
    ]) {
      expect(md).toContain(required);
    }
  });

  it("docs/release-artifact-process.md exists and explains owner handoff", () => {
    const path = resolve(ROOT, "docs/release-artifact-process.md");
    expect(existsSync(path)).toBe(true);
    const md = readFileSync(path, "utf8");
    expect(md).toContain("owner");
    expect(md).toContain("release:archive");
  });
});
