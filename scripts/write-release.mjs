import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Every build path (including Coolify) must identify the source it serves.
// Explicit build metadata wins; an invalid supplied value must not silently fall back.
const supplied = process.env.SOURCE_COMMIT || process.env.GITHUB_SHA;
const sha = supplied || execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (!/^[a-f0-9]{40}$/i.test(sha)) throw new Error("A full source commit SHA is required");
writeFileSync(resolve("dist/qmaps-release.json"), JSON.stringify({ sha: sha.toLowerCase() }) + "\n");
