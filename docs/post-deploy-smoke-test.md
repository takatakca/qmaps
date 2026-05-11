# QMAPS — Post-Deploy Smoke Test (Phase 16)

Run **immediately after publish**. Mark each row PASS / FAIL /
NOT CHECKED. Any FAIL at severity critical or high triggers rollback
per `docs/deploy-checklist.md` §4.

Tester: ______________________   Date/time: ______________________
Build / version: ______________________

---

## Public routes

| # | Route | Expected | Result |
|---|-------|----------|--------|
| 1 | `/` | Home renders, no console errors | NOT CHECKED |
| 2 | `/search` | Search page renders, results load | NOT CHECKED |
| 3 | `/sitemap.xml` | Returns XML, no admin/merchant routes | NOT CHECKED |
| 4 | `/robots.txt` | Returns text, disallows private areas | NOT CHECKED |
| 5 | `/manifest.webmanifest` | Returns valid JSON manifest | NOT CHECKED |
| 6 | One known business detail page | Loads with name, photos, reviews | NOT CHECKED |
| 7 | 404 page (`/__does-not-exist__`) | French copy, links to `/`, `noindex` | NOT CHECKED |

## Auth

| # | Action | Expected | Result |
|---|--------|----------|--------|
| 8 | Login (test public user) | Lands on `/` authenticated | NOT CHECKED |
| 9 | Logout | Returns to public state | NOT CHECKED |

## Merchant

| # | Route | Expected | Result |
|---|-------|----------|--------|
| 10 | `/merchant` (dashboard) | Loads with KPIs, no errors | NOT CHECKED |
| 11 | `/merchant/photos` | Photo grid renders, upload control visible | NOT CHECKED |
| 12 | `/merchant/menu` | Menu items render, image upload control visible | NOT CHECKED |

## Admin

| # | Route | Expected | Result |
|---|-------|----------|--------|
| 13 | `/admin` (dashboard) | Stats render, no errors | NOT CHECKED |
| 14 | `/admin/claims` | Claim queue renders | NOT CHECKED |
| 15 | `/admin/reports` | Reports list renders | NOT CHECKED |
| 16 | `/admin/audit-logs` | Audit entries render | NOT CHECKED |

## Mobile viewport

| # | Check | Expected | Result |
|---|-------|----------|--------|
| 17 | Mobile (≤414px) home | Bottom nav fits, no horizontal scroll | NOT CHECKED |
| 18 | Mobile business detail | Photos, tap targets ≥ 44px | NOT CHECKED |
| 19 | Mobile auth flow | Inputs do not autozoom | NOT CHECKED |

---

## Summary

- Total checks: 19
- PASS: ___
- FAIL: ___
- NOT CHECKED: ___

If any FAIL: classify with `src/lib/launchMonitoring.ts` severity and
log via `docs/launch-issue-template.md`.
