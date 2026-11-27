# QMAPS — Post-Deploy Smoke Test (Phase 16)

Run **immediately after publish**. Mark each row PASS / FAIL /
NOT CHECKED. Any FAIL at severity critical or high triggers rollback
per `docs/deploy-checklist.md` §4.

Tester: ______________________   Date/time: ______________________
Build / version: ______________________

---

## Public routes

Run `node scripts/verify-live-routing.mjs` from the repository. The command verifies the
JSON health, directory and anonymous account routes independently on `qmaps.ca`
and `www.qmaps.ca`. A redirect or a successful HTML fallback fails the check.

After deploying the paginated directory API, run
`node scripts/verify-live-routing.mjs --directory-pages`. This adds a read-only check of
two Montréal result pages on the three web domains and the direct API. It checks
both the browser route and the route used by Android and iOS. A legacy response,
an absent continuation, duplicate listings or a cursor that does not advance does
not prove the new API is ready. The default command still verifies the existing
public service without requiring pagination.

To prove the API image revision, run `node scripts/verify-live-routing.mjs --api-sha SHA`
with the full lowercase Git SHA selected for the API deployment. This compares
the direct API with the API reached through each public web domain. The static
`/qmaps-release.json` records the web revision only. Check it separately when web
and API deployments advance at different times.

### Sitemap de l’annuaire public

Le déploiement web copie `public/sitemap.xml` sans requête réseau pendant la construction. Pour actualiser les fiches après une publication ou un retrait, exécuter `npm run sitemap:generate -- --publish-static`, vérifier le diff du XML et le publier via le déploiement web normal. Sans `--publish-static`, la commande prépare seulement les fichiers dans `dist` pour inspection. Elle lit l’annuaire PostgreSQL anonyme déjà en ligne. Elle soumet les fiches publiques ON2GO et celles du lot municipal CC BY 4.0 avec une référence valable, en excluant les exemples et les sources non approuvées. Aucune donnée de la zone privée FLEXS, aucun contact et aucune date de modification supposée ne sont exportés. Une réponse ou un curseur invalide laisse le dernier sitemap intact.

Vérifier le HTTP 200 XML de `/sitemap.xml` et ouvrir une fiche publiée. Son lien canonique doit être sur `qmaps.ca` et conserver `?annuaire=qmaps`, sans repli vers le catalogue historique. Une fiche définitivement retirée répond 404 sur l’API QMAPS et la page de détail demande `noindex` jusqu’à son retrait du sitemap au prochain déploiement. Le fichier soumet des URL aux moteurs de recherche. Il ne prouve pas que ceux-ci les ont indexées.

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
