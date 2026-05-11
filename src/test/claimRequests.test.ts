import { describe, expect, it } from "vitest";
import {
  canSubmitClaimRequest,
  isValidEmail,
  isValidOptionalUrl,
  normalizeClaimRequestInput,
} from "@/lib/claimRequests";

describe("claimRequests helpers", () => {
  it("isValidEmail validates well-formed addresses", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail(" a@b.co ")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail(null)).toBe(false);
  });

  it("isValidOptionalUrl accepts empty and http(s)", () => {
    expect(isValidOptionalUrl(undefined)).toBe(true);
    expect(isValidOptionalUrl("")).toBe(true);
    expect(isValidOptionalUrl("https://x.com")).toBe(true);
    expect(isValidOptionalUrl("ftp://x.com")).toBe(false);
    expect(isValidOptionalUrl("not a url")).toBe(false);
  });

  it("normalizeClaimRequestInput trims and nulls empties", () => {
    const r = normalizeClaimRequestInput({
      contact_name: "  Jane  ",
      business_email: " a@b.co ",
      business_phone: "  ",
      message: "",
      evidence_url: "https://x/y ",
    });
    expect(r.contact_name).toBe("Jane");
    expect(r.business_email).toBe("a@b.co");
    expect(r.business_phone).toBeNull();
    expect(r.message).toBeNull();
    expect(r.evidence_url).toBe("https://x/y");
  });

  it("canSubmitClaimRequest rejects missing required fields", () => {
    expect(canSubmitClaimRequest({ contact_name: "", business_email: "a@b.co" })).toEqual({
      ok: false,
      error: "missing_contact_name",
    });
    expect(canSubmitClaimRequest({ contact_name: "Jane", business_email: "" })).toEqual({
      ok: false,
      error: "missing_email",
    });
    expect(canSubmitClaimRequest({ contact_name: "Jane", business_email: "bad" })).toEqual({
      ok: false,
      error: "invalid_email",
    });
    expect(
      canSubmitClaimRequest({ contact_name: "Jane", business_email: "a@b.co", evidence_url: "ftp://x" }),
    ).toEqual({ ok: false, error: "invalid_evidence_url" });
  });

  it("canSubmitClaimRequest returns normalized data when valid", () => {
    const r = canSubmitClaimRequest({ contact_name: "Jane", business_email: "a@b.co" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.business_email).toBe("a@b.co");
  });
});
