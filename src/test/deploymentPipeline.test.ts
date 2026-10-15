import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("QMAPS deployment pipeline contract", () => {
  const yaml = readFileSync(
    resolve(process.cwd(), ".github/workflows/qmaps-ssh-deploy.yml"),
    "utf8",
  );

  it("requires explicit opt-in and an approved main CI revision", () => {
    expect(yaml).toContain("QMAPS_DEPLOY_ENABLED == 'true'");
    expect(yaml).toContain("refs/heads/main");
    expect(yaml).toContain("workflow_run.conclusion == 'success'");
    expect(yaml).toContain("workflow_run.head_repository.full_name == github.repository");
    expect(yaml).toContain("git ls-remote origin refs/heads/main");
    expect(yaml).toContain("git rev-parse HEAD");
    expect(yaml).toContain("actions: read");
    expect(yaml).toContain("Require successful main CI before manual dispatch");
    expect(yaml).toContain("github.event.workflow_run.head_branch == 'main'");
    expect(yaml).toContain("gh api -X GET");
    expect(yaml).toContain('select(.head_sha == $sha and .conclusion == "success"');
    expect(yaml).toContain("Manual deploy refused");
    expect(yaml).toContain("Unsafe SSH web root path");
  });

  it("builds on GitHub and verifies the exact published SHA", () => {
    expect(yaml).toContain("bun run build");
    expect(yaml).toContain('dist/qmaps-release.json');
    expect(yaml).toContain("rsync -az");
    expect(yaml).not.toContain("rsync -az --delete");
    expect(yaml).toContain("Verify exact deployed revision");
    expect(yaml).toContain('"$BASE_URL/qmaps-release.json"');
    expect(yaml).toContain('if [ "$RELEASE" != "$EXPECTED" ]; then');
    expect(yaml).toContain("StrictHostKeyChecking=yes");
  });
});
