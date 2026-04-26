import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Phase 14D — Smoke tests for the owner handoff bundle additions.
 */
const ROOT = resolve(__dirname, "..", "..");

describe("phase 14D — owner handoff & zip support", () => {
  it("package.json exposes release:archive:zip", () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
    expect(pkg.scripts["release:archive:zip"]).toContain("--zip");
  });

  it("docs/owner-handoff-email-template.md exists with English + French sections", () => {
    const path = resolve(ROOT, "docs/owner-handoff-email-template.md");
    expect(existsSync(path)).toBe(true);
    const md = readFileSync(path, "utf8");
    expect(md).toMatch(/##\s+English version/);
    expect(md).toMatch(/##\s+Version française/);
  });

  it("scripts/build-release-archive.mjs supports --zip with a non-fatal fallback", () => {
    const src = readFileSync(
      resolve(ROOT, "scripts/build-release-archive.mjs"),
      "utf8",
    );
    expect(src).toContain("--zip");
    // Non-fatal fallback: when zip is missing the script must keep
    // running rather than throw / exit non-zero.
    expect(src.toLowerCase()).toContain("kept folder archive");
  });

  it("docs/release-archive-diff.md exists and explains generated vs real changes", () => {
    const path = resolve(ROOT, "docs/release-archive-diff.md");
    expect(existsSync(path)).toBe(true);
    const md = readFileSync(path, "utf8");
    expect(md).toContain("diff -ru");
    expect(md).toMatch(/generated/i);
  });
});
