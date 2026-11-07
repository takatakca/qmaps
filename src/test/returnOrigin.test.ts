import { describe, expect, it } from "vitest";
import {
  DEFAULT_RETURN_ORIGIN,
  getTrustedReturnOrigin,
} from "../../supabase/functions/_shared/returnOrigin.ts";

const requestWithHeaders = (headers: Record<string, string>) => ({
  headers: {
    get: (name: string) => headers[name.toLowerCase()] ?? null,
  },
});

describe("Stripe return origin allowlist", () => {
  it("accepts the canonical production origin", () => {
    expect(
      getTrustedReturnOrigin(requestWithHeaders({ origin: "https://qmaps.ca" })),
    ).toBe("https://qmaps.ca");
  });

  it("rejects untrusted Origin and Referer headers", () => {
    expect(
      getTrustedReturnOrigin(
        requestWithHeaders({
          origin: "https://attacker.example",
          referer: "https://attacker.example/merchant/billing",
        }),
      ),
    ).toBe(DEFAULT_RETURN_ORIGIN);
  });

  it("allows an explicitly configured deployment origin", () => {
    expect(
      getTrustedReturnOrigin(
        requestWithHeaders({ origin: "https://staging.qmaps.ca" }),
        ["https://staging.qmaps.ca"],
      ),
    ).toBe("https://staging.qmaps.ca");
  });

  it("does not accept credentials, insecure remote origins, or host suffix tricks", () => {
    for (const origin of [
      "http://qmaps.ca",
      "https://qmaps.ca.attacker.example",
      "https://user@qmaps.ca",
    ]) {
      expect(
        getTrustedReturnOrigin(requestWithHeaders({ origin })),
      ).toBe(DEFAULT_RETURN_ORIGIN);
    }
  });

  it("supports explicitly allowed local development origins", () => {
    expect(
      getTrustedReturnOrigin(
        requestWithHeaders({ origin: "http://localhost:8080" }),
        ["http://localhost:8080"],
      ),
    ).toBe("http://localhost:8080");
  });
});
