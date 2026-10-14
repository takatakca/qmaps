# QMAPS — Déploiement

## Cible
- Branche : `main`, build statique Vite, artefact `dist/`.
- Domaine cible déclaré : `https://qmaps.ca`.
- Hébergement **non identifié de manière vérifiée**. MochaHost/cPanel a été évoqué dans l'écosystème TAKATAK, mais **ne doit pas être présumé pour QMAPS**.
- Vérification du 2026-10-14 : `getent ahostsv4 qmaps.ca` n'a retourné aucune adresse dans l'environnement disponible ; `curl -I https://qmaps.ca` et `www` ont échoué sur la résolution de nom. Aucun statut SSL, répertoire ou contenu déployé n'a pu être confirmé.

## GitHub Actions
1. `.github/workflows/ci.yml` exécute lint, tests, contrôles de lancement, build et GO/NO-GO.
2. `.github/workflows/takatak-integration-checks.yml` vérifie la fonction HMAC et la fonction de réponse commerçant avec Deno.
3. `.github/workflows/qmaps-ssh-deploy.yml` compile sur GitHub, transfère `dist/` via rsync/SSH, vérifie HTTPS. Les événements provenant d'un autre dépôt, une branche hors `main`, une CI échouée et les exécutions non activées ne doivent pas déclencher de publication.
4. L'activation requiert `QMAPS_DEPLOY_ENABLED=true` plus `QMAPS_DEPLOY_HOST`, `QMAPS_DEPLOY_USER`, `QMAPS_DEPLOY_WEB_ROOT`, `QMAPS_DEPLOY_SSH_PRIVATE_KEY`, `QMAPS_DEPLOY_KNOWN_HOSTS`, `QMAPS_PRODUCTION_URL` et les secrets de build documentés dans [github-ssh-deployment.md](github-ssh-deployment.md).
5. Aucun secret de serveur ne doit être versionné, y compris dans la relève.

## Base et APIs — étapes séparées
Le projet Supabase du dépôt est `ldvkebjfuldnemfdoted`. La connexion actuellement accessible ne le liste pas ; **ne pas exécuter de migration sur un autre projet**. Une fois l'accès correct établi :
- Sauvegarder et comparer `supabase/migrations/20261011120000_takatak_workspace_and_review_reply.sql` puis `supabase/migrations/20261014190000_guard_takatak_columns_and_review_replies.sql`.
- Appliquer seulement les migrations manquantes après vérification de l'ordre.
- Configurer les secrets fonctionnels et vérifier `takatak-match-businesses` (HMAC), `takatak-link-business`, `takatak-reply-review` et `merchant-reply-review` (JWT).
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
