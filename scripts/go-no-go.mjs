#!/usr/bin/env node
/**
 * Phase 13F + 13G — Final go/no-go gate.
 *
 * Runs, in order:
 *   1. bun run launch:check
 *   2. bunx vitest run
 *   3. bun run build
 *   4. bun run release:status:file
 *
 * CLI flags (Phase 13G):
 *   --json             Emit a machine-readable JSON report to stdout.
 *   --out <path>       Write the JSON report to <path> (implies --json).
 *   --fail-fast        Stop at the first failing step.
 *
 * Exits 0 (GO) only if all steps pass.
 */
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const argv = process.argv.slice(2);
const jsonMode = argv.includes("--json") || argv.includes("--out");
const failFast = argv.includes("--fail-fast");
const outIdx = argv.indexOf("--out");
const outPath = outIdx >= 0 ? argv[outIdx + 1] : null;

const allSteps = [
  { name: "Launch checks", cmd: "bun", args: ["run", "launch:check"] },
  { name: "Tests", cmd: "bunx", args: ["vitest", "run"] },
  { name: "Build", cmd: "bun", args: ["run", "build"] },
  { name: "Release status snapshot", cmd: "bun", args: ["run", "release:status:file"] },
];

// Internal: GO_NO_GO_STEPS filters which steps run (comma-separated names).
// Used by tests to keep CI runs cheap. Not part of the public CLI.
const stepFilter = process.env.GO_NO_GO_STEPS
  ? new Set(process.env.GO_NO_GO_STEPS.split(",").map((s) => s.trim()))
  : null;
const steps = stepFilter ? allSteps.filter((s) => stepFilter.has(s.name)) : allSteps;

const results = [];
const overallStart = Date.now();

if (!jsonMode) {
  console.log("\nQMAPS Go / No-Go Gate\n=====================\n");
}

for (const step of steps) {
  const command = `${step.cmd} ${step.args.join(" ")}`;
  if (!jsonMode) process.stdout.write(`${step.name} … `);
  const start = Date.now();
  let ok = true;
  let error = null;
  try {
    execSync(command, { cwd: ROOT, encoding: "utf8", stdio: "pipe" });
  } catch (e) {
    ok = false;
    error = e.message || String(e);
  }
  const duration_ms = Date.now() - start;
  results.push({ name: step.name, ok, duration_ms, command, ...(error ? { error } : {}) });
  if (!jsonMode) console.log(ok ? `PASS ✅ (${duration_ms}ms)` : `FAIL ❌ (${duration_ms}ms)`);
  if (!ok && failFast) break;
}

const total_duration_ms = Date.now() - overallStart;
const passed = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok);
const total = results.length;
const decision = failed.length === 0 && total === steps.length ? "GO" : "NO-GO";

const report = {
  decision,
  passed,
  failed: failed.length,
  total,
  duration_ms: total_duration_ms,
  steps: results.map(({ name, ok, duration_ms, command }) => ({
    name,
    ok,
    duration_ms,
    command,
  })),
};

if (outPath) {
  const abs = resolve(ROOT, outPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, JSON.stringify(report, null, 2) + "\n", "utf8");
}

if (jsonMode) {
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
} else {
  console.log("");
  console.log(`Results: ${passed}/${total} passed`);
  if (failed.length) {
    console.log("");
    for (const f of failed) {
      console.log(`  ❌ ${f.name}`);
    }
  }
  const icon = decision === "GO" ? "🚀" : "🛑";
  console.log("");
  console.log(`Final decision: ${decision} ${icon}`);
  console.log("");
}

process.exit(decision === "GO" ? 0 : 1);
