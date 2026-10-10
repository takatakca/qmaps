import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  matchBusinessAreas,
  matchScopeScore,
  type ServiceArea,
} from "../../supabase/functions/_shared/takatak-matching";

const areas: ServiceArea[] = [
  {
    business_id: "postal",
    city: "Montréal",
    region: "QC",
    postal_code_prefix: "H1H",
  },
  {
    business_id: "city",
    city: "Laval",
    region: null,
    postal_code_prefix: null,
  },
  {
    business_id: "region",
    city: null,
    region: "QC",
    postal_code_prefix: null,
  },
  {
    business_id: "empty",
    city: null,
    region: null,
    postal_code_prefix: null,
  },
];

describe("TAKATAK QMAPS matching adapter", () => {
  it("preserves the existing QMAPS no-area means unrestricted behavior", () => {
    expect(
      matchBusinessAreas("no-areas", areas, {
        city: "Montréal",
        region: "QC",
        postalCode: "H1H 1H1",
      }),
    ).toEqual({ matches: true, scope: "unrestricted" });
  });

  it("requires every configured constraint on a service-area row", () => {
    expect(
      matchBusinessAreas("postal", areas, {
        city: "Montréal",
        region: "QC",
        postalCode: "H1H 1H1",
      }),
    ).toEqual({ matches: true, scope: "postal" });

    expect(
      matchBusinessAreas("postal", areas, {
        city: "Laval",
        region: "QC",
        postalCode: "H1H 1H1",
      }).matches,
    ).toBe(false);
  });

  it("matches city and region scopes case-insensitively", () => {
    expect(
      matchBusinessAreas("city", areas, {
        city: "laval",
        region: "qc",
        postalCode: "H7A 1A1",
      }),
    ).toEqual({ matches: true, scope: "city" });

    expect(
      matchBusinessAreas("region", areas, {
        city: "Québec",
        region: "qc",
        postalCode: "G1A 1A1",
      }),
    ).toEqual({ matches: true, scope: "region" });
  });

  it("treats an explicitly empty service-area row as unrestricted", () => {
    expect(
      matchBusinessAreas("empty", areas, {
        city: "Sherbrooke",
        region: "QC",
        postalCode: "J1H 1A1",
      }),
    ).toEqual({ matches: true, scope: "unrestricted" });
  });

  it("orders match specificity predictably", () => {
    expect(matchScopeScore("postal")).toBeGreaterThan(matchScopeScore("city"));
    expect(matchScopeScore("city")).toBeGreaterThan(matchScopeScore("region"));
    expect(matchScopeScore("region")).toBeGreaterThan(matchScopeScore("unrestricted"));
  });

  it("keeps the external function HMAC-only and privacy-minimized", () => {
    const source = readFileSync(
      resolve(process.cwd(), "supabase/functions/takatak-match-businesses/index.ts"),
      "utf8",
    );

    expect(source).toContain('req.headers.get("x-integration-id")');
    expect(source).toContain('req.headers.get("x-signature")');
    expect(source).toContain('TAKATAK_QMAPS_MATCHING_SECRET');
    expect(source).toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(source).toContain('.select("business_id")');
    expect(source).not.toMatch(/select\([^)]*phone/i);
    expect(source).not.toMatch(/select\([^)]*email/i);
    expect(source).not.toContain("Access-Control-Allow-Origin");
  });
});
