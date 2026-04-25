import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

/**
 * Phase 13E — Smoke test for the release-status generator.
 *
 * Asserts the markdown output contains the headings stakeholders rely on.
 */
const SCRIPT = resolve(__dirname, "..", "..", "scripts", "release-status.mjs");

describe("scripts/release-status.mjs", () => {
  it("emits markdown with the expected headings", () => {
    const out = execSync(`node ${SCRIPT}`, { encoding: "utf8" });
    expect(out).toContain("QMAPS Release Status");
    expect(out).toContain("Launch checks");
    expect(out).toContain("Rollback");
  });
});
