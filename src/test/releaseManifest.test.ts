import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const script = resolve("scripts/write-release.mjs");
const created: string[] = [];
const sha = "0123456789abcdef0123456789abcdef01234567";
function run(source: string, github: string) {
  const cwd = mkdtempSync(join(tmpdir(), "qmaps-release-"));
  created.push(cwd);
  mkdirSync(join(cwd, "dist"));
  const result = spawnSync(process.execPath, [script], {
    cwd,
    env: { ...process.env, SOURCE_COMMIT: source, GITHUB_SHA: github },
    encoding: "utf8",
  });
  return { cwd, result };
}
afterEach(() => created.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })));
describe("release provenance from the actual build command", () => {
  it("uses Coolify's full source commit before CI metadata", () => {
    const { cwd, result } = run(sha, "f".repeat(40));
    expect(result.status).toBe(0);
    expect(readFileSync(join(cwd, "dist/qmaps-release.json"), "utf8")).toBe(JSON.stringify({ sha }) + "\n");
  });
  it("supports the exact GitHub Actions commit", () => {
    const { cwd, result } = run("", sha);
    expect(result.status).toBe(0);
    expect(JSON.parse(readFileSync(join(cwd, "dist/qmaps-release.json"), "utf8"))).toEqual({ sha });
  });
  it("rejects an invalid explicit commit instead of mislabelling the build", () => {
    const { cwd, result } = run("latest", sha);
    expect(result.status).not.toBe(0);
    expect(existsSync(join(cwd, "dist/qmaps-release.json"))).toBe(false);
  });
});
