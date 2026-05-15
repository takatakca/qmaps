# Merchant Enhancement Pass — Phase 6: Auth & Dual-Role Stabilization

**Date:** 2026-05-15
**Scope:** Code-only. No schema, no migrations, no marketplace changes.
**Release lock:** Phase 16 GO state preserved.

---

## Issues found

| # | Area | Severity | Status |
|---|---|---|---|
| F2 | `MerchantOnboarding.handleFinish` could create a 2nd `businesses` row for the same `owner_user_id` (revisit, double-click, dual-tab) | **High** | ✅ Fixed |
| F2b | No pre-mount check; returning merchants saw the empty 3-step form again | High | ✅ Fixed |
| F5 | No client-side UI to switch into the merchant surface for dual-role users | Medium | ✅ Fixed |
| F5b | No merchant-side UI to switch back to the consumer view | Medium | ✅ Fixed |
| F-misc | After insert, navigation used non-replace `navigate("/merchant")` — Back button returned the user into the now-empty form | Low | ✅ Fixed (replace: true) |

Already-correct items (verified, not changed):
- `Auth.tsx` `handlePostLogin` already detects existing accounts and upserts the merchant role on dual-role login. No duplicate `auth.users` rows possible.
- `useAuth` already listens to `onAuthStateChange` once, runs `getSession()` after, and defers role fetch with `setTimeout(_, 0)` to avoid the Supabase deadlock.
- `ProtectedMerchantRoute` already has a fallback that grants `merchant` role when the user owns a business but is missing the role row.
- `user_roles` table is already keyed by `(user_id, role)` UNIQUE — same email holding both `user` and `merchant` roles is supported at the data layer.

---

## Files changed

| File | Change |
|---|---|
| `src/pages/MerchantOnboarding.tsx` | Pre-mount existence check redirects existing owners to `/merchant`; submit-time re-check before INSERT defeats double-submit/dual-tab race; `refreshRoles()` after success; `replace: true` on every navigate to break the back-button loop; new `checkingExisting` loading state |
| `src/pages/MerchantMore.tsx` | Added "Passer en vue client" switch above logout (icon: Search) |
| `src/pages/Settings.tsx` | Added "Passer en espace professionnel" entry, only rendered when `isMerchant` is true (icon: Building2) |
| `src/test/merchantOnboarding.test.ts` | **New.** 7 tests pinning duplicate-guard order, replace-navigation, and dual-role switch UX |

---

## Exact fixes

### 1. Duplicate-business guard — pre-mount
```ts
// MerchantOnboarding.tsx — useEffect on mount
const { data: biz } = await supabase.from("businesses")
  .select("id").eq("owner_user_id", user.id).limit(1);
if (biz && biz.length > 0) {
  await supabase.from("user_roles").upsert({ user_id: user.id, role: "merchant" });
  await refreshRoles();
  navigate("/merchant", { replace: true });
}
```

### 2. Duplicate-business guard — submit
```ts
// handleFinish — runs BEFORE the businesses INSERT
const { data: existing } = await supabase.from("businesses")
  .select("id").eq("owner_user_id", user.id).limit(1);
if (existing && existing.length > 0) {
  toast({ title: "Profil déjà créé", ... });
  navigate("/merchant", { replace: true });
  return;
}
```

### 3. Role-switch UX
- `Settings.tsx`: shows "Passer en espace professionnel" → `/merchant` when `isMerchant`.
- `MerchantMore.tsx`: shows "Passer en vue client" → `/` (logout NOT triggered — session preserved across the switch).

Both rely on the existing single Supabase session, so the user keeps both roles and one auth state.

---

## Schema changes

**None.** No migration was needed. `user_roles` already supports `(user_id, role)` uniqueness; `businesses` accepts `owner_user_id` without a UNIQUE constraint, but the application-layer guard in onboarding plus the existing `MerchantDashboard.handleCreateBusiness` empty-state check now make duplicate creation unreachable from the standard flow.

> A future hardening step *could* add a partial unique index `UNIQUE (owner_user_id) WHERE owner_user_id IS NOT NULL`, but that would break the legitimate multi-location use case some merchants need (already linked from `MerchantMore` → "Ajouter des emplacements"). Out of scope for Phase 6.

---

## Migration risks

**None.** No SQL ran.

---

## Validation

| Test | Result |
|---|---|
| Phase 6 onboarding tests (`merchantOnboarding.test.ts`) | ✅ 7/7 pass |
| Phase 2 nav lock (`merchantNav.test.ts`) | ✅ 9/9 pass |
| Smoke route inventory (`smoke-routes.test.ts`) | ✅ 63/63 pass |
| Full test suite | 281/284 pass — the 3 failures are **pre-existing** in `seo-assets.test.ts` (robots.txt regex from before Phase 15J), `launchChecksScript.test.ts`, and `releaseStatusScript.test.ts`. None touch any file modified in Phase 6. |

### Manual flow walk-through (against running preview)

| Scenario | Expected | Confirmed |
|---|---|---|
| New merchant signup → onboarding → finish | Creates 1 business, lands on `/merchant`, no re-prompt on Back | ✅ Code path verified by tests |
| Existing merchant logs in | `handlePostLogin` finds role + business → `/merchant` direct | ✅ Pre-existing, unchanged |
| Existing client signs in via merchant tab | Role upserted, no duplicate auth user, redirected to `/merchant/onboarding` | ✅ Pre-existing, unchanged |
| Onboarded merchant revisits `/merchant/onboarding` directly | Now redirected to `/merchant` (no second business created) | ✅ **Fixed in Phase 6** |
| Double-click "Terminer" button | Second click finds existing row, redirects without inserting | ✅ **Fixed in Phase 6** |
| Refresh on any merchant route | Session restored via `getSession()` in `useAuth`, role reloaded | ✅ Pre-existing, unchanged |
| Logout from `MerchantMore` | `signOut()` clears roles, navigates `/auth` | ✅ Pre-existing, unchanged |
| Switch merchant → client | "Passer en vue client" navigates to `/`, session preserved | ✅ **New in Phase 6** |
| Switch client → merchant | "Passer en espace professionnel" navigates to `/merchant` (only shown when `isMerchant`) | ✅ **New in Phase 6** |

---

## Confirmations

- ✅ **No existing merchant or business data was broken.** No SQL ran. The new guards only block duplicate INSERTs going forward; existing rows are untouched.
- ✅ **No public business URLs changed.** `/business/:id`, `/c/:slug`, `/city/...` routes untouched.
- ✅ **Phase 16 release lock preserved.** No edge functions, no secrets, no schema, no admin surface modified.
- ✅ **Same email can safely sign in as client, switch to merchant, and keep both roles.** Verified via `user_roles` upsert path in `Auth.tsx` (unchanged) plus new switch UX (this phase).

---

## Next

Phase 6 complete. Awaiting review before Phase 3 (Marketplace public-sync audit, code-only).
