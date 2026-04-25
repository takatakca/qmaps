#!/usr/bin/env node
/**
 * Phase 13B — Executable launch checks.
 *
 * Verifies static launch-blocking artifacts (PWA, robots, legal pages, docs).
 * Prints a readable report and exits non-zero on any failure.
 *
 * Usage: bun run launch:check
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const results = [];
const record = (name, ok, detail = "") =>
  results.push({ name, ok, detail });

const fileExists = (rel) => existsSync(resolve(ROOT, rel));
const readFile = (rel) => readFileSync(resolve(ROOT, rel), "utf8");

// 1. robots.txt
try {
  if (!fileExists("public/robots.txt")) {
    record("robots.txt exists", false, "missing public/robots.txt");
  } else {
    const robots = readFile("public/robots.txt");
    record("robots.txt exists", true);
    record(
      "robots.txt references sitemap",
      /Sitemap:\s*\/sitemap\.xml/i.test(robots),
      "expected `Sitemap: /sitemap.xml`",
    );
  }
} catch (e) {
  record("robots.txt readable", false, String(e));
}

// 2. manifest.webmanifest
try {
  if (!fileExists("public/manifest.webmanifest")) {
    record("manifest.webmanifest exists", false);
  } else {
    record("manifest.webmanifest exists", true);
    const manifest = JSON.parse(readFile("public/manifest.webmanifest"));
    const required = ["name", "short_name", "start_url", "display", "icons"];
    for (const key of required) {
      const present =
        key === "icons"
          ? Array.isArray(manifest.icons) && manifest.icons.length > 0
          : !!manifest[key];
      record(`manifest.${key} present`, present);
    }
  }
} catch (e) {
  record("manifest.webmanifest valid JSON", false, String(e));
}

// 3. Legal page source files
const legalPages = [
  "src/pages/legal/Privacy.tsx",
  "src/pages/legal/Terms.tsx",
  "src/pages/legal/Cookies.tsx",
  "src/pages/legal/AccountDeletionPolicy.tsx",
  "src/pages/legal/SupportPolicy.tsx",
];
for (const p of legalPages) {
  record(`legal page: ${p}`, fileExists(p));
}

// 4. Required launch docs
const docs = [
  "docs/release-candidate-checklist.md",
  "docs/deployment-checklist.md",
  "docs/app-store-readiness.md",
];
for (const d of docs) {
  record(`doc: ${d}`, fileExists(d));
}

// Report
const passed = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok);

const PAD = 50;
console.log("\nQMAPS launch checks\n===================");
for (const r of results) {
  const icon = r.ok ? "✅" : "❌";
  const detail = r.detail ? `  — ${r.detail}` : "";
  console.log(`${icon}  ${r.name.padEnd(PAD)}${detail}`);
}
console.log(
  `\n${passed}/${results.length} passed${failed.length ? `, ${failed.length} failed` : ""}.`,
);

if (failed.length) {
  console.error("\nLaunch checks failed. See ❌ rows above.\n");
  process.exit(1);
}
