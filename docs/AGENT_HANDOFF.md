# QMAPS — Agent handoff

**Mis à jour :** 2026-10-14 | Dépôt `takatakca/qmaps` | branche `main`.

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

## Dernier commit poussé
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
