# QMAPS — Agent handoff

## Guest Manager — intégrité commerciale, 15 octobre 2026
- **Dernière tâche livrée en code :** suppression du formulaire qui annonçait « Demande envoyée! » sans réseau, des prix et témoignages non vérifiés et des statistiques inventées sur Guest Manager. L'écran indique que le produit n'est pas activé et propose le contact existant `/support-policy`.
- **Fichiers :** `src/pages/MerchantGuestManager.tsx`, `src/test/guestManagerIntegrity.test.ts`, `WORKLOG.md`, `docs/AGENT_HANDOFF.md`, `docs/TASK_QUEUE.md`, `docs/PROJECT_STATUS.md`, `docs/DECISIONS.md`.
- **Reste fonctionnel :** intégration d'un véritable moteur de réservations, tables, disponibilités, permissions, notification et facturation — **pas construit ni déployé**, à prévoir seulement avec exigences approuvées et accès autorisés.
- **Vérification :** test de contrat + CI GitHub sur le nouveau commit à consulter. Dernier SHA en tête de `main` (ne peut être inscrit dans le même commit).
- **Déploiement :** workflow SSH QMAPS non activé ; aucun site réel ni base QMAPS confirmés accessibles. Ne pas annoncer Guest Manager opérationnel.
- **Prochaine action :** valider GitHub CI, puis poursuivre les tâches indépendantes et les prérequis issue #6.



## Centre d'aide fonctionnel — 15 octobre 2026
- **Dernière tâche codée :** `src/pages/Support.tsx` propose désormais recherche réactive, questions/réponses accessibles et liens vers les vraies pages de facturation, avis, fiche, connexion et suppression du compte ; `/support-policy` offre le canal de contact existant, avec précision que le courriel doit être envoyé manuellement.
- **Fichiers :** `src/pages/Support.tsx`, `src/lib/supportFaq.ts`, `src/test/supportFaq.test.ts`, `WORKLOG.md`, `docs/AGENT_HANDOFF.md`, `docs/TASK_QUEUE.md`.
- **Parent et version :** ce patch part de `7126d0dfc73ad63fc8ae6276ffbd3aef09be14e4`. Lire HEAD sur GitHub pour le SHA réel du dernier commit, qui ne peut être inclus dans son propre contenu.
- **Tests :** recherches avec/sans accents et contrôles des routes. CI sur le nouveau commit à vérifier.
- **Déploiement :** GitHub SSH toujours ignoré, QMAPS Supabase inaccessible, aucun résultat en ligne revendiqué.
- **Prochaine action exacte :** consulter CI sur HEAD et corriger s'il échoue ; puis reprendre les autres parcours sans boutons fictifs et la finalisation production issue #6 après accès autorisé.



## Correctifs de navigation — 15 octobre 2026
- **Dernière tâche terminée en code :** menu commerçant `/merchant?tab=reviews`, sécurité/compte `/settings`, confidentialité `/privacy`, conditions `/terms` et support `/support`. Le tableau de bord accepte un lien profond à l'onglet des avis. L'outil de planification factice est retiré et la zone d'entreprise mène au sélecteur réel.
- **Fichiers :** `MerchantMore.tsx`, `MerchantDashboard.tsx`, `src/test/merchantNavigationRoutes.test.ts`, `WORKLOG.md`, `docs/AGENT_HANDOFF.md`, `docs/TASK_QUEUE.md`.
- **Parent Git de ce travail :** `f61a32f57a277c812403ca35d4fc1b6ebde907d3`, nouveau SHA sur la référence `main`. Vérification du dernier SHA via GitHub requise.
- **CI :** vérifier job déclenché par ce commit avant de l'annoncer vert ; la première version des tests d'UI a été remplacée par des tests Vitest compatibles avec le lockfile actuel.
- **État production :** aucun déploiement vérifié ; Supabase QMAPS `ldvkebjfuldnemfdoted` inaccessible et workflow SSH `skipped`. Aucune migration appliquée par cet agent.
- **Prochaine action exacte :** corriger toute erreur CI, puis effectuer les tests de navigation deux entreprises lorsque la cible réelle et les accès sont confirmés. Issue #6 maintenue ouverte.



## Correction de pipeline — 15 octobre 2026
- Un autre agent a intégré en parallèle des changements d'authentification des rôles en `main`. **Aucun écrasement et aucun force-push.** Le nouveau `main` a été récupéré avant ce commit.
- Les deux premiers tests React ajoutés ont fait échouer TypeScript CI (`TS2305` sur `screen`, `fireEvent`, `waitFor`) car `@testing-library/dom` n'est pas résolu dans le lockfile du dépôt. Pour ne pas modifier les dépendances de production et leur lockfile à l'aveugle, les tests ont été remplacés par des contrats Vitest lisant le code réel. **Ils ne remplacent pas des essais interactifs E2E**.
- **Dernière tâche exécutée :** réparation `src/test/merchantReviewsUI.test.tsx` et `src/test/merchantSubscriptionIsolation.test.tsx`, plus relève. Les corrections d'UI, d'isolation des abonnements et d'autorisation concurrente sont conservées.
- **En cours :** vérifier lint/typecheck/tests/build GitHub Actions sur le nouveau HEAD, traiter tout échec ; production QMAPS non vérifiée.
- **Dernier SHA poussé :** lire `main` GitHub, car son SHA ne peut être contenu dans son propre commit. Parent sur lequel ce patch est fondé : `4364dada5e18cf8eb54ead626c8ae70e4675f26a`.
- **Accès requis :** projet Supabase QMAPS `ldvkebjfuldnemfdoted`, host/docroot `qmaps.ca`, secrets build/SSH, configuration Stripe. Ne jamais migrer une autre base.
- **Prochaine action :** valider CI puis travailler sur les problèmes indépendants ; vérifier l'application réelle seulement après accès à la cible et au domaine.



## Reprise 2026-10-15 — protection du déploiement
- **Tâche terminée en code :** `.github/workflows/qmaps-ssh-deploy.yml` vérifie désormais une CI `push` réussie au même SHA sur `main` avant `workflow_dispatch`. Elle refuse les cibles SSH racines ou chemins suspects et vérifie l'origine de la branche des événements.
- **Dernier commit CI réussi avant cette tâche :** `f61a32f57a277c812403ca35d4fc1b6ebde907d3`, [run 38803826151](https://github.com/takatakca/qmaps/actions/runs/38803826151) (lint, types, tests, build et GO/NOGO réussis).
- **Fichiers :** workflow SSH, `src/test/deploymentPipeline.test.ts`, `WORKLOG.md` et les documents de relève.
- **Statut de production :** déploiement **non autorisé** (`QMAPS_DEPLOY_ENABLED` pas à `true`), aucune version HTTPS vérifiée, projet Supabase QMAPS encore inaccessible. Conserver l'issue #6.
- **Prochaine action :** vérifier CI sur le SHA du présent commit, ne publier qu'après identification effective du host/docroot `qmaps.ca`, puis comparer `qmaps-release.json` au SHA.

## Reprise 2026-10-15 — garde-fous Auth
- **Dernier HEAD avant intervention :** `f7431787076273bdc49801644baf96653a3ee0b4`, à vérifier en CI ; conserver les nouveaux travaux sur les avis commerçants déjà poussés par l'autre agent.
- **Dernière tâche terminée en code :** `useAuth` empêche un rôle `admin/merchant` chargé pour l'ancien compte d'être accordé au nouveau. La route commerçant exige une vérification réelle de l'upsert et offre une reprise visible en cas d'erreur ; l'onboarding ne publie pas si `refreshRoles()` échoue.
- **Fichiers changés :** `src/hooks/useAuth.tsx`, `src/components/ProtectedMerchantRoute.tsx`, `src/pages/MerchantOnboarding.tsx`, `src/test/authAccountIsolation.test.tsx`, `src/test/merchantRouteAuthorization.test.ts`, `WORKLOG.md`, `docs/AGENT_HANDOFF.md`, `docs/TASK_QUEUE.md`, `docs/DECISIONS.md`.
- **Dernier commit poussé :** lire `refs/heads/main` ; un SHA ne peut pas être enregistré dans son propre commit. Parent connu `f7431787076273bdc49801644baf96653a3ee0b4`.
- **Contrôles :** nouveau run CI à vérifier ; précédemment CI du code 4f17f1d réussie. Aucun test SQL de production.
- **Déploiement réel :** non vérifié, workflow SSH ignoré ; projet Supabase `ldvkebjfuldnemfdoted` inaccessible à l'app connectée. Hébergement réel/DNS/docroot de `qmaps.ca` non confirmés.
- **Accès nécessaires :** projet Supabase QMAPS existant, paramètres réels de l'hébergeur et secrets GitHub/Edge ; ne pas exposer les secrets.
- **Prochaine action exacte :** vérifier CI puis corriger si échec. Ensuite tests réels de comptes distincts et migration des SQL QMAPS uniquement une fois accès autorisé. Revalider les liens de déploiement et le SHA sur HTTPS avant déclaration de production.
---


## Reprise du 2026-10-15 — facturation fiable et isolation
- **Dernière tâche codée :** `useMerchantSubscription` isole le résultat par `businessId` et annule les réponses obsolètes. Retourne `error`, affiché dans `MerchantBilling` et `MerchantBillingPlans`. Pas de Checkout tant que l'abonnement n'est pas confirmé ou qu'une lecture a échoué.
- **Autres correctifs :** suppression des montants fictifs « Aucun — 0,00 $ » et date « 1 avr. 2026 » ; lien « Ouvrir l'application » activé ; les événements de facturation périmés ou en erreur ne sont plus présentés comme inexistants.
- **Fichiers :** `src/hooks/useMerchantSubscription.ts`, `src/pages/MerchantBilling.tsx`, `src/pages/MerchantBillingPlans.tsx`, `src/test/merchantSubscriptionIsolation.test.tsx`, ainsi que fichiers standards `WORKLOG.md` et `docs/*`.
- **Tests :** tests React de changement d'entreprise, erreurs Supabase, effacement de la souscription ; exécution CI sur le commit courant à vérifier.
- **Déploiement :** non effectué ; vrai compte QMAPS Supabase et hébergement non accessibles. Préserver les migrations et les secrets existants sans les copier dans Git.
- **Suite exacte :** consulter GitHub Actions sur HEAD, corriger toute panne, puis traiter les autres défauts UI vérifiables. Vérifier Stripe en environnement autorisé lorsque le projet QMAPS est connecté.

## Reprise du 2026-10-15 — avis commerçants
- **Dernier HEAD validé avant changement :** `4f17f1dba650eb419441e5c719d816bf8e631c6b`, GitHub CI [38624845077](https://github.com/takatakca/qmaps/actions/runs/38624845077) **success**, déploiement SSH **skipped**.
- **Dernière tâche codée :** suppression des faux avis « recommandés/non recommandés » et des boutons sans action dans `MerchantReviews.tsx`, remplacement par un état vide exact et un lien vers `/merchant/business-info`. Ajout de `src/test/merchantReviewsUI.test.tsx` (rendu React, navigation, soumission Edge Function).
- **État en cours :** vérifier CI sur le nouveau SHA, puis reprendre la fiabilité de facturation multi-entreprises.
- **Fichiers modifiés :** `src/components/merchant/MerchantReviews.tsx`, `src/test/merchantReviewsUI.test.tsx`, `WORKLOG.md`, `docs/AGENT_HANDOFF.md`, `docs/TASK_QUEUE.md`, `docs/PROJECT_STATUS.md`, `docs/DECISIONS.md`.
- **Dernier commit :** HEAD de `main` ; lire `git rev-parse HEAD` ou GitHub Git Ref (impossible d'indiquer son propre SHA dans le même commit).
- **Vérifications :** GitHub ref `main`, CI runs, zéro PR ouverte, lecture des écrans et du code de réponse aux avis. Le test d'interface sera exécuté par CI sur ce commit.
- **Déploiement :** aucune preuve de nouvelle version en ligne ; déploiement SSH toujours désactivé, projet Supabase `ldvkebjfuldnemfdoted` non accessible. Aucun secret exposé.
- **Accès nécessaires :** autorisation au vrai projet Supabase QMAPS, hébergement réel `qmaps.ca` et web root, secrets build/SSH et Edge Functions via configuration sécurisée.
- **Prochaine action exacte :** si CI échoue, lire logs et corriger ; sinon continuer l'intégrité des chargements Stripe/abonnements par commerce ; après accès externes, vérifier SQL/Stripe et empreinte HTTPS, puis fermer issue #6 uniquement sur preuve.



## Point de reprise faisant autorité — 14 octobre 2026
**Dépôt :** `takatakca/qmaps`, branche `main`. **Dernier commit de code vérifié poussé par l'agent :** `328d8918a8cf6dccb249425628d5411d128b3f6e`. Pour le SHA du présent fichier de relève, lire la référence `refs/heads/main` (impossible d'inscrire son propre SHA dans son contenu).

**Dernière tâche terminée en code :** récupération des inscriptions commerçantes incomplètes : reprise de fiche `is_active=false`, restauration des catégories, validation des écritures de catégories, et contrôle du rôle `merchant` avant de rendre la fiche publique. Tests dans `src/test/merchantDraftRecovery.test.ts` et `src/test/merchantPublishEntitlement.test.ts`.

**Tâche en cours :** vérifier le run CI du SHA `328d8918` sur https://github.com/takatakca/qmaps/actions/runs/38624571461 ; si échec, lire les jobs/logs et corriger, puis continuer les P0 indépendantes de la production.

**Fichiers de la reprise :** `src/pages/MerchantOnboarding.tsx`, `src/pages/MerchantDashboard.tsx`, `src/pages/MerchantOptimization.tsx`, `src/hooks/useSponsoredCampaigns.ts`, `src/lib/reviewsWithAuthors.ts`, `src/lib/merchantSelection.ts`, les écrans marchands secondaires, les tests `src/test/`, les deux nouvelles migrations `supabase/migrations/20261014230000_*.sql` et `20261014231000_*.sql`, la relève et `WORKLOG.md`.

**Vérifications effectuées :** lecture des consignes, du journal et des issues/PR sur GitHub ; lecture des migrations RLS, comparaison des politiques SQL et du code des interfaces, commits en `main` sans force-push ; CI vertes jusqu'à `f774e0af` (run 38624432519), nouveau run lancé sur le dernier code. Supabase `list_projects` et `get_project(ldvkebjfuldnemfdoted)` : le projet n'est pas accessible. Vérification `https://qmaps.ca` et `www` via outils web : inaccessible depuis les outils disponibles. **Aucun test SQL en production ni déploiement d'Edge Functions exécuté.**

**Problèmes et accès requis :** accès autorisé au projet QMAPS `ldvkebjfuldnemfdoted`, hébergeur exact de `qmaps.ca` avec DNS/SSL vérifiables, web root dédié, secrets Actions SSH/build, secrets serveur Stripe/HMAC/JWT sur le bon projet. Aucune valeur secrète à committer.

**Statut de déploiement :** production non vérifiée ; workflow QMAPS SSH volontairement désactivé (`QMAPS_DEPLOY_ENABLED` pas configurée à `true`) ; dernières exécutions `skipped`.

**Prochaine action exacte :** (1) vérifier CI sur dernier commit `main`, corriger si rouge ; (2) avec accès au vrai Supabase QMAPS, contrôler backup/historique des migrations puis appliquer uniquement les SQL manquantes dans l'ordre et déployer les Edge Functions ; (3) identifier le vrai host/web root `qmaps.ca` et installer les secrets Actions ; (4) activer workflow seulement sur la cible vérifiée, confirmer `/qmaps-release.json` égale au SHA et effectuer la recette deux entreprises / Stripe / cartes / avis. Consigner les résultats dans `docs/DEPLOYMENT.md` et fermer issue #6 uniquement après preuves.

---
Les entrées historiques ci-dessous sont conservées pour permettre aux prochains agents de suivre l'origine des choix.


**Mis à jour :** 2026-10-14 | Dépôt `takatakca/qmaps` | branche `main`.

## Relève — droit d'accès à une fiche reprise (2026-10-14)
- **Correction de suivi :** la dernière publication vérifie également la création du rôle `merchant` côté Supabase, pour les brouillons récupérés où une ancienne tentative a pu échouer ; elle actualise les rôles avant `is_active=true`.
- Fichiers : `MerchantOnboarding.tsx`, `src/test/merchantPublishEntitlement.test.ts`, `WORKLOG.md`, `docs/AGENT_HANDOFF.md`.
- CI à confirmer ; test E2E du rôle QMAPS toujours bloqué par l'accès Supabase réel.

## Relève — inscription commerçant résiliente (2026-10-14)
- Une fiche sauvegardée avec `is_active=false` n'entraîne plus une redirection vers une nouvelle inscription : l'onboarding reprend son brouillon, ses renseignements et catégories ; une catégorie manquante renvoie à l'étape de sélection.
- Écriture des catégories via `upsert` idempotent contrôlé ; impossible de publier tant qu'aucune catégorie n'est effectivement liée. Les échecs de création du rôle `merchant` sont signalés ; brouillon privé conservé pour reprise.
- **Fichiers :** `src/pages/MerchantOnboarding.tsx`, `src/test/merchantDraftRecovery.test.ts`, `WORKLOG.md`, `docs/AGENT_HANDOFF.md`, `docs/TASK_QUEUE.md`.
- **Prochaine vérification :** CI puis essais E2E sur QMAPS (brouillon existant, échec d'enregistrement des catégories, récupération après rafraîchissement, finalisation). Supabase QMAPS inaccessible pour ce test.

## Relève — avis commerçants fiables (2026-10-14)
- **Dernière tâche codée :** `src/lib/reviewsWithAuthors.ts` propage désormais les vraies erreurs Supabase (avis/profils). `MerchantDashboard` cesse de tourner indéfiniment en cas d'erreur et offre « Réessayer » sans afficher zéro avis fictif. L'aperçu ne reçoit pas les avis d'une entreprise antérieure pendant le changement de sélection.
- **Fichiers :** helper, dashboard, `src/test/merchantReviewLoading.test.ts`, `WORKLOG.md` et documents d'état.
- **Reste :** CI, test de panne Supabase et essais d'isolation multi-entreprises dans QMAPS réel. Projet Supabase QMAPS non accessible, hébergement non confirmé.

## Relève — lecture sécurisée des campagnes (2026-10-14)
- `useSponsoredCampaigns` contrôle la génération de requête et l'identifiant de commerce effectivement chargé ; les données d'une entreprise précédente ne sont pas exposées lors d'un changement de sélection.
- Les erreurs Supabase sont maintenant distinctes de « aucune campagne » dans `MerchantOptimization.tsx`, avec bouton Réessayer.
- Fichiers : `src/hooks/useSponsoredCampaigns.ts`, `src/pages/MerchantOptimization.tsx`, `src/test/sponsoredCampaignIsolation.test.ts`, `WORKLOG.md`, `docs/AGENT_HANDOFF.md`, `docs/TASK_QUEUE.md`.
- Prochaine vérification : CI sur le commit courant ; ensuite E2E deux commerçants et deux entreprises sur le véritable projet Supabase QMAPS. Aucune migration ni publication en ligne exécutée.

## Relève — tableau publicitaire ancré sur les données réelles (2026-10-14)
- **Dernière tâche codée :** remplacement de l'ancien simulateur sans backend de `MerchantOptimization.tsx` par un panneau affichant les campagnes réellement retournées par `useSponsoredCampaigns` pour le commerce appartenant à l'utilisateur. Les statuts et budgets proviennent de Supabase, sans clics/leads fabriqués.
- **Fichiers :** `src/pages/MerchantOptimization.tsx`, `src/test/merchantAdvertisingTruth.test.ts`, `WORKLOG.md`, `docs/AGENT_HANDOFF.md`, `docs/TASK_QUEUE.md`.
- **Actions réelles :** `/merchant/sponsored` pour brouillons/validation, `/merchant/analytics` pour statistiques, `/merchant/billing/plans` pour abonnements.
- **Prochain test :** CI de ce commit et test manuel sur le projet QMAPS d'un commerçant possédant des campagnes ; ne pas affirmer de publication publicitaire tant que la diffusion n'est pas prouvée.
- **Production :** non vérifiée ; connexion à Supabase QMAPS et hébergeur manquants.

## Relève — fin de propagation multi-entreprise (2026-10-14)
- **Dernière tâche codée :** contexte de commerce actif étendu à `MerchantInbox`, `MerchantMessages`, `MerchantMore`, `MerchantOptimization`, `MerchantServiceSetup`, `MerchantSponsored`.
- **Fichiers modifiés :** les six pages, `src/test/merchantRemainingSelection.test.ts`, `WORKLOG.md` et docs `AGENT_HANDOFF.md` / `TASK_QUEUE.md`.
- Le commerce mémorisé n'est jamais considéré comme preuve d'autorisation : toutes les pages continuent à filtrer `owner_user_id` sur Supabase.
- **Contrôles :** test de contrat Vitest à exécuter en CI ; tests bout en bout sur deux comptes et plusieurs entreprises à réaliser dans le bon projet QMAPS.
- **Statut réel du déploiement :** SSH toujours désactivé, Supabase QMAPS inaccessible, production non vérifiée.
- **Prochaine action :** surveiller la CI de `main`, puis mettre à jour issue #6 et continuer les corrections hors production.

## Relève — choix multi-entreprise sur les écrans secondaires (2026-10-14)
- **Code poussé :** persistance `sessionStorage` du seul identifiant de commerce, isolé par propriétaire connecté. Chaque écran lit ensuite uniquement les entreprises retournées par Supabase avec `owner_user_id = user.id`, et ignore un identifiant mémorisé absent de cette liste. Le stockage local ne tient jamais lieu de permission.
- **Écrans modifiés :** dashboard, informations, photos, menu, publicités, facturation, forfaits Stripe, marketplace, accueil commerçant, analytics. Helper `src/lib/merchantSelection.ts`, test `src/test/merchantSelectionAcrossPages.test.ts`.
- **Vérifications restantes :** CI du nouveau commit puis E2E avec au moins deux entreprises sur le bon projet QMAPS (changer commerce → photos/menu/analytics/Stripe ; déconnexion/reconnexion autre compte → aucun accès croisé).
- **Statut de production :** accès projet Supabase QMAPS manquant, SSH non activé, donc aucun déploiement confirmé.

## Relève — sécurisation des avis publics (2026-10-14)
- **Dernière tâche codée :** migration `supabase/migrations/20261014231000_guard_review_moderation_integrity.sql` et test `src/test/reviewModerationIntegrity.test.ts`. Les clients ne peuvent plus, après application de la migration, changer librement `moderation_status`, champs de dissimulation, compteurs `useful/funny/cool` ni `reviews.user_id/business_id` ; la modification de texte/note demeure possible.
- **Fichiers concernés :** migration, test, `WORKLOG.md` et documents standard `docs/AGENT_HANDOFF.md`, `TASK_QUEUE.md`, `DEPLOYMENT.md`, `DECISIONS.md`, `PROJECT_STATUS.md`.
- **État réel :** code commité, déploiement DB non exécuté faute d'accès au projet Supabase QMAPS. Tester RLS avec deux comptes, plus l'admin et le service_role dans l'environnement QMAPS seulement.
- **Prochaines étapes :** surveiller la CI de ce nouveau commit ; si rouge, lire les logs et corriger ; ensuite reprendre les tâches indépendantes en attente.

## Relève — nouvelle reprise sécurisation (2026-10-14)
- Source `main` avant intervention : `4b7f56584d90eea52493d0ab5fa6ea699348e544` ; CI principale vérifiée réussie (run 38616348049), workflow SSH `skipped`.
- **Tâche codée :** fermeture du contournement de `businesses.is_claimed`, `avg_rating` et `reviews_count` par les propriétaires, pour INSERT et UPDATE. Migration `supabase/migrations/20261014230000_protect_business_verification_and_rating_integrity.sql` ; tests `src/test/businessTrustIntegrity.test.ts`.
- **Fichiers modifiés :** les deux fichiers précédents, `WORKLOG.md`, `docs/AGENT_HANDOFF.md`, `docs/TASK_QUEUE.md`, `docs/DECISIONS.md`, `docs/DEPLOYMENT.md`.
- **Tâche en cours :** validation de la CI déclenchée par ce commit, puis prochain problème indépendant de l'accès Supabase.
- **Dernier commit de la reprise :** lire `main` sur GitHub ou `git rev-parse HEAD`; son SHA ne peut pas être écrit dans son propre contenu. Parent vérifié `4b7f56584d90eea52493d0ab5fa6ea699348e544`.
- **Commandes/vérifications :** GitHub GET ref/main, PR/issues/workflow runs, lecture des migrations RLS, comparaison aux écritures dans les écrans admin ; Supabase list_projects/get_project : le projet `ldvkebjfuldnemfdoted` demeure inaccessible. Essais réseau DNS/CURL : `qmaps.ca` non résolu depuis l'environnement disponible.
- **Déploiement réel :** **aucun nouveau déploiement vérifié**. SSH volontairement désactivé ; migrations et Edge Functions non appliquées/confirmées.
- **Accès nécessaires :** compte autorisé sur le projet Supabase QMAPS, véritable hébergeur/web root de `qmaps.ca`, secrets de déploiement GitHub (jamais dans Git).
- **Action exacte suivante :** vérifier CI sur `main`, puis sauvegarder et appliquer la migration sur QMAPS uniquement après accès. Tester compte marchand non admin (échec UPDATE is_claimed/ratings), admin (succès), et calcul des notes via reviews (succès).
- Suivi [issue #6](https://github.com/takatakca/qmaps/issues/6).

## Dernière tâche terminée
Implémentation de la sélection multi-entreprises dans `src/pages/MerchantDashboard.tsx`, choix déterministe d'une entreprise appartenant à l'utilisateur et protection contre des réponses asynchrones d'avis périmées. Création des documents de suivi permanents.

## Tâche supplémentaire terminée en code
Nouvelle migration `supabase/migrations/20261014210000_guard_inserts_and_business_owner_assignment.sql` : gardes INSERT pour les champs propriétaires des avis et liens TAKATAK ; blocage d'attribution d'une fiche à un autre compte. Ajustement de l'interface pour ne **jamais** afficher les avis de l'entreprise précédente pendant un changement. Migration NON appliquée dans la base réelle.

## Contrôle de version en production ajouté
`.github/workflows/qmaps-ssh-deploy.yml` compare désormais la révision validée au dernier `main`, produit un manifeste `qmaps-release.json` et en vérifie le SHA exact sur le domaine après transfert. Le workflow n'a pas été activé sur un serveur réel.

## Qualité produit — affichage honnête
Le tableau de bord commerçant utilise désormais `hours_json` et `hours` comme sources d'horaires, n'affiche plus de promotions ou badges inventés, et relie les boutons de téléphone/photos à des actions fonctionnelles. Voir `src/test/merchantOverviewTruth.test.ts`.

## Création de commerce — correction
Le tableau de bord n'insère plus automatiquement une fiche au nom « Mon entreprise » et à l'adresse fictive « Montréal, QC ». Le bouton utilise le formulaire `/add-business`, déjà existant. Le formulaire renvoie un propriétaire connecté vers `/merchant` après enregistrement. Test : `src/test/merchantBusinessCreation.test.ts`.

## Onboarding et géolocalisation
L'onboarding utilise désormais `is_claimed: false`, conforme à la politique RLS du 16 mai 2026. Migration `supabase/migrations/20261014220000_nullable_business_coordinates_no_fallback.sql` : coordonnées nullable sans latitude/longitude Montréal par défaut, et trigger géographique effaçant une localisation lorsque les coordonnées sont absentes. Aucun backfill des anciennes fiches. Types Supabase frontend synchronisés manuellement tant que l'accès au projet réel manque. Vérifier la migration et régénérer les types via CLI sur le vrai projet avant livraison.

## Onboarding — étape de publication sécurisée
La création du commerce dans `MerchantOnboarding.tsx` stocke une fiche avec `is_active:false` pour que l'étape photo/revue ne publie aucune fiche prématurément. La dernière étape met `is_active:true` uniquement après un UPDATE retournant l'enregistrement de ce propriétaire. En cas d'erreur, aucun faux message de succès. Test `src/test/merchantPublishFlow.test.ts`.

## Avis publics — interactions complétées
Le panneau `BusinessReviewsTab` propose maintenant un vrai filtre par note et le dépliage de texte, l'ajout de photo mène à `/add-photo` et exige la connexion. Les faux compteurs d'auteur et le bouton « Check in » inactif ont été supprimés. Test `src/test/publicReviewUX.test.ts`.

## Localisation des commerces ajoutés
`AddBusiness.tsx` exige désormais le nom, l'adresse et la ville du commerce. L'insertion sauvegarde la ville saisie (Québec/QC), au lieu d'accepter le défaut SQL historique Montréal ; l'option propriétaire/gestionnaire n'affirme pas une vérification automatique. Test `src/test/addBusinessCity.test.ts`.

## Contrôle strict ajouté
`package.json` expose `bun run typecheck` exécuté par le job CI avant la suite Vitest. Si le nouveau contrôle découvre des erreurs préexistantes, corriger les sources et relancer GitHub Actions jusqu'à réussite ; ne pas masquer ni retirer l'étape.

## Dernière relève et preuves (2026-10-14)
- **Dernière tâche terminée :** ajout d'un contrôle TypeScript complet à la CI, après corrections du portail multi-commerces, de l'intégrité RLS/onboarding, du filtre des avis et des garde-fous du pipeline.
- **Dernier commit de code poussé et vérifié :** `23aa06e4e38dafc8be6cf30e59eddf426cf533ac`; workflow CI réussi : https://github.com/takatakca/qmaps/actions/runs/38615907405.
- **Commit contenant ce document :** `git rev-parse HEAD` / `main` sur GitHub (un SHA Git ne peut pas être embarqué dans son propre commit).
- **Fichiers de la dernière phase :** `.github/workflows/ci.yml`, `package.json`, `src/pages/MerchantOnboarding.tsx`, `src/pages/AddBusiness.tsx`, `src/components/business/BusinessReviewsTab.tsx`, `src/integrations/supabase/types.ts`, les nouveaux tests sous `src/test/`, et les documents `docs/*`.
- **Vérification exécutée :** GitHub CI (lint/typecheck/test/launch/build/GO-NO-GO) verte sur `23aa06e4`. Deno/contrat TAKATAK vert sur précédentes modifications serveur. Aucune migration de base réelle ni test E2E de production revendiqué.
- **Problème connu :** accès manquant au Supabase QMAPS `ldvkebjfuldnemfdoted`; DNS, SSL, hébergement et web root de `qmaps.ca` non vérifiés depuis l'environnement disponible. Déploiement SSH automatiquement ignoré ; aucune preuve d'une nouvelle version en production.
- **Accès requis :** compte/projet Supabase QMAPS autorisé, SSH de l'hébergeur vérifié, GitHub secrets de build/déploiement, configuration Stripe/Maps/OAuth via coffre de secrets. Aucun secret en texte dans ce document.
- **Suivi du blocage** : [issue #6](https://github.com/takatakca/qmaps/issues/6).
- **Prochaine action exacte :** vérifier que la CI du commit de cette relève est verte ; ensuite, via l'accès autorisé QMAPS (et pas un autre projet), contrôler les migrations, appliquer celles qui manquent et déployer les fonctions. Après validation du domaine, activer le workflow SSH et vérifier `qmaps-release.json` avec son SHA exact.

## Travail en cours / prochaine tâche
Vérifier les workflows déclenchés par **ce commit** et corriger immédiatement les éventuels échecs ; ensuite relancer l'inspection de production en utilisant uniquement les accès autorisés.

## Dernier commit poussé (historique de la première reprise)
Avant cette reprise : `60fcdb8ba60559bc3986c5f9b6a9574390ce0cc5` (CI et TAKATAK checks verts). **Pour connaître le dernier commit contenant ce fichier**, exécuter `git rev-parse HEAD` ou consulter la branche `main` sur GitHub : le SHA ne peut pas être inscrit dans son propre commit.

## Fichiers concernés dans cette reprise
- `src/pages/MerchantDashboard.tsx`
- `src/lib/merchantSelection.ts`, `src/test/merchantSelection.test.ts`
- `supabase/migrations/20261014210000_guard_inserts_and_business_owner_assignment.sql`, `src/test/merchantReviewReply.test.ts`
- `docs/PROJECT_STATUS.md`, `docs/TASK_QUEUE.md`, `docs/AGENT_HANDOFF.md`, `docs/DEPLOYMENT.md`, `docs/DECISIONS.md`
- `WORKLOG.md`, `.agent/CONTINUATION.md`, `README.md`.

## Vérifications exécutées / attendues
- GitHub inspecté : `main` au SHA mentionné, zéro PR ouverte ; issue #1 active.
- Actions du dernier SHA antérieur : CI + TAKATAK contract **réussies** ; workflow SSH **skipped** (activation absente).
- `getent ahostsv4 qmaps.ca`, `curl -I https://qmaps.ca` et `www` : échec de résolution DNS depuis l'outil disponible, sans conclusion globale sur l'état du domaine.
- Les nouveaux tests multi-entreprises et builds seront exécutés via CI déclenchée au push ; noter son résultat exact et ses erreurs avant nouvelle étape.

## Blocages, accès requis, déploiement
- Connexion Supabase disponible ne donne pas accès au projet QMAPS `ldvkebjfuldnemfdoted`. Aucun déploiement ou migration Supabase vérifié.
- Hébergement cible, web root, DNS/SSL et secrets GitHub SSH non confirmés. Aucune version en ligne vérifiée.
- N'exposer aucun jeton ni clé dans le code, les logs, les issues ou la relève.

## Action exacte au redémarrage
1. Lire `AGENTS.md`, ce fichier et `WORKLOG.md`.
2. Vérifier `git rev-parse HEAD` ou l'API GitHub et la CI sur ce SHA.
3. Si la CI échoue, lire les jobs/logs, corriger, committer et pousser ; sinon vérifier le problème P0 suivant dans `TASK_QUEUE.md`.
4. Ne pas diriger des migrations vers un autre projet Supabase ; obtenir l'accès existant au projet QMAPS autorisé puis exécuter migration et vérification.
5. Confirmer l'hébergement réel avant d'activer le workflow SSH ; enregistrer l'empreinte du déploiement et mettre à jour `DEPLOYMENT.md`.

Projet non déclaré terminé tant que l'application réelle, les intégrations, les accès et la livraison ne sont pas prouvés.
