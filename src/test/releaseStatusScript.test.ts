import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

/**
 * Phase 13E — Smoke test for the release-status generator.
 *
 * Asserts the markdown output contains the headings stakeholders rely on.
 */
const SCRIPT = resolve(__dirname, "..", "..", "scripts", "release-status.mjs");

describe("scripts/release-status.mjs", () => {
  it("emits markdown with the expected headings", () => {
    const out = execFileSync(process.execPath, [SCRIPT], { encoding: "utf8" });
    expect(out).toContain("QMAPS Release Status");
    expect(out).toContain("Launch checks");
    expect(out).toContain("Rollback");
    expect(out).toContain("local repository files only");
    expect(out).toContain("web SHA and PostgreSQL API SHA separately in Coolify");
    expect(out).toContain("isolated Stripe Sandbox");
    expect(out).toContain("does not revert PostgreSQL or withdraw a published directory batch");
    expect(out).not.toMatch(/Lovable|qmaps\.app|Stripe in \*\*Live\*\*/i);
  });
});
