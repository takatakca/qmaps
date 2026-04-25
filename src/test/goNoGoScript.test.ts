import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";

/**
 * Phase 13F + 13G — Smoke tests for the go/no-go script.
 */
const ROOT = resolve(__dirname, "..", "..");
const SCRIPT = resolve(ROOT, "scripts", "go-no-go.mjs");

describe("scripts/go-no-go.mjs", () => {
  it("references the four expected commands", () => {
    const src = readFileSync(SCRIPT, "utf8");
    expect(src).toContain("launch:check");
    expect(src).toContain("vitest run");
    expect(src).toContain("run build");
    expect(src).toContain("release:status:file");
  });

  it("prints a Final decision line", () => {
    const src = readFileSync(SCRIPT, "utf8");
    expect(src).toContain("Final decision");
  });

  it("supports --fail-fast in source", () => {
    const src = readFileSync(SCRIPT, "utf8");
    expect(src).toContain("--fail-fast");
  });

  it("--json emits valid JSON with required fields", () => {
    // Run with --out to a temp path so the script writes JSON without
    // depending on the success of the underlying steps. Even on NO-GO
    // (exit 1), the JSON file is written.
    const dir = mkdtempSync(join(tmpdir(), "gng-"));
    const out = join(dir, "report.json");
    try {
      try {
        execSync(`node ${SCRIPT} --out ${out} --fail-fast`, {
          cwd: ROOT,
          stdio: "pipe",
          timeout: 120_000,
        });
      } catch {
        // Non-zero exit is fine; we only need the JSON artifact.
      }
      expect(existsSync(out)).toBe(true);
      const parsed = JSON.parse(readFileSync(out, "utf8"));
      expect(parsed).toHaveProperty("decision");
      expect(["GO", "NO-GO"]).toContain(parsed.decision);
      expect(parsed).toHaveProperty("steps");
      expect(Array.isArray(parsed.steps)).toBe(true);
      expect(parsed).toHaveProperty("duration_ms");
      expect(typeof parsed.duration_ms).toBe("number");
      if (parsed.steps.length > 0) {
        expect(parsed.steps[0]).toHaveProperty("name");
        expect(parsed.steps[0]).toHaveProperty("ok");
        expect(parsed.steps[0]).toHaveProperty("duration_ms");
        expect(parsed.steps[0]).toHaveProperty("command");
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 180_000);
});
