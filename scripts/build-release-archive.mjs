#!/usr/bin/env node
/**
 * Phase 14C — Release archive builder.
 *
 * Copies the canonical launch documents into a timestamped folder under
 * `release-artifacts/` and writes a README + manifest.json so the bundle
 * is self-describing. Docs/scripts only — does NOT touch DB, runtime
 * code, Stripe, or migrations.
 *
 * Usage:
 *   node scripts/build-release-archive.mjs
 */
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
  existsSync,
  statSync,
} from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// File set to bundle. Paths are relative to repo root.
const ROOT_DOCS = [
  "docs/release-status.md",
  "docs/release-status.generated.md",
  "docs/release-notes.md",
  "docs/final-launch-handoff.md",
  "docs/final-owner-signoff.md",
  "docs/launch-checklist.md",
  "docs/release-candidate-checklist.md",
  "docs/deployment-checklist.md",
  "docs/app-store-readiness.md",
  "docs/post-launch-checklist.md",
  "docs/production-verification-log.md",
  "docs/post-launch-issue-tracker.md",
  "docs/go-no-go-report.generated.json",
  "docs/release-archive-index.md",
  "docs/release-artifact-process.md",
];

const ADMIN_DOCS = [
  "docs/admin/README.md",
  "docs/admin/reviews-playbook.md",
  "docs/admin/business-claims-playbook.md",
  "docs/admin/sponsored-playbook.md",
  "docs/admin/billing-playbook.md",
  "docs/admin/incident-response-playbook.md",
  "docs/admin/post-launch-daily-checks.md",
  "docs/admin/first-72-hours-monitoring.md",
];

const ALL_FILES = [...ROOT_DOCS, ...ADMIN_DOCS];

// Timestamp like 2026-04-25T18-00-00Z (file-system safe).
const ts = new Date().toISOString().replace(/:/g, "-").replace(/\.\d+Z$/, "Z");
const archiveDir = resolve(ROOT, "release-artifacts", ts);
mkdirSync(archiveDir, { recursive: true });
mkdirSync(join(archiveDir, "docs", "admin"), { recursive: true });

const copied = [];
const missing = [];

for (const rel of ALL_FILES) {
  const src = resolve(ROOT, rel);
  const dest = resolve(archiveDir, rel);
  if (!existsSync(src)) {
    missing.push(rel);
    continue;
  }
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  const sizeBytes = statSync(dest).size;
  copied.push({ path: rel, size_bytes: sizeBytes });
}

// Manifest
const manifest = {
  generated_at: new Date().toISOString(),
  archive_folder: `release-artifacts/${ts}`,
  files_copied: copied.length,
  files_missing: missing.length,
  files: copied,
  missing,
};
writeFileSync(
  join(archiveDir, "manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
  "utf8",
);

// README
const readmeLines = [
  `# QMAPS — Release Archive ${ts}`,
  "",
  `_Generated: ${manifest.generated_at}_`,
  "",
  "This folder is a **point-in-time snapshot** of the QMAPS launch",
  "documentation. Hand it to the launch owner / client as the",
  "canonical release record.",
  "",
  "See `docs/release-archive-index.md` (in repo root) and",
  "`docs/release-artifact-process.md` for the full process.",
  "",
  "## Recommended reading order",
  "",
  "1. `docs/release-status.md` — current stakeholder snapshot",
  "2. `docs/final-launch-handoff.md` — owner handoff pack",
  "3. `docs/final-owner-signoff.md` — manual sign-off form",
  "4. `docs/post-launch-checklist.md` — T+0 → T+72h",
  "5. `docs/admin/first-72-hours-monitoring.md` — hour-by-hour schedule",
  "6. `docs/admin/incident-response-playbook.md` — when something breaks",
  "7. `docs/production-verification-log.md` — manual log",
  "8. `docs/post-launch-issue-tracker.md` — running issue list",
  "",
  `## Files included (${copied.length})`,
  "",
  "| File | Size (bytes) |",
  "|------|-------------:|",
  ...copied.map((f) => `| \`${f.path}\` | ${f.size_bytes} |`),
  "",
];

if (missing.length) {
  readmeLines.push(`## Missing files (${missing.length})`, "");
  readmeLines.push("These files were expected but not present at archive time:");
  readmeLines.push("");
  for (const m of missing) readmeLines.push(`- \`${m}\``);
  readmeLines.push("");
}

readmeLines.push("## Manifest");
readmeLines.push("");
readmeLines.push("Machine-readable file list lives in `manifest.json`.");
readmeLines.push("");

writeFileSync(join(archiveDir, "README.md"), readmeLines.join("\n"), "utf8");

// Console summary (always plain text, never throws)
console.log(`\nQMAPS Release Archive`);
console.log(`=====================\n`);
console.log(`Folder:        release-artifacts/${ts}`);
console.log(`Files copied:  ${copied.length}`);
console.log(`Files missing: ${missing.length}`);
if (missing.length) {
  for (const m of missing) console.log(`  - ${m}`);
}
console.log(`Manifest:      release-artifacts/${ts}/manifest.json`);
console.log(`README:        release-artifacts/${ts}/README.md\n`);
