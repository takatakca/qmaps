# QMAPS — Déploiement

## Durcissement du pipeline — 15 octobre 2026
- L'exécution manuelle `workflow_dispatch` exige désormais une CI `push` **réussie sur le SHA exact de main**. Un succès ancien sur une autre révision ne suffit pas.
- Contrôle supplémentaire des chemins distants SSH pour empêcher copie accidentelle à `/`, `/home` ou autre racine non dédiée. Le répertoire réel reste à confirmer par le propriétaire d'hébergement.
- Dernière CI de code validée avant ce changement : `f61a32f57a277c812403ca35d4fc1b6ebde907d3`, run [38803826151](https://github.com/takatakca/qmaps/actions/runs/38803826151) (success). Déploiement réel **toujours non effectué**.

## Dernière preuve connue (2026-10-14)
- Code déposé sur `main` au SHA `328d8918a8cf6dccb249425628d5411d128b3f6e`; GitHub CI [38624571461](https://github.com/takatakca/qmaps/actions/runs/38624571461) à confirmer. Dernière CI verte vérifiée : `f774e0af`, [38624432519](https://github.com/takatakca/qmaps/actions/runs/38624432519).
- **Déploiement sur `qmaps.ca` : aucune preuve de succès.** Le workflow SSH a été `skipped` à chaque exécution ; site et certificat non accessibles depuis les outils de vérification, adresse DNS non résolue.
- **Migrations et fonctions Supabase QMAPS : non appliquées par cet agent, non vérifiées en production.** L'accès au vrai projet `ldvkebjfuldnemfdoted` est refusé. Seules les modifications GitHub peuvent être considérées comme réalisées.
- Lancer le vrai déploiement seulement après validation de la cible ; enregistrer SHA et horodatage du manifeste accessible par HTTPS, puis le résultat des tests sur base réelle dans ce document.


## Cible
- Branche : `main`, build statique Vite, artefact `dist/`.
- Domaine cible déclaré : `https://qmaps.ca`.
- Hébergement **non identifié de manière vérifiée**. MochaHost/cPanel a été évoqué dans l'écosystème TAKATAK, mais **ne doit pas être présumé pour QMAPS**.
- Vérification du 2026-10-14 : `getent ahostsv4 qmaps.ca` n'a retourné aucune adresse dans l'environnement disponible ; `curl -I https://qmaps.ca` et `www` ont échoué sur la résolution de nom. Aucun statut SSL, répertoire ou contenu déployé n'a pu être confirmé.

## GitHub Actions
1. `.github/workflows/ci.yml` exécute lint, vérification TypeScript explicite, tests, contrôles de lancement, build et GO/NO-GO.
2. `.github/workflows/takatak-integration-checks.yml` vérifie la fonction HMAC et la fonction de réponse commerçant avec Deno.
3. `.github/workflows/qmaps-ssh-deploy.yml` compile sur GitHub, transfère `dist/` via rsync/SSH, vérifie HTTPS. Les événements provenant d'un autre dépôt, une branche hors `main`, une CI échouée et les exécutions non activées ne doivent pas déclencher de publication.
4. L'activation requiert `QMAPS_DEPLOY_ENABLED=true` plus `QMAPS_DEPLOY_HOST`, `QMAPS_DEPLOY_USER`, `QMAPS_DEPLOY_WEB_ROOT`, `QMAPS_DEPLOY_SSH_PRIVATE_KEY`, `QMAPS_DEPLOY_KNOWN_HOSTS`, `QMAPS_PRODUCTION_URL` et les secrets de build documentés dans [github-ssh-deployment.md](github-ssh-deployment.md).
5. Aucun secret de serveur ne doit être versionné, y compris dans la relève.

## Suivi de publication
- Issue P0 : https://github.com/takatakca/qmaps/issues/6.
- GitHub CI + TypeScript typecheck : réussite au SHA `23aa06e4e38dafc8be6cf30e59eddf426cf533ac` (https://github.com/takatakca/qmaps/actions/runs/38615907405). Ce résultat n'est pas une vérification en ligne.
- Publication SSH sur qmaps.ca : **non effectuée** via le workflow (tâches `skipped`, activation non configurée).

## Base et APIs — étapes séparées
Le projet Supabase du dépôt est `ldvkebjfuldnemfdoted`. La connexion actuellement accessible ne le liste pas ; **ne pas exécuter de migration sur un autre projet**. Une fois l'accès correct établi :
- Sauvegarder et comparer, dans l'ordre : `20261011120000_takatak_workspace_and_review_reply.sql`, `20261014190000_guard_takatak_columns_and_review_replies.sql`, `20261014210000_guard_inserts_and_business_owner_assignment.sql`, puis `20261014220000_nullable_business_coordinates_no_fallback.sql`, puis `20261014230000_protect_business_verification_and_rating_integrity.sql`, puis `20261014231000_guard_review_moderation_integrity.sql` (tous sous `supabase/migrations/`).
- Appliquer seulement les migrations manquantes après vérification de l'ordre, dont `supabase/migrations/20261014220000_nullable_business_coordinates_no_fallback.sql` après les migrations de protection ; elle supprime les défauts de coordonnées montréalaises sans changer les anciennes fiches.
- Configurer les secrets fonctionnels et vérifier `takatak-match-businesses` (HMAC), `takatak-link-business`, `takatak-reply-review` et `merchant-reply-review` (JWT).
- Tester l'interdiction aux auteurs d'avis de modifier les champs de modération, les compteurs de réactions et leur identité/entreprise, tout en permettant la mise à jour normale de leur propre avis. Les accès admin et fonctions serveur doivent rester opérationnels.
- Tester en conditions autorisées le refus marchand sur `businesses.is_claimed`, `avg_rating` et `reviews_count`, l'autorisation admin, et la recomputation des notes lors d'un avis. Aucune de ces vérifications SQL n'est encore exécutée sur la production.
- Vérifier les fonctions Stripe, leur liste blanche d'origines et le traitement des webhooks avec des tests autorisés.

## Contrôle anti-version périmée et empreinte de production
- Le workflow compare le commit à publier avec `refs/heads/main` juste avant la construction ; il refuse les exécutions CI anciennes.
- Le build publie `/qmaps-release.json` avec le SHA exact du commit source. Après rsync, le workflow exige que le contenu HTTPS public corresponde **octet pour octet** à `{"sha":"<SHA>"}`.
- L'artefact de version n'inclut aucune clé ; il n'est pas une preuve des migrations ou de la santé métier.
- Si le contrôle échoue, le déploiement doit être considéré en échec et le site restauré ou corrigé avant activation du trafic.

## Conditions d'un GO réel
CI verte sur SHA exact, accès HTTPS valide, routes SPA, `robots.txt` et sitemap, version déployée traçable, vérifications de login, RLS cross-merchant, cartes, avis, abonnements et retour arrière connu. Les seules CI vertes ne prouvent pas une production fonctionnelle.

## Récupération
En cas de panne, désactiver `QMAPS_DEPLOY_ENABLED`, remettre les fichiers du précédent artefact/backup, vérifier HTTPS, inspecter journaux. Toute migration DB nécessite une procédure de correction dédiée, jamais une suppression automatique.
