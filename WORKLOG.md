2026-11-27 | Codex | codex/qmaps-home-nearby-directory | Chromium et API validés sur base jetable | lire la proximité de l’accueil depuis PostgreSQL QMAPS | garder le brouillon jusqu’au HTTP 200 de la route Coolify

2026-11-27 | Codex | codex/qmaps-directory-nearby-api | route API vérifiée sur base jetable | fournir la proximité bornée depuis l’annuaire QMAPS | déployer l’API dans Coolify et contrôler la route avant la bascule web

2026-11-27 | Codex | codex/qmaps-owned-review-entry | parcours testé sur base jetable | raccorder la publication d’avis à l’annuaire QMAPS | valider la CI et les liens d’avis sur les domaines de production

2026-11-27 | Codex | codex/qmaps-owned-merchant-entry | parcours vérifié sur base jetable | ouvrir le formulaire marchand du PostgreSQL utilisé par la recherche | valider la CI et vérifier les boutons publiés sur les domaines QMAPS

2026-11-27 | Codex | codex/qmaps-public-detail-expired-session | correctif vérifié localement | maintenir la fiche publique, la galerie et les avis après expiration de session | valider la CI et le parcours sur les domaines de production

2026-11-27 | Codex | codex/qmaps-on2go-directory | correctif web et import testés sur base jetable | retirer Démo des trois titres d’exemple et préparer les 32 fiches ON2GO de Montréal | valider la CI et le site publié, puis appliquer l’import dans le PostgreSQL QMAPS autorisé

2026-11-26 | Codex | codex/qmaps-mailbox-receipt-guide | guide et grille concordants | préparer la preuve de réception sur les adresses publiées qmaps.ca | valider les boîtes et leur réception avec le responsable autorisé

2026-11-26 | Codex | codex/qmaps-directory-expired-session | validé avec une session révoquée sur base jetable | maintenir la consultation publique de l’annuaire après expiration de session | valider la CI puis vérifier les parcours publics sur les trois domaines

2026-11-26 | Codex | codex/qmaps-home-directory | divergence reproduite et correction testée | raccorder les rangées principales de l’accueil à l’annuaire QMAPS | valider la CI puis vérifier les rangées et la fiche en production

2026-11-26 | Codex | codex/qmaps-role-qa | modes ciblés vérifiés sur PostgreSQL jetable | vérifier commerçant et administrateur séparément sans rejouer le client | exécuter chaque mode lorsque son accès de recette est lié

2026-11-26 | Codex | codex/qmaps-stripe-atomic-receipts | concurrence et reprise vérifiées sur PostgreSQL jetable | rendre atomiques le reçu Stripe et la mise à jour d’abonnement | valider la CI et appliquer la migration uniquement à la préproduction autorisée

2026-11-26 | Codex | codex/qmaps-billing-canceled-display | interface testée | distinguer une annulation effective d’une période encore en cours | valider la CI et confirmer l’annulation dans la recette Stripe Sandbox

2026-11-26 | Codex | codex/qmaps-stripe-existing-subscription | régression et correctif vérifiés | éviter un nouveau Checkout pour un abonnement Stripe en cours | valider la CI puis tester le Checkout et le portail dans Stripe Sandbox

2026-11-26 | Codex | codex/qmaps-stripe-webhook-order | régression et correctif vérifiés | conserver l’état Stripe actuel lors des livraisons hors ordre | valider la CI puis déployer le webhook en préproduction Sandbox autorisée

2026-11-26 | Codex | codex/qmaps-authenticated-qa | procédure prête | documenter la recette Stripe Sandbox QMAPS | confirmer la préproduction et valider Checkout et webhook avec les accès de test

2026-11-26 | Codex | codex/qmaps-authenticated-qa | validé sur base jetable | préparer une recette authentifiée sur les trois domaines | tester sur PostgreSQL jetable puis utiliser les comptes de recette autorisés

2026-11-26 | Taktak | main · PR #39 · ticket 17 | Déployé et vérifié | Origine https://qmaps.takatak.ca autorisée pour les écritures du navigateur : PR #39 fusionnée (7b7dca344f51, CI 4/4 verte), API redéployée dans Coolify (gpzh7f08) ; déconnexion 204 avec la nouvelle origine (avant 403), 204 inchangés pour qmaps.ca/www, origine inconnue toujours 403, connexion refusée aux identifiants (401) et non à l’origine ; script de vérification porté à 12 contrôles, 12/12 OK en direct ; manifeste 7b7dca3 sur les trois domaines. Détail : ticket 17, commentaire 7208666137. | Recette authentifiée de production (comptes de test à créer) et Stripe Sandbox (503 provider_not_configured) inchangés.

2026-11-26 | Codex | taktak/qmaps-takatak-ca-origin → PR #39 | tests complétés | vérifier les trois domaines et la garde d’origine pour les écritures de session | confirmer la CI, le déploiement API et les réponses en production

2026-11-26 | Taktak | main · ticket 17 | Déployé et vérifié | Routage /api/v1/* rétabli sur qmaps.ca, www.qmaps.ca et qmaps.takatak.ca : règle Nginx de la recette (ticket 17, commentaire 7207490545) appliquée dans la configuration personnalisée Coolify de l’app web, redéploiement uq0ofzio8gvo22xjnaippk2z sur b618cde5 ; après l’auto-déploiement de la PR #38 (c757bce3), manifeste qmaps-release.json identique sur les trois domaines et routage revérifié (401 JSON sans session, recherche publique 200 JSON, 413 au-delà de 3 Mio) ; passerelle /qmaps-api inchangée. Détail et preuves : ticket 17, commentaire 7208016685. | Recette authentifiée de production (aucun compte de test documenté ; server/test/live.mjs exige une base locale jetable) et configuration Stripe Sandbox de l’environnement de facturation (fonctions toujours 503 provider_not_configured).

2026-11-26 | Codex | codex/qmaps-live-routing-check | contrôle testé | vérifier les réponses JSON en production sur les deux domaines | valider la CI puis lancer la recette après réparation du routage

2026-11-26 | Codex | codex/qmaps-stripe-receipts | correctif testé | réserver au serveur les reçus de paiement Stripe | valider la CI puis appliquer la migration à la préproduction de facturation

2026-11-26 | Codex | codex/qmaps-billing-retry | correctif testé | corriger l’authentification Checkout et les accusés de réception du webhook | valider la CI puis déployer les trois fonctions en préproduction Stripe Sandbox

2026-11-26 | Codex | codex/owned-recommendations | PR en validation | raccorder les recommandations au PostgreSQL QMAPS | CI PostgreSQL et publication API + frontend

2026-11-26 | Codex | codex/qmaps-directory-tracking | correctif testé localement | vérifier la bascule publique et corriger les événements envoyés à la mauvaise base | CI et vérification du manifeste en production

2026-11-25 | Codex — ChatGPT Work | codex/recherche-publique-postgresql → PR #32 | API déployée et vérifiée | Restauration isolée réussie (4 fiches actives, 1 compte, contrôle d’accès anonyme réussi). Coolify a déployé 35813d74. Montréal et Montreal renvoient les mêmes 3 fiches classées. Pagination de 2 puis 1 fiche, sans doublon. Google Play confirme la réception du bundle 3 dans le brouillon interne, sans testeurs. | Vérifier le déploiement du site après fusion et les parcours de recherche, ville, catégorie et fiche.

2026-11-22 | Codex — ChatGPT Work | codex/recherche-publique-postgresql → PR #32 | Bascule préparée, déploiement du backend Coolify requis | La recherche web, ses catégories et les pages de ville utilisent la lecture paginée PostgreSQL avec classements et annulation des requêtes obsolètes. | Effectuer la bascule après le retour de l’annuaire avec ses résultats de Montréal en production, puis parcourir les fiches avec deux navigateurs. Le site public sert la version vérifiée pendant cette transition.

2026-11-22 | Codex — ChatGPT Work | main · PR #30, #31 et #33 · ticket 17 | Fiche publique vérifiée en production, annuaire validé en CI | L’URL d’une fiche indépendante auparavant introuvable affiche son nom, son adresse, sa galerie, ses avis et un lien qui conserve la fiche à la connexion. Les lectures paginées, les filtres par ville et catégorie, le classement et le blocage d’un éditeur passent sur PostgreSQL. | Déployer le backend existant dans Coolify et vérifier /api/v1/browser/directory avant la bascule web #32. Preuves https://github.com/takatakca/qmaps/issues/17#issuecomment-7075575487

2026-11-22 | Codex — ChatGPT Work | main · PR #29 | Déployé et vérifié | Recherche par nom et ville dans /compte, Android et iOS. Quatre suites réussies, compilation 4 sur émulateur Android et simulateur iPhone. Chrome a vérifié la fiche du bistro et l’entrée commerçant, Firefox a ouvert Yelp for Business. | Captures et fichiers vérifiés https://github.com/takatakca/qmaps/releases/tag/mobile-1.0.0-rc.4 . Google Play et Amazon conservent leurs états distincts.

2026-11-21 | Codex — ChatGPT Work | main · PR #26 à #28 · ticket 17 | Livraison RC3 vérifiée | Onze pièces retéléchargées et contrôlées. Android signé, fermeture de compte et modération testées en production, deux cibles iOS compilées. Amazon examine la compilation 1 pour douze tablettes Fire. Google Play a enregistré le brouillon pour ca.qmaps.mobile. | Confirmer la réception de la compilation 3 dans Play, la signature Apple et la fin du déploiement Coolify de la PR #28. Preuves https://github.com/takatakca/qmaps/issues/17#issuecomment-7073586707

2026-11-21 | Codex — ChatGPT Work | codex/qmaps-migrations-deploiement → ticket 17 | En vérification | Application automatique des migrations sur le volume PostgreSQL existant avant le démarrage de la nouvelle API. | Vérifier la réexécution et le catalogue sur Coolify.

2026-11-21 | Codex — ChatGPT Work | codex/qmaps-moderation-mobile → ticket 17 | En vérification | Signalement et blocage des éditeurs de fiches dans les applications natives, accord sur les règles avant publication. | Tester les deux rôles et la modération sur le service QMAPS.

2026-11-21 | Codex — ChatGPT Work | codex/qmaps-parcours-publics → ticket 17 | En vérification | Suppression de compte depuis Android, iOS et le web, traitement par la console sur PostgreSQL et captures de trois parcours Android. Pages légales bilingues avec Pierre Lévesque, responsable désigné au ticket 17. Textes français et anglais dans le brouillon Amazon. | Exécuter les essais d’intégration et vérifier le déploiement ainsi que les reçus des boutiques.

2026-11-21 | Codex — ChatGPT Work | main · PR #25 · tickets 8 et 17 | Déployé et vérifié | Galerie indépendante, photos des visiteurs et du commerce, couverture et signalements. Les deux rôles ont été testés sur qmaps.ca. Une fiche et trois comptes de contrôle retirés. Restauration PostgreSQL après migration avec trois commerces actifs et zéro compte de test. Version applicative 5796bb4c, 486 tests web, trois suites GitHub vertes. | Version mobile candidate et sept fichiers retéléchargés et contrôlés : https://github.com/takatakca/qmaps/releases/tag/mobile-1.0.0-rc.1 . Amazon reste en brouillon. Les parcours classiques, les consentements du ticket 9 et les boutiques restent à vérifier avant tout retrait de la transition.

2026-11-21 | Codex — ChatGPT Work | codex/qmaps-web-independant → ticket nº 17 | En cours | L’API autonome répond en production sur /api/v1/health et retrouve les deux fiches de Montréal sur /api/v1/places. Raccordement du compte web, de la console propriétaire et des parcours QMAPS à cette même API que les clients mobiles | Tester les cookies, les rôles et la confidentialité en CI et dans Chrome.
2026-11-21 | Codex — ChatGPT Work | codex/qmaps-applications-natives → ticket nº 17 | En cours | Projets Android Kotlin et iOS Swift de QMAPS avec vues natives et API propriétaire sur /api/v1. Le site public et le backend de transition restent accessibles pendant cette livraison | Construire les fichiers installables et conserver les preuves avant soumission aux boutiques.

2026-11-21 | Codex — ChatGPT Work | codex/qmaps-coeur-postgresql → ticket nº 17 | En cours | Instruction TAKTAK du propriétaire vérifiée. La pile auto-hébergée en ligne est la transition. Construction du socle PostgreSQL/PostGIS et de l’API QMAPS indépendants, avec des contrats applicatifs testables. Le catalogue est fictif. | Vérifier le nouveau service isolé, ses comptes, ses permissions et ses médias avant toute substitution de production.

2026-11-21 | Codex — ChatGPT Work | codex/qmaps-api-premier-domaine → main | Vérifié | L’API Auth, le catalogue et les fonctions répondent sous https://qmaps.ca/qmaps-api. Console administrateur vérifiée dans Chrome avec un compte jetable supprimé. Demande de liste d’attente envoyée et annulée. Les premières sauvegardes quotidiennes PostgreSQL et médias ont réussi dans Coolify, rétention de sept par tâche | 486 tests locaux réussis. Une restauration isolée a retrouvé les trois fiches. Vérifier le manifeste après la bascule du client, puis terminer le SMTP et l’accès personnel avec le propriétaire du domaine.

2026-11-21 | Codex — ChatGPT Work | main et codex/qmaps-controles-exploitation | Déployé et vérifié | QMAPS.ca sert 5341b8d9 sur le nouveau Coolify. Chrome affiche les deux fiches de Montréal et protège /console. Trois comptes jetables ont réellement testé connexion, publication, liste d’attente, confidentialité des collections et photo sur ce serveur. Nettoyage des essais confirmé. La sauvegarde PostgreSQL locale est lisible. Signature requise pour toute prochaine intervention | Vérifier le circuit de courriel et le compte personnel du propriétaire. La suite ajoute au bistro ses réservations de démonstration et protège le chargement direct de la console. 484 tests locaux réussis.

2026-11-21 | Codex — ChatGPT Work | main · lancement autonome | en cours | Décision de Matthieu : QMAPS démarre sur une base neuve de démonstration dans Coolify. L’ancienne base Lovable n’est plus un prérequis. Les livraisons #12, #14, #15 et #16 sont fusionnées. Chaque intervenant signe ici ses modifications avec sa branche, ses vérifications et la prochaine étape | Installer le schéma et la console, vérifier les parcours avec des identités de test, puis basculer le site. Conserver le déploiement précédent pour un retour arrière

2026-11-21 | Codex — ChatGPT Work | codex/qmaps-portability-and-parity → PR #13 | active | Mandat du propriétaire : démarrer QMAPS sur une base de test neuve sous Coolify. Console, données de démonstration et migrations versionnées par QMAPS. Services Auth, Storage et API validés sur une pile reconstruite | Déployer et vérifier le nouveau service avant de basculer le client. Conserver les autres projets et leur facturation

2026-11-21 | Codex | codex/collections-galerie → PR #16 | En revue | Collections personnelles et publiques, favoris et galerie de visiteurs sur le schéma existant | CI puis lecture en production. Les API publiques des collections et des photos répondent sur le schéma actuel

2026-11-21 | Codex | codex/liens-commercants → PR #15 | Déployé | Validation des liens web sur les fiches et dans les formulaires commerçants. Livraisons #12 et #14 vérifiées en production | 474 tests réussis, CI verte. Manifeste public 0913ac9 confirmé

2026-11-21 | Codex | codex/recherche-horaires-quebec | en revue | Recherche par services et horaires après minuit. La page Montréal de la PR #12 sert la version 11fd328 vérifiée en production avec Chez Schwartz et La Banquise | Vérifier la CI, le manifeste public et les filtres après déploiement

2026-11-21 | Codex | codex/local-discovery-20261121 → PR #12 | done in source | Fixed Montréal/Montreal discovery, city + category search, distance, favorites, reviews, photos and project entry points after live comparison with Yelp Montréal | Check GitHub CI, production release SHA and Opera after reconnection

2026-11-07 | Codex — ChatGPT Work | codex/sequential-release-20261107 | code terminé, CI finale attendue | KLEAN/REVEW/SEO intégrés successivement; protections Stripe conservées, manifeste ajouté; 451 tests préliminaires passent | confirmer tests du manifeste et CI, publier cible existante seulement après sauvegarde et preuve SHA; Supabase reste séparé

2026-11-01 | REVEW | revew/review-api-handoff | DONE / source CI green / not deployed | Add explicit tenant-bound visibility checks for tracked review IDs; no QMAPS outbound review event producer found, so no automatic deletion-sync assumption. | Exact source 9a74033 passed https://github.com/takatakca/qmaps/actions/runs/41299114132 in51s: 442tests, typecheck, lint and productionbuild. Next: authorized Edge Function deployment and V1 exact-ID confirmation acceptance; no production changes — REVEW

2026-11-01 | REVEW | revew/review-api-handoff | DONE / source CI green / not deployed | Implement scoped review pagination and tenant-bound owner reply API for native V1 consumer; no migration/deployment. | 435 tests, full app typecheck, boundary lint and Vite build passed; new read/v2 reply functions and focused CI ready, no production changes. Exact source 6cc23f2 passed https://github.com/takatakca/qmaps/actions/runs/41298309788 in 1m04s; parent reviewed. Next: coordinator review/merge; owner deploys required Edge Functions and validates authorized source round-trip. — REVEW

2026-10-31 | REVEW | revew/review-api-handoff → PR pending | done: documentation handoff; API implementation requested | Owner requested dedicated review/business APIs for the V1 review cockpit; reviewed existing code, recorded missing capabilities, tenant boundaries and acceptance tests in docs/TAKATAK_REVIEW_API_HANDOFF.md; no source/runtime changes | Next: counterpart agent accepts the contract and implements/tests its own APIs; Drive upload blocked by unavailable connector. — REVEW

# Work log

Newest first, one line per piece of work. Rule: `AGENTS.md` › Work log rule.
Format: `YYYY-MM-DD | agent | branch → PR | status | what | next step`

2026-10-16 | ChatGPT | main | done, CI successful, production blocked | Last code SHA 731ba7a9 CI 38943539936 green; draft edits, category consistency, listing search reliability and private draft category RLS migration; issue #6 updated | Next session verify main, connect authorized QMAPS project and web host before production deployment

2026-10-16 | ChatGPT | main | code delivered, DB migration pending | Restrict read of categories attached to inactive business drafts to owner/admin while retaining active-business public search | CI then test anon/owner/admin RLS on authorized QMAPS project, apply only after backup

2026-10-16 | ChatGPT | main | done in code, CI pending | Reject out-of-order search results and expose real errors/loading in AddBusiness; block rapid double inserts and handle unexpected write failures | Confirm CI, verify live directory search and claim flow with real users

2026-10-16 | ChatGPT | main | done in code, CI pending | Persist edited recovered merchant drafts to owned inactive business; reconcile added/removed category links and verify exact persisted selection | Confirm GitHub CI and test against correct QMAPS Supabase project when access available

2026-10-15 | ChatGPT | main | done in code; latest CI pending | Isolated auth roles on account changes, repaired workflow YAML and validated it in CI, gated manual SSH deploy and removed fake Montréal/photo defaults; updated canonical handoff | Verify latest GitHub CI; production blocked by QMAPS Supabase and verified host

2026-10-15 | ChatGPT | main | code ready, CI pending | Replaced unsaved CTA promotion editor with honest prelaunch notice, removed imaginary pricing and coupons; linked available business contact and sponsored campaigns | Validate CI, leave actual CTA publishing backend on task queue

2026-10-15 | ChatGPT | main | code ready, CI pending | Removed fake Guest Manager lead-success toast, ungrounded network volume, plans and fabricated testimonial; replaced with explicit unlaunched-service state and real support contact route | Verify CI, implement booking backend only after authorized product/spec/access

2026-10-15 | ChatGPT | main | code ready, CI pending | Replaced inert support search and FAQ buttons with accent-insensitive filtering, accessible answers and real help links; contact route clarifies email draft is not automatic delivery | Verify CI and production links

2026-10-15 | ChatGPT | main | code ready, CI pending | Enforced successful GitHub push CI on manual QMAPS SSH deployment, restricted remote web root, and added workflow contract checks | Verify CI and remain opted out until real QMAPS host access

2026-10-15 | ChatGPT | main | code complete, CI pending | Corrected nonexistent merchant review link, redirected account/legal/support to existing routes, enabled dashboard deep link, removed fake planning shortcut | Validate CI and production navigation

2026-10-15 | ChatGPT | main | repair, CI pending | Replaced incompatible React Testing Library tests with Vitest contract assertions; missing @testing-library/dom peer in frozen Bun lock blocked typecheck, preserved concurrent role-auth fixes | Verify CI and run actual browser/E2E tests when environment/dependencies are available

2026-10-15 | ChatGPT | main | code ready, CI pending | Scoped auth roles to current session, dropped delayed permissions on account switches, blocked role-sync failure in merchant routes/onboarding with retry | Validate new CI and QMAPS production authorization

2026-10-15 | ChatGPT | main | code ready, CI pending | Hardened cross-business Stripe subscription fetch race and failure state, removed false $0 balance and fabricated due date, blocked checkout during errors | Run CI, test real Stripe and subscriptions when QMAPS backend accessible

2026-10-15 | ChatGPT | main | implemented, CI pending | Removed invented merchant review recommendation claims and dead buttons; real empty state links to business editor; tested reply action in React | Verify CI, continue identity-safe billing

2026-10-14 | ChatGPT | main | handoff snapshot, current CI pending | Updated canonical 5 status/handoff files with last code SHA, green CI evidence, exact Supabase/hosting blockers and next actionable steps | Check latest CI on main, resume issue #6 after authorized QMAPS project and host access

2026-10-14 | ChatGPT | main | code ready, CI pending | Ensured resumed merchant draft entitlement is verified before setting is_active true, preventing user role failures from appearing as successful publication | Run CI, test real entitlement policy

2026-10-14 | ChatGPT | main | code ready, CI pending | Made merchant onboarding resumable after interrupted draft and checked category writes/RLS before publication | Validate CI, verify resume and category failure scenarios against real QMAPS DB

2026-10-14 | ChatGPT | main | code ready, CI pending | Fixed merchant review fetch silent failures/infinite loading, added retry and barred previous business reviews from overview | Validate CI and two-business review loading

2026-10-14 | ChatGPT | main | code ready, CI pending | Prevented stale sponsored-campaign results from crossing merchant selection; added explicit Supabase read errors and retry to optimization page | Validate CI and test live campaigns switching

2026-10-14 | ChatGPT | main | code ready, CI pending | Replaced simulated merchant ad optimization with real owned-business sponsored campaign counts/statuses and links to live workflows | Validate CI and review campaign data access in QMAPS production

2026-10-14 | ChatGPT | main | code ready, CI pending | Propagated owner-validated selected business to merchant inbox/messages, menu, optimization, services and sponsored campaign pages | Verify CI and multi-merchant production QA

2026-10-14 | ChatGPT | main | code ready, CI pending | Extended user-scoped selected business across merchant photos, company info, menu, ads, billing/checkout, home, marketplace and analytics, verified against owned rows | Validate CI and end-to-end switching across two businesses

2026-10-14 | ChatGPT | main | code ready, Supabase deployment blocked | Added INSERT+UPDATE guards for hidden-review moderation fields, spoofed reaction counters, and review author/business reassignment | Validate CI, then apply SQL only in QMAPS and exercise live RLS negative tests

2026-10-14 | ChatGPT | main | code ready, QMAPS DB access blocked | Added admin/service-only INSERT+UPDATE guards against forged verified-owner flags and rating aggregates; regression coverage | Verify CI then apply SQL on QMAPS project only

2026-10-14 | ChatGPT | main | documentation updated | Latest code SHA 23aa06e4 CI green including typecheck; recorded P0 external deployment issue #6 and updated 5 standard handoff files | Continue from exact GitHub main SHA; unblock real Supabase QMAPS and host/DNS evidence

2026-10-14 | ChatGPT | main | code ready, typecheck CI pending | Added explicit tsc noEmit typecheck to GitHub CI and package scripts | Resolve any TypeScript errors found by latest CI

2026-10-14 | ChatGPT | main | code ready, CI pending | Made real business city mandatory in AddBusiness to prevent erroneous Montreal fallback; clarified owner choice | Review CI and production mapping

2026-10-14 | ChatGPT | main | done in code, CI pending | Added working review rating filter, text expansion and photo navigation; removed false author counts and inactive check-in control | Review CI and mobile UX, continue production tasks

2026-10-14 | ChatGPT | main | done in code, verification pending | Kept merchant onboarding drafts inactive until explicit successful owner-scoped publish; added tests | Check CI and real Supabase RLS before launch

2026-10-14 | ChatGPT | main | code ready, DB migration pending | Fixed merchant onboarding is_claimed mismatch with RLS, prepared nullable coordinates/removed fake Montreal defaults, typed nullable fields | CI then deploy SQL only to the confirmed QMAPS Supabase project

2026-10-14 | ChatGPT | main | code ready, verification pending | Removed fake merchant business auto-insert, wired new listings to real AddBusiness form and merchant return route | Validate CI, continue production integration

2026-10-14 | ChatGPT | main | done in code, CI pending | Removed fake merchant hours/discounts/badges and inactive buttons, used actual hours and phone/photo actions | Validate CI and mobile UI; continue production readiness

2026-10-14 | ChatGPT | main | code ready, deploy opt-in remains off | Added exact SHA publishing verification and stale-CI deployment rejection with contract tests | Check CI, activate only after confirmed hosting/DNS/SSH secrets

2026-10-14 | ChatGPT | main | code ready, migration pending | Prevent review/TAKATAK spoofing on INSERT and foreign owner assignment; hide stale tenant reviews before next render | Validate CI, apply new SQL only on correct QMAPS Supabase project

2026-10-14 | ChatGPT | main | done in code, verification pending | Added multi-business merchant selection, stale review protection, unit tests, five canonical status/handoff docs | Validate CI on latest SHA and continue with Supabase and hosting readiness

2026-10-14 | ChatGPT | main | done | Extended TAKATAK CI to run Deno TypeScript check of verified merchant reply Edge Function | Confirm checks pass before a live Supabase Edge deployment

2026-10-14 | ChatGPT | main | done | Fixed reply text normalization and merchant dashboard branding from FLEXS to QMAPS | Verify GitHub CI and production Edge deployment prerequisites

2026-10-14 | ChatGPT | main | code ready, deployment pending | Added verified JWT merchant-review reply endpoint and reply UI; SQL guards prevent authors faking replies and merchants hijacking TAKATAK workspaces | Run database migration in QMAPS environment then deploy merchant-reply-review and manually verify customer isolation

2026-10-14 | ChatGPT | main | done | Locked QMAPS SSH deploy to enabled opt-in + main/CI success + qmaps.ca HTTPS and hardened trailing-dot origin validation | Verify CI and deploy only after host and secrets are confirmed

2026-10-14 | ChatGPT | main | done | Hardened Stripe Checkout and Billing Portal redirect origins using a server-controlled HTTPS allowlist plus unit tests | Add verified legacy/staging domains in Edge Function secrets only if needed, confirm payments in a real environment

2026-10-14 | ChatGPT | main | done (code only) | Updated qmaps.ca SEO/sitemap, repository README and GitHub-to-SSH deployment workflow with opt-in gate | Verify real hosting, supply secrets, activate deployment, check production end-to-end

2026-10-14 | ChatGPT | main (merge PR #2) | done | Added HMAC-authenticated TAKATAK candidate lookup; fails closed when query bounds are reached; addressed Deno BufferSource type error | Configure server-only secrets, deploy function, and verify signed requests before declaring production-ready

2026-10-14 | ChatGPT | main (merge PR #4 + #3) | done | Integrated green-CI typing fixes, TAKATAK workspace link, and merchant review replies while retaining PR #5 security cleanup | Database migration and integration secrets remain deployment prerequisites
2026-10-11 | cursor | cursor/qmaps-takatak-bridge → PR #4 | done (merged into main) | TAKATAK workspace association and owner reply API with reviewed changes | Apply database migration separately after deployment readiness
2026-10-11 | cursor | cursor/qmaps-lint-explicit-any → PR #3 | done (included via PR #4) | Replace explicit anys, fix lint and go/no-go script | Watch GitHub CI on main
2026-10-14 | ChatGPT | chore/continuation-security-handoff → PR #5 | done (merged into main) | Added `.agent/CONTINUATION.md` handoff and removed committed `.env` without reading it | Codex runs full checks, reviews secret rotation, then merge if safe
2026-10-09 | Lovable | managed workspace → no PR | done | Added 6 more visual option boards (search+map, onboarding, city page, mobile screens, notifications, about page), boards 16-21 in Files; no code changes | Owner picks favorites; no publishing
2026-10-09 | Lovable | managed workspace → no PR | done | Added 6 more visual option boards (dark mode, editorial categories, dark business page, profile, winter hero, light merchant portal), boards 10-15 in Files; no code changes | Owner picks favorites; no publishing
2026-10-09 | Lovable | managed workspace → no PR | done | Delivered 12 QMaps visual concepts across 3 image boards; no application code changes | Owner can select visual directions; no publishing
- 2026-10-08 | claude (owner setup) | default branch | done | Added the work log rule, this log and the stop reminder | every agent follows AGENTS.md › Work log rule

2026-11-21 | Codex — ChatGPT Work | ticket 17 · avis et réponses | Comptes, console, favoris et publications de l’API indépendante vérifiés en production. Ajout des avis et réponses des propriétaires au nouvel espace, avec test de la séparation des identités, des modifications et du retrait. La modération et les boutiques restent suivies dans le ticket de lancement.
