import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Phase 6 — Merchant onboarding & dual-role auth stability.
 *
 * Static-source guarantees that protect against regressions of:
 *   - Duplicate-business creation when a merchant revisits /merchant/onboarding
 *   - Missing role-switch UX between client and merchant surfaces
 *   - Onboarding race on double-submit / dual-tab
 */

const ONBOARDING = readFileSync(
  resolve(__dirname, "..", "pages", "MerchantOnboarding.tsx"),
  "utf8",
);
const SETTINGS = readFileSync(
  resolve(__dirname, "..", "pages", "Settings.tsx"),
  "utf8",
);
const MERCHANT_MORE = readFileSync(
  resolve(__dirname, "..", "pages", "MerchantMore.tsx"),
  "utf8",
);
const AUTH = readFileSync(
  resolve(__dirname, "..", "pages", "Auth.tsx"),
  "utf8",
);

describe("Phase 6 — merchant onboarding duplicate guard", () => {
  it("MerchantOnboarding redirects existing owners away from the form", () => {
    // Pre-mount existence check + early redirect to /merchant.
    expect(ONBOARDING.includes('.from("businesses")')).toBe(true);
    expect(ONBOARDING.includes('.eq("owner_user_id", user.id)')).toBe(true);
    expect(/navigate\(["']\/merchant["'],\s*\{\s*replace:\s*true/.test(ONBOARDING))
      .toBe(true);
  });

  it("handleFinish re-checks for an existing business before INSERT", () => {
    // The check must appear BEFORE the businesses insert in handleFinish.
    const insertIdx = ONBOARDING.indexOf('.from("businesses")\n      .insert');
    const recheckIdx = ONBOARDING.indexOf("Re-check at submit time");
    expect(recheckIdx).toBeGreaterThan(-1);
    expect(insertIdx).toBeGreaterThan(recheckIdx);
  });

  it("uses replace navigation after onboarding to avoid back-button loop", () => {
    const matches = ONBOARDING.match(/navigate\(["']\/merchant["'],\s*\{\s*replace:\s*true\s*\}\)/g);
    expect((matches?.length ?? 0) >= 2).toBe(true);
  });
});

describe("Phase 6 — dual-role switch UX", () => {
  it("client Settings exposes 'Passer en espace professionnel' for merchants", () => {
    expect(SETTINGS.includes("isMerchant")).toBe(true);
    expect(SETTINGS.includes("Passer en espace professionnel")).toBe(true);
    expect(SETTINGS.includes('navigate("/merchant")')).toBe(true);
  });

  it("MerchantMore exposes 'Passer en vue client' switch", () => {
    expect(MERCHANT_MORE.includes("Passer en vue client")).toBe(true);
    expect(MERCHANT_MORE.includes('navigate("/")')).toBe(true);
  });
});

describe("Phase 6 — auth dual-role flow preserved", () => {
  it("Auth.handlePostLogin grants merchant role to existing client accounts", () => {
    // Same email signs in as merchant → role is upserted, not duplicated.
    expect(AUTH.includes('upsert({ user_id: u.id, role: "merchant"')).toBe(true);
  });

  it("Auth signup catches 'already registered' and offers role upgrade", () => {
    expect(AUTH.includes("already registered")).toBe(true);
    expect(AUTH.includes("Compte existant détecté")).toBe(true);
  });
});
