import { describe, it, expect } from "vitest";
import { offlineMessage, shouldShowOfflineBanner, isLikelyOffline } from "@/lib/network";

describe("network helpers (Phase 10A)", () => {
  it("offlineMessage differs by status", () => {
    expect(offlineMessage(true)).toMatch(/rétablie/i);
    expect(offlineMessage(false)).toMatch(/hors ligne/i);
  });

  it("shouldShowOfflineBanner only true when offline", () => {
    expect(shouldShowOfflineBanner(true)).toBe(false);
    expect(shouldShowOfflineBanner(false)).toBe(true);
  });

  it("isLikelyOffline returns boolean (jsdom navigator defaults to online)", () => {
    expect(typeof isLikelyOffline()).toBe("boolean");
  });
});
