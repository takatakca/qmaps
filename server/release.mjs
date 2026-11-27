import { readFileSync } from "node:fs";

export function readReleaseSha(marker = "/etc/qmaps/release-sha") {
  try {
    const sha = readFileSync(marker, "utf8").replace(/\n$/, "");
    return sha.length === 40 && /^[0-9a-f]+$/.test(sha) ? sha : null;
  } catch {
    return null;
  }
}
