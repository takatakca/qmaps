import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Phase 2 — Merchant navigation consistency lock.
 *
 * Pins the merchant bottom nav to its 6 intentional tabs and asserts the
 * deliberate split between:
 *   - /merchant/more  → hamburger "Menu" tab
 *   - /merchant/menu  → food menu editor (reached from Business Info)
 *
 * Renaming or merging either route would break MerchantBusinessInfo and
 * CompletenessCard. Do not "fix" this without a full Phase reopen.
 */
const NAV = readFileSync(
  resolve(__dirname, "..", "components", "MerchantBottomNav.tsx"),
  "utf8",
);
const APP = readFileSync(
  resolve(__dirname, "..", "App.tsx"),
  "utf8",
);

const REQUIRED_TABS = [
  "/merchant/home",
  "/merchant/optimization",
  "/merchant/marketplace",
  "/merchant/messages",
  "/merchant/notifications",
  "/merchant/more",
];

describe("Phase 2 — merchant navigation consistency", () => {
  for (const path of REQUIRED_TABS) {
    it(`bottom nav exposes ${path}`, () => {
      expect(NAV.includes(`"${path}"`)).toBe(true);
    });
  }

  it("/merchant/more and /merchant/menu are BOTH wired and distinct", () => {
    expect(/path=["']\/merchant\/more["']/.test(APP)).toBe(true);
    expect(/path=["']\/merchant\/menu["']/.test(APP)).toBe(true);
  });

  it("food menu editor (/merchant/menu) is NOT in the bottom nav", () => {
    // The bottom-nav "Menu" label refers to the hamburger (/merchant/more).
    // The food menu editor is reached from Business Info, never from the tab bar.
    expect(NAV.includes('"/merchant/menu"')).toBe(false);
  });

  it("bottom nav uses ProtectedMerchantRoute guard for every tab", () => {
    for (const path of REQUIRED_TABS) {
      const re = new RegExp(
        `path=["']${path}["'][^>]*element=\\{<ProtectedMerchantRoute>`,
      );
      expect(re.test(APP), `${path} must be guarded by ProtectedMerchantRoute`)
        .toBe(true);
    }
  });
});
