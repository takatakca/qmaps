# QMAPS.ca — GitHub → déploiement SSH/cPanel (facultatif)

Ce workflow est **préparé**, pas actif par défaut. La branche `main` est la source ; la CI doit passer avant une publication automatique. Ne pas déclarer que qmaps.ca héberge cette branche tant que le serveur réel, le DNS et les certificats n'ont pas été vérifiés.

## Compatibilité

Convient à un serveur **Apache/cPanel desservant un site React/Vite statique** avec SSH, rsync, document root dédié et redirection des routes React vers index.html. Pas adapté tel quel à Coolify, WordPress, Next.js serveur ou un conteneur : choisir alors un mécanisme natif à l'hébergeur.

## Activation

1. Dans GitHub → Settings → Secrets and variables → Actions, définir une variable de dépôt `QMAPS_DEPLOY_ENABLED=true` **uniquement après validation du serveur**.
2. Créer les secrets suivants (valeurs privées non incluses dans ce dépôt) :
   - `QMAPS_DEPLOY_HOST`, `QMAPS_DEPLOY_PORT` (22 par défaut), `QMAPS_DEPLOY_USER`, `QMAPS_DEPLOY_WEB_ROOT`
   - `QMAPS_DEPLOY_SSH_PRIVATE_KEY`, `QMAPS_DEPLOY_KNOWN_HOSTS`, `QMAPS_PRODUCTION_URL` (URL HTTPS complète)
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`
   - `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY` si la carte dépend encore de cet ancien nom d'intégration
3. La clé SSH doit être **dédiée au déploiement**, autorisée uniquement sur le répertoire cible. Vérifier manuellement la correspondance SSH host key avant de remplir KNOWN_HOSTS. Ne pas désactiver StrictHostKeyChecking.
4. Confirmer que WEB_ROOT est le répertoire **du seul site QMAPS** et non `public_html` d'un autre domaine. Faire une sauvegarde des fichiers du site existant.
5. Lancer `Actions → QMAPS SSH deploy → Run workflow` pour la première publication contrôlée. Les prochains succès du workflow `CI` sur `main` déclencheront les publications tant que la variable reste activée.

Le workflow build sur GitHub (`bun install --frozen-lockfile`, `bun run build`), transfère `dist/` par rsync **sans --delete** et vérifie la page d'accueil HTTPS. Il installe un `.htaccess` de fallback SPA. Il **ne lance jamais de build sur MochaHost**, ne modifie pas automatiquement Supabase, Stripe, les DNS ni SSL.

## Réversibilité et sécurité

Pour stopper la publication automatique, mettre `QMAPS_DEPLOY_ENABLED=false`. Conserver une copie horodatée du web root actuel ; pour revenir en arrière, restaurer cette copie ou déployer un commit stable via workflow manuel. Aucun script ne supprime à distance des fichiers ni n'écrase une base de données. Ne pas envoyer de clés service-role ou Stripe avec un préfixe `VITE_`.

## Bloquants de mise en ligne

- Domaine qmaps.ca et `www` : DNS/SSL/hébergeur non encore confirmés.
- Déploiement des fonctions Supabase et migration additive TAKATAK à appliquer séparément.
- Secrets, prix Stripe, OAuth et Google Maps à vérifier, puis tests fonctionnels réels.
- `docs/production-readiness.md` et `docs/final-owner-signoff.md` à actualiser avec une preuve actuelle.
