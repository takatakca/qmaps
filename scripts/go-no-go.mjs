#!/usr/bin/env node
/**
 * Phase 13F — Final go/no-go gate.
 *
 * Runs, in order:
 *   1. bun run launch:check
 *   2. bunx vitest run
 *   3. bun run build
 *   4. bun run release:status:file
 *
 * Prints a clean summary and exits 0 (GO) only if all four pass.
 */
import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const steps = [
  { name: "Launch checks", cmd: "bun", args: ["run", "launch:check"] },
  { name: "Tests", cmd: "bunx", args: ["vitest", "run"] },
  { name: "Build", cmd: "bun", args: ["run", "build"] },
  { name: "Release status snapshot", cmd: "bun", args: ["run", "release:status:file"] },
];

const results = [];

console.log("\nQMAPS Go / No-Go Gate\n=====================\n");

for (const step of steps) {
  process.stdout.write(`${step.name} … `);
  try {
    execSync(`${step.cmd} ${step.args.join(" ")}`, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: "pipe",
    });
    results.push({ name: step.name, ok: true });
    console.log("PASS ✅");
  } catch (e) {
    results.push({ name: step.name, ok: false, error: e.message || String(e) });
    console.log("FAIL ❌");
  }
}

const passed = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok);

console.log("");
console.log(`Results: ${passed}/${results.length} passed`);
if (failed.length) {
  console.log("");
  for (const f of failed) {
    console.log(`  ❌ ${f.name}`);
  }
}

const decision = failed.length === 0 ? "GO" : "NO-GO";
const icon = failed.length === 0 ? "🚀" : "🛑";
console.log("");
console.log(`Final decision: ${decision} ${icon}`);
console.log("");

process.exit(failed.length === 0 ? 0 : 1);
