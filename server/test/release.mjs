import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { readReleaseSha } from "../release.mjs";

test("only a complete lowercase commit SHA is accepted from the image marker", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "qmaps-release-test-"));
  t.after(() => rmSync(dir, { force: true, recursive: true }));
  const marker = join(dir, "release-sha");
  const sha = "a1b2c3d4e5f67890123456789a0b1c2d3e4f5678";
  assert.equal(readReleaseSha(marker), null);
  for (const value of [
    "", "\n", sha.slice(0, 39), sha + "0", sha.toUpperCase(), sha + "\r\n",
    sha + "\n\n", "\uFEFF" + sha, " " + sha, sha + "\nmalformed", "x" + sha.slice(1),
  ]) {
    writeFileSync(marker, value);
    assert.equal(readReleaseSha(marker), null);
  }
  for (const value of [sha, sha + "\n"]) {
    writeFileSync(marker, value);
    assert.equal(readReleaseSha(marker), sha);
  }
});
