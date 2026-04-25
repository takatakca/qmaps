import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Phase 13F — Smoke test for the go/no-go script.
 *
 * Verifies the script contains the four expected commands and prints
 * the "Final decision" line so stakeholders get a binary answer.
 */
const SCRIPT = resolve(__dirname, "..", "..", "scripts", "go-no-go.mjs");

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
});
