import { describe, it, expect } from "vitest";
import {
  LAUNCH_CHECK_GROUPS,
  LEGAL_ROUTES,
  PWA_ASSETS,
  allLaunchCheckIds,
  computeEnvStates,
  getLaunchCheckGroup,
} from "@/lib/launchChecks";

describe("launchChecks: structure", () => {
  it("exposes the five expected groups", () => {
    expect(LAUNCH_CHECK_GROUPS.map((g) => g.id)).toEqual([
      "pwa",
      "legal",
      "env",
      "stripe",
      "tests",
    ]);
  });

  it("ids are unique across all groups", () => {
    const ids = allLaunchCheckIds();
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("legal group covers all five public legal routes", () => {
    const legal = getLaunchCheckGroup("legal");
    expect(legal).toBeDefined();
    const paths = legal!.items.map((i) => i.path);
    for (const r of LEGAL_ROUTES) {
      expect(paths).toContain(r);
    }
  });

  it("pwa group covers manifest, robots, sitemap", () => {
    const pwa = getLaunchCheckGroup("pwa");
    expect(pwa!.items.map((i) => i.id).sort()).toEqual(
      PWA_ASSETS.map((a) => a.id).sort(),
    );
  });
});

describe("launchChecks: computeEnvStates", () => {
  it("flags everything as fail when env is empty", () => {
    const s = computeEnvStates({});
    expect(s["env:supabase-url"]).toBe("fail");
    expect(s["env:supabase-key"]).toBe("fail");
    expect(s["env:project-id"]).toBe("fail");
    expect(s["env:backend-ready"]).toBe("fail");
  });

  it("marks backend ready only when url + key are both present", () => {
    expect(
      computeEnvStates({ supabaseUrl: "x" })["env:backend-ready"],
    ).toBe("fail");
    expect(
      computeEnvStates({ supabaseKey: "y" })["env:backend-ready"],
    ).toBe("fail");
    expect(
      computeEnvStates({ supabaseUrl: "x", supabaseKey: "y" })[
        "env:backend-ready"
      ],
    ).toBe("ok");
  });

  it("project id is independent of backend-ready", () => {
    const s = computeEnvStates({
      supabaseUrl: "x",
      supabaseKey: "y",
      projectId: "p",
    });
    expect(s["env:project-id"]).toBe("ok");
    expect(s["env:backend-ready"]).toBe("ok");
  });
});
