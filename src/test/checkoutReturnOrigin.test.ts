import { describe, expect, it } from "vitest";
import {
  QMAPS_RETURN_ORIGIN,
  normalizedHttpsOrigin,
  resolveCheckoutReturnOrigin,
} from "../../supabase/functions/_shared/checkout-return-origin";

describe("Stripe checkout / portal return-origin boundaries", () => {
  it("defaults to qmaps.ca rather than trusting the Referer header", () => {
    expect(resolveCheckoutReturnOrigin(null, null)).toBe(QMAPS_RETURN_ORIGIN);
    expect(resolveCheckoutReturnOrigin("null", null)).toBe(QMAPS_RETURN_ORIGIN);
    expect(resolveCheckoutReturnOrigin("https://attacker.example", null)).toBe(QMAPS_RETURN_ORIGIN);
  });

  it("permits the production domain and explicitly allowed HTTPS preview domains", () => {
    expect(resolveCheckoutReturnOrigin("https://www.qmaps.ca", null)).toBe("https://www.qmaps.ca");
    expect(resolveCheckoutReturnOrigin("https://qmaps.ca", null)).toBe("https://qmaps.ca");
    expect(
      resolveCheckoutReturnOrigin("https://staging.qmaps.ca", "https://staging.qmaps.ca, https://qmaps.app"),
    ).toBe("https://staging.qmaps.ca");
    expect(resolveCheckoutReturnOrigin("https://qmaps.app", "https://qmaps.app")).toBe("https://qmaps.app");
  });

  it("rejects lookalike origins, non-HTTPS and credentials", () => {
    for (const value of [
      "http://qmaps.ca",
      "https://qmaps.ca@evil.example",
      "https://qmaps.ca/path",
      "https://qmaps.ca?next=evil",
      "https://qmaps.ca#evil",
      "https://qmaps.ca.",
      "javascript:alert(1)",
      "",
    ]) {
      expect(normalizedHttpsOrigin(value)).toBeNull();
      expect(resolveCheckoutReturnOrigin(value, null)).toBe(QMAPS_RETURN_ORIGIN);
    }
    // A lookalike is syntactically a valid HTTPS origin, but is NOT
    // authorized by QMAPS's allowlist unless an operator explicitly adds it.
    expect(resolveCheckoutReturnOrigin("https://qmaps.ca.evil.example", null))
      .toBe(QMAPS_RETURN_ORIGIN);
  });

  it("ignores invalid extra origins rather than letting request headers widen the allowlist", () => {
    expect(
      resolveCheckoutReturnOrigin("https://attacker.example", "https://qmaps.ca@attacker.example,http://attacker.example"),
    ).toBe(QMAPS_RETURN_ORIGIN);
  });
});
