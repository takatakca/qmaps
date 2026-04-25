#!/usr/bin/env node
/**
 * Phase 13E — Stakeholder-facing release status generator.
 *
 * Aggregates package metadata + launch-check results + presence of key
 * docs and prints a clean markdown report to stdout.
 *
 * Usage:
 *   node scripts/release-status.mjs            # prints to stdout
 *   node scripts/release-status.mjs --out path # writes to file as well
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const readJson = (rel) => {
  try {
    return JSON.parse(readFileSync(resolve(ROOT, rel), "utf8"));
  } catch {
    return null;
  }
};

const fileExists = (rel) => existsSync(resolve(ROOT, rel));

// 1. Package metadata
const pkg = readJson("package.json") || {};
const pkgName = pkg.name || "(unknown)";
const pkgVersion = pkg.version || "(unknown)";

// 2. Launch checks (run the JSON variant directly, never throw)
let launch = { passed: 0, failed: 0, total: 0, checks: [] };
let launchError = null;
try {
  const out = execFileSync(
    process.execPath,
    [resolve(ROOT, "scripts/launch-checks.mjs"), "--json"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  launch = JSON.parse(out);
} catch (e) {
  // Non-zero exit still produces parseable JSON on stdout for our script;
  // try to recover. If parsing fails, capture the error.
  if (e && typeof e.stdout === "string" && e.stdout.trim()) {
    try {
      launch = JSON.parse(e.stdout);
    } catch {
      launchError = String(e.message || e);
    }
  } else {
    launchError = String((e && e.message) || e);
  }
}

// 3. Doc presence
const DOCS = [
  "docs/release-notes.md",
  "docs/launch-checklist.md",
  "docs/release-candidate-checklist.md",
  "docs/deployment-checklist.md",
  "docs/app-store-readiness.md",
];
const docRows = DOCS.map((d) => ({ path: d, exists: fileExists(d) }));

// 4. Render markdown
const now = new Date().toISOString();

const lines = [];
lines.push(`# QMAPS Release Status`);
lines.push("");
lines.push(`_Generated: ${now}_`);
lines.push("");
lines.push(`**Project:** \`${pkgName}\` · **Version:** \`${pkgVersion}\``);
lines.push("");

lines.push(`## Launch checks`);
lines.push("");
if (launchError) {
  lines.push(`> ⚠️ Could not run launch checks: ${launchError}`);
} else {
  lines.push(
    `**${launch.passed}/${launch.total} passed**` +
      (launch.failed ? ` — ${launch.failed} failed` : ""),
  );
  lines.push("");
  lines.push(`| Status | Check |`);
  lines.push(`|--------|-------|`);
  for (const c of launch.checks) {
    const icon = c.ok ? "✅" : "❌";
    const detail = !c.ok && c.detail ? ` — ${c.detail}` : "";
    lines.push(`| ${icon} | ${c.name}${detail} |`);
  }
}
lines.push("");

lines.push(`## Documentation snapshot`);
lines.push("");
lines.push(`| Status | File |`);
lines.push(`|--------|------|`);
for (const d of docRows) {
  lines.push(`| ${d.exists ? "✅" : "❌"} | \`${d.path}\` |`);
}
lines.push("");

lines.push(`## Manual launch blockers`);
lines.push("");
lines.push(`- Stripe in **Live** mode + webhook secret set`);
lines.push(`- Custom domain DNS + SSL active (\`qmaps.app\`)`);
lines.push(`- Support mailboxes monitored daily`);
lines.push(`- Real-device mobile QA walk completed`);
lines.push(`- Owner sign-off on \`docs/app-store-readiness.md\``);
lines.push("");

lines.push(`## Rollback`);
lines.push("");
lines.push(
  `Restore the previous published version from the Lovable project history. ` +
    `Database state is **not** reverted automatically — review in-flight migrations ` +
    `with the Supabase linter before re-publishing. No service worker is registered, ` +
    `so clients pick up the rollback on next reload.`,
);
lines.push("");

const markdown = lines.join("\n");

// 5. Output
const outIdx = process.argv.indexOf("--out");
if (outIdx !== -1 && process.argv[outIdx + 1]) {
  const outPath = resolve(ROOT, process.argv[outIdx + 1]);
  writeFileSync(outPath, markdown, "utf8");
  process.stderr.write(`Wrote ${outPath}\n`);
}
process.stdout.write(markdown);

if (launch.failed && launch.failed > 0) {
  process.exit(1);
}
