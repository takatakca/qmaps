# Merchant Enhancement Pass — Phase 2: Routing & Navigation Consistency

**Date:** 2026-05-15
**Scope:** Code-only stabilization. No schema, no features, no renames.
**Release lock:** Phase 16 GO state preserved.

---

## Audit results

| Check | Result |
|---|---|
| 1. `/merchant/more` is hamburger Menu tab | ✅ Confirmed (`MerchantBottomNav.tsx` line 14, `App.tsx` line 192) |
| 2. `/merchant/menu` is food menu editor | ✅ Confirmed (`App.tsx` line 202 → `MerchantMenu`, linked from `MerchantBusinessInfo` only) |
| 3. Merchant bottom nav links audited | ✅ All 6 tabs (`/home`, `/optimization`, `/marketplace`, `/messages`, `/notifications`, `/more`) wired and route-matched |
| 4. Active tab states correct | ✅ `isActive` uses exact match OR `startsWith(path + "/")` — no false positives between `/merchant`, `/merchant/home`, `/merchant/messages`, `/merchant/menu` |
| 5. Route guards consistent | ✅ Every non-auth merchant route (29 routes) wrapped in `ProtectedMerchantRoute` (verified by new test) |
| 6. Client users blocked from merchant pages | ✅ `ProtectedMerchantRoute` redirects to `/auth?role=merchant` when role missing AND no owned business |
| 7. Merchant session persistence across routes | ✅ `useAuth` listens to `onAuthStateChange` once at app root; protected route only re-runs role check when `user` / `authLoading` / `isMerchant` change |
| 8. No marketplace / business-info / food-menu route breakage | ✅ All three routes asserted by smoke + nav tests |
| 9. Schema untouched | ✅ No migrations |
| 10. No new features introduced | ✅ Only test files added |

---

## Files changed

| File | Change |
|---|---|
| `src/test/smoke-routes.test.ts` | Added 5 missing merchant routes to the inventory lock: `/merchant/register`, `/merchant/optimization`, `/merchant/marketplace`, `/merchant/messages`, `/merchant/menu` |
| `src/test/merchantNav.test.ts` | **New.** Pins the 6 bottom-nav tabs, asserts `/merchant/more` ≠ `/merchant/menu` are both wired and distinct, asserts food-menu editor is intentionally NOT in the tab bar, asserts every tab is guarded by `ProtectedMerchantRoute` |
| `docs/merchant-enhancement-phase2-routing.md` | This report |

No production source files were modified.

---

## Exact issues fixed

1. **Coverage gap:** 5 merchant routes (including the `/merchant/menu` food editor and `/merchant/marketplace` Vitrine) had no smoke-test guard. A future refactor could have silently deleted them. Now locked.
2. **No regression test for the intentional `/more` vs `/menu` split.** A reasonable-looking "cleanup" PR could have collapsed them and broken `MerchantBusinessInfo`. Now locked by `merchantNav.test.ts`.
3. **No assertion that bottom-nav tabs use `ProtectedMerchantRoute`.** Now locked.

No behavioural code changed — these were latent risks, not active bugs.

---

## Tests run

```
bunx vitest run src/test/merchantNav.test.ts src/test/smoke-routes.test.ts
→ Test Files  2 passed (2)
→ Tests       72 passed (72)
```

(Smoke route count went from 58 → 63 with the 5 new merchant routes.)

---

## Confirmations

- ✅ **No route regression.** Every previously wired route still resolves; 5 additional routes now have guard tests.
- ✅ **`/merchant/more` and `/merchant/menu` remain intentionally separate.** Now machine-asserted in `merchantNav.test.ts` so this cannot be accidentally undone.
- ✅ **Phase 16 release lock preserved.** No source code, no schema, no edge functions, no secrets touched.

---

## Next

Phase 2 complete. Awaiting review before Phase 6 (dual-role auth UX).
