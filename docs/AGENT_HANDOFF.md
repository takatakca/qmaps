# QMAPS — Agent handoff

**Mis à jour :** 2026-10-14 | Dépôt `takatakca/qmaps` | branche `main`.

## Dernière tâche terminée
Implémentation de la sélection multi-entreprises dans `src/pages/MerchantDashboard.tsx`, choix déterministe d'une entreprise appartenant à l'utilisateur et protection contre des réponses asynchrones d'avis périmées. Création des documents de suivi permanents.

## Tâche supplémentaire terminée en code
Nouvelle migration `supabase/migrations/20261014210000_guard_inserts_and_business_owner_assignment.sql` : gardes INSERT pour les champs propriétaires des avis et liens TAKATAK ; blocage d'attribution d'une fiche à un autre compte. Ajustement de l'interface pour ne **jamais** afficher les avis de l'entreprise précédente pendant un changement. Migration NON appliquée dans la base réelle.

## Contrôle de version en production ajouté
`.github/workflows/qmaps-ssh-deploy.yml` compare désormais la révision validée au dernier `main`, produit un manifeste `qmaps-release.json` et en vérifie le SHA exact sur le domaine après transfert. Le workflow n'a pas été activé sur un serveur réel.

## Qualité produit — affichage honnête
Le tableau de bord commerçant utilise désormais `hours_json` et `hours` comme sources d'horaires, n'affiche plus de promotions ou badges inventés, et relie les boutons de téléphone/photos à des actions fonctionnelles. Voir `src/test/merchantOverviewTruth.test.ts`.

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
