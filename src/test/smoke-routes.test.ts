import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Phase 9A — Route inventory smoke test.
 *
 * Asserts that every route documented in `docs/smoke-tests.md` is wired up
 * in `src/App.tsx`. This catches accidental deletions of public, merchant,
 * or admin entry points before they ship.
 *
 * Behavioural / RLS coverage is documented in:
 *   - docs/smoke-tests.md
 *   - docs/sponsored-rls-regression.md
 */

const APP_TSX = readFileSync(
  resolve(__dirname, "..", "App.tsx"),
  "utf8",
);

/** Routes that must always exist. Mirror with docs/smoke-tests.md. */
const SMOKE_ROUTES = [
  // Public — discovery & SEO
  "/",
  "/auth",
  "/reset-password",
  "/search",
  "/business/:id",
  "/c/:categorySlug",
  "/city/:citySlug",
  "/city/:citySlug/:categorySlug",
  "/sitemap.xml",
  "/privacy",
  "/terms",
  "/account-deletion-policy",
  "/support-policy",
  "/cookies",
  "/release-notes",

  // Authenticated user
  "/profile",
  "/collections",
  "/projects",
  "/projects/:id",
  "/notifications",
  "/messages",
  "/messages/new",
  "/messages/:id",
  "/my-reviews",
  "/my-activity",
  "/edit-profile",
  "/settings",
  "/add-business",
  "/add-review",
  "/add-photo",

  // Merchant auth + dashboards
  "/merchant/login",
  "/merchant/register",
  "/merchant/onboarding",
  "/merchant",
  "/merchant/home",
  "/merchant/optimization",
  "/merchant/marketplace",
  "/merchant/messages",
  "/merchant/menu",
  "/merchant/business-info",
  "/merchant/services",
  "/merchant/leads",
  "/merchant/analytics",
  "/merchant/billing",
  "/merchant/billing/plans",
  "/merchant/sponsored",
  "/merchant/photos",
  "/merchant/inbox",
  "/merchant/notifications",
  "/merchant/more",

  // Admin
  "/admin",
  "/admin/reports",
  "/admin/businesses",
  "/admin/reviews",
  "/admin/photos",
  "/admin/projects",
  "/admin/sponsored",
  "/admin/users",
  "/admin/review-moderation",
  "/admin/account-deletions",
  "/admin/launch-status",
  "/settings/delete-account",
];

describe("smoke: route inventory (App.tsx)", () => {
  for (const path of SMOKE_ROUTES) {
    it(`wires route ${path}`, () => {
      // Match `path="/foo"` exactly. Escape regex specials in the path.
      const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`path=["']${escaped}["']`);
      expect(
        re.test(APP_TSX),
        `Route "${path}" is documented in docs/smoke-tests.md but missing from src/App.tsx`,
      ).toBe(true);
    });
  }

  it("has a catch-all NotFound route", () => {
    expect(/path=["']\*["']/.test(APP_TSX)).toBe(true);
  });
});
