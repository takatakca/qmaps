import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

/**
 * Phase 13C — Smoke test for the launch-check JSON output.
 *
 * Executes the script directly (not via `bun run`) so the test does not
 * depend on a package-script wrapper, then asserts the JSON shape.
 */

const SCRIPT = resolve(__dirname, "..", "..", "scripts", "launch-checks.mjs");

describe("scripts/launch-checks.mjs --json", () => {
  it("emits valid JSON with total > 0", () => {
    const out = execSync(`node ${SCRIPT} --json`, { encoding: "utf8" });
    const parsed = JSON.parse(out);

    expect(typeof parsed.total).toBe("number");
    expect(parsed.total).toBeGreaterThan(0);
    expect(typeof parsed.passed).toBe("number");
    expect(typeof parsed.failed).toBe("number");
    expect(parsed.passed + parsed.failed).toBe(parsed.total);

    expect(Array.isArray(parsed.checks)).toBe(true);
    expect(parsed.checks.length).toBe(parsed.total);
    for (const c of parsed.checks) {
      expect(typeof c.name).toBe("string");
      expect(typeof c.ok).toBe("boolean");
    }
  });
});
