import { describe, it, expect } from "vitest";
import {
  BUSINESS_STATUS_VALUES,
  STATUS_LABELS,
  deriveLegacyStatus,
  flagsForStatus,
  isBusinessStatus,
  isPubliclyVisibleStatus,
  readBusinessStatus,
} from "@/lib/businessStatus";

describe("businessStatus", () => {
  it("exposes the 5 supported values matching the DB CHECK constraint", () => {
    expect([...BUSINESS_STATUS_VALUES].sort()).toEqual(
      ["hidden", "open", "permanently_closed", "seasonal", "temporarily_closed"],
    );
  });

  it("derives legacy status from is_open / is_active booleans", () => {
    expect(deriveLegacyStatus({ is_active: true, is_open: true })).toBe("open");
    expect(deriveLegacyStatus({ is_active: true, is_open: false })).toBe("temporarily_closed");
    expect(deriveLegacyStatus({ is_active: false, is_open: true })).toBe("hidden");
    expect(deriveLegacyStatus({ is_active: false, is_open: false })).toBe("hidden");
  });

  it("prefers explicit status over legacy booleans", () => {
    expect(readBusinessStatus({ status: "seasonal", is_open: true, is_active: true })).toBe("seasonal");
    expect(readBusinessStatus({ status: "permanently_closed", is_open: true, is_active: true })).toBe("permanently_closed");
  });

  it("falls back to legacy derivation when status is null/invalid", () => {
    expect(readBusinessStatus({ status: null, is_open: true, is_active: true })).toBe("open");
    expect(readBusinessStatus({ status: "garbage", is_open: false, is_active: true })).toBe("temporarily_closed");
  });

  it("flagsForStatus keeps is_active true only for publicly visible statuses", () => {
    expect(flagsForStatus("open")).toEqual({ status: "open", is_open: true, is_active: true });
    expect(flagsForStatus("temporarily_closed")).toEqual({ status: "temporarily_closed", is_open: false, is_active: true });
    expect(flagsForStatus("seasonal")).toEqual({ status: "seasonal", is_open: false, is_active: true });
    expect(flagsForStatus("permanently_closed")).toEqual({ status: "permanently_closed", is_open: false, is_active: false });
    expect(flagsForStatus("hidden")).toEqual({ status: "hidden", is_open: false, is_active: false });
  });

  it("hidden businesses are NEVER publicly visible (RLS contract)", () => {
    expect(isPubliclyVisibleStatus("hidden")).toBe(false);
    expect(isPubliclyVisibleStatus("permanently_closed")).toBe(false);
    expect(isPubliclyVisibleStatus("open")).toBe(true);
    expect(isPubliclyVisibleStatus("temporarily_closed")).toBe(true);
    expect(isPubliclyVisibleStatus("seasonal")).toBe(true);
  });

  it("seasonal and temporarily_closed are not collapsed", () => {
    expect(STATUS_LABELS.seasonal.label).not.toBe(STATUS_LABELS.temporarily_closed.label);
    expect(STATUS_LABELS.seasonal.tone).not.toBe(STATUS_LABELS.temporarily_closed.tone);
  });

  it("isBusinessStatus narrows arbitrary input", () => {
    expect(isBusinessStatus("open")).toBe(true);
    expect(isBusinessStatus("nope")).toBe(false);
    expect(isBusinessStatus(null)).toBe(false);
    expect(isBusinessStatus(undefined)).toBe(false);
  });
});
