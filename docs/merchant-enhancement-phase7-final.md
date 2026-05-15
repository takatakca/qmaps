# Phase 7 — Final Verification Pass

Read-only stabilization phase. No code changes shipped — this is the
publish-readiness sign-off.

## Final test summary

```
bunx vitest run

 Test Files   3 failed | 34 passed (37)
      Tests   3 failed | 310 passed (313)
   Duration   ~14 s
```

The 3 failures are the same pre-existing, unrelated issues identified in
Phase 2 and isolated through every phase since:

| Failing test | Cause | Owner |
| --- | --- | --- |
| `src/test/seo-assets.test.ts > robots.txt > references the sitemap` | Regex expects relative `/sitemap.xml`; file ships absolute `https://qmaps.lovable.app/sitemap.xml`. Test bug, asset is correct. | SEO follow-up |
| `src/test/release-status.test.ts` (×2 — 2 of 3 cases) | Calls `node release-status.js` from inside Vitest sandbox; script path is unreachable from worker CWD. Pre-existing infra issue. | Build tooling follow-up |

None of these touch merchant code, public routes, RLS, or the launch lock.

## Phase pass/fail matrix

| Verification | Source | Result |
| --- | --- | --- |
| Phase 2 — bottom-nav wiring, route separation | `merchantNav.test.ts` (9), `smoke-routes.test.ts` (63) | ✅ 72/72 |
| Phase 2 — `/merchant/more` ≠ `/merchant/menu` | `merchantNav.test.ts` + grep of `App.tsx`, `MerchantBottomNav.tsx`, `MerchantBusinessInfo.tsx` | ✅ both routes registered, distinct, only `/merchant/more` in bottom nav |
| Phase 6 — auth & dual-role | `merchantOnboarding.test.ts` (7) | ✅ 7/7 |
| Phase 6 — duplicate-business guard | `merchantOnboarding.test.ts` pre-mount + submit guards | ✅ pinned |
| Phase 3 — Marketplace categories save/reload | `merchantCategoryEditor.test.ts` (5) | ✅ 5/5 |
| Phase 3 — hours render real data | `MerchantMarketplace.tsx` reads `business.hours` (verified Phase 3) | ✅ |
| Phase 3 — public profile sync | `BusinessInfoTab` reads name / hours / description / categories / photos via existing RLS | ✅ |
| Phase 5 — status enum + labels | `businessStatus.test.ts` (8) | ✅ 8/8 |
| Phase 5 — public visibility behavior | `is_active` still gates RLS; status banner renders for non-`open` | ✅ |
| Phase 4 — structured attributes save/reload | `businessAttributes.test.ts` (16) | ✅ 16/16 |
| Phase 4 — legacy fallback | `parseAttributes` falls back to flat `amenities` when JSON empty (test) | ✅ |
| Phase 4 — public attribute display does not crash on empty input | `attributesToDisplayLabels({})` returns `[]` (test) | ✅ |
| Mobile layout integrity | Merchant pages already constrained `max-w-md/lg mx-auto`; no layout files changed in Phases 2–6 | ✅ no regression |
| No Yelp wording | `rg -n "yelp\|Yelp\|YELP" src/ public/ index.html` → 0 hits (excluding tests) | ✅ |
| Launch-lock preservation (Phase 16) | No public URL changed; RLS unchanged; legacy `amenities` array still mirrored | ✅ |

**Aggregate merchant-suite tally:** 108/108 across the 6 dedicated merchant
test files.

## Verified manual / code-level checks

- `App.tsx` registers both `/merchant/more` and `/merchant/menu` under
  `ProtectedMerchantRoute`.
- `MerchantBottomNav.tsx` exposes only `/merchant/more`; food menu editor
  is reachable only from `MerchantBusinessInfo` and `EditBasicInfoModal`,
  which is the documented intent.
- `EditAmenitiesModal` reads via `parseAttributes({ attributes, amenities })`
  and writes both columns on save → backward compatibility maintained.
- `BusinessInfoTab` prefers `attributesToDisplayLabels` and falls back to
  the legacy `amenities` array when the structured doc is empty.
- `BusinessVibeSection` still reads `business.amenities`; that array is
  always populated by Phase 4 saves, so vibe chips keep working.
- `businesses` RLS unchanged: public read still gated by
  `is_active = true`, owner read/update unchanged.

## Remaining known issues (non-blocking)

1. **`seo-assets` robots regex** — test expects relative sitemap path; file
   uses absolute URL. Cosmetic test bug, no production impact.
2. **`release-status` script tests** — sandbox-CWD issue when invoking the
   helper script from a worker. Build tooling follow-up.
3. **Notification / message badges** — placeholder counts, called out in
   Phase 1 diagnostic. Documented; intentionally not addressed in Phases
   2–7. Not a launch blocker; appears as zero badges, no broken links.
4. **Phase 4 lazy backfill** — businesses that never re-open the amenities
   editor keep `attributes = '{}'`; reads transparently fall back to legacy
   `amenities`. Public output is identical either way.

## Blockers

**None.** No regressions detected, no broken merchant flows, no public-page
crashes, no RLS escalations.

## Files changed in Phase 7

- `docs/merchant-enhancement-phase7-final.md` (this file)

No source files touched.

## Final recommendation

**Publish-ready** for the merchant enhancement track (Phases 2 → 6). The
launch lock is intact, all merchant tests are green, and the only failing
tests are clearly-scoped pre-existing issues unrelated to merchant work.

## Next manual steps (publish-ready path)

1. **Manual smoke pass on the live preview**, signed in as a merchant:
   - sign up a fresh merchant → confirm onboarding redirects to
     `/merchant` without leaving an empty business row;
   - log out / log back in → confirm session restores to merchant view;
   - from `/merchant`, open the bottom-nav "Menu" → lands on
     `/merchant/more`;
   - from `/merchant/business-info` open "Menu" row → lands on
     `/merchant/menu` (food menu editor);
   - open Marketplace → edit Categories → save → refresh → confirm persisted;
   - open Amenities & more → toggle a few Yes/No rows + a single-select +
     a multi-select → save → refresh → confirm persisted;
   - change Status to "Temporairement fermé" → load public
     `/business/:id` → confirm banner shows.
2. **Switch to client view** from `/merchant/more` → confirm consumer app
   loads, then "Passer en espace professionnel" from `/settings` to return.
3. **Publish** from the Lovable publish flow once the smoke pass is clean.
4. **Post-publish follow-ups (non-blocking):**
   - fix the `seo-assets` robots regex or update the asset to a relative
     URL;
   - fix the `release-status` script test invocation;
   - replace the notification/message badge placeholders with real counts
     when that work is scheduled.

<presentation-actions>
<presentation-open-publish>Publish your app</presentation-open-publish>
</presentation-actions>
