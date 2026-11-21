# QMAPS.ca — Découverte locale | GROUPE TAKATAK

QMAPS est une application de recherche de commerces, de catégories et de services locaux au Québec : fiches publiques, évaluations, photos, découverte par ville, demandes de projets, portail commerçant et offres de visibilité.

**Site cible :** https://qmaps.ca  
**Dépôt source :** https://github.com/takatakca/qmaps  
**Branche d'intégration :** `main`

## Production vérifiée le 21 novembre 2026

QMAPS.ca sert l’application de la branche `main`. La base PostgreSQL, les comptes, le stockage des photos et les fonctions serveur tournent dans le projet QMAPS du Coolify TAKATAK. La passerelle publique est `https://qmaps.ca/qmaps-api`. Le manifeste `/qmaps-release.json` identifie la révision du site. La console propriétaire s’ouvre sur `/console`.

Les trois commerces marqués « QMAPS Démo » sont fictifs. Le contrôle exécuté sur le serveur a vérifié la connexion de trois comptes temporaires, la publication, la liste d’attente, l’isolation des collections et les photos. Les sauvegardes quotidiennes de la base et des objets sont conservées sur le serveur. Le courriel transactionnel et les services externes nécessitent leur propre configuration.

Le [guide d’exploitation](ops/self-host/README.md) décrit l’installation reproductible, l’accès du propriétaire et les essais sur le serveur. Chaque intervenant signe son travail dans [WORKLOG.md](WORKLOG.md).

## Démarrer en local

Prérequis : Node.js moderne et Bun. Le dépôt versionne `bun.lock`.

```bash
git clone https://github.com/takatakca/qmaps.git
cd qmaps
cp .env.example .env
bun install --frozen-lockfile
bun run dev
```

Renseigner `.env` localement (ne **jamais** le pousser). Configuration navigateur : `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` et, si la carte le nécessite, `VITE_GOOGLE_MAPS_BROWSER_KEY`.

Les secrets serveur (Stripe, SUPABASE_SERVICE_ROLE_KEY, QMAPS_TAKATAK_INTEGRATION_SECRET, TAKATAK_QMAPS_MATCHING_SECRET) ne doivent jamais utiliser le préfixe `VITE_` ni apparaître dans les fichiers livrés au navigateur.

## Commandes de validation

```bash
bun run lint
bun run test
bun run launch:check
bun run build
bun run go:no-go:json
```

Les tests/build CI prouvent le code, **pas** la disponibilité de la base, des paiements, de l'hébergement ou du DNS. Le rapport go/no-go historique doit être régénéré et complété par les contrôles humains / production ; un ancien GO n'est pas une preuve de déploiement actuel.

## Architecture TAKATAK

QMAPS demeure une application enfant distincte ; TAKATAK conserve l'identité maîtresse et la décision de routage pour R2F. Pas d'accès direct R2F à l'auth ou à la base QMAPS. Intégration serveur-à-serveur via adaptateurs : `takatak-match-businesses` (HMAC), `takatak-link-business` et `takatak-reply-review`. Voir [contrat d'intégration](docs/takatak-integration.md), [issue #1](https://github.com/takatakca/qmaps/issues/1).

Les migrations de schéma et le déploiement des Edge Functions restent **séparés** de la publication des fichiers statiques. Ne jamais exécuter les migrations de production à l'aveugle.

## Déploiement GitHub vers qmaps.ca

Le build produit `dist/`, à placer dans la racine web d'un hébergement configuré pour les routes d'une SPA. Un workflow GitHub Actions optionnel [QMAPS SSH deploy](.github/workflows/qmaps-ssh-deploy.yml) effectue la construction et le transfert vers un hébergement SSH/cPanel **uniquement après activation explicite** via la variable du dépôt `QMAPS_DEPLOY_ENABLED=true` et installation de ses secrets. Sans ces paramètres, il reste désactivé et **aucun déploiement n'est présumé**.

Détails et instructions de retour arrière : [docs/github-ssh-deployment.md](docs/github-ssh-deployment.md). Ne pas pointer ce workflow sur un autre site/WordPress ou un répertoire contenant des données clients.

## Documentation

- [Relève active](docs/AGENT_HANDOFF.md), [état du projet](docs/PROJECT_STATUS.md), [file de tâches](docs/TASK_QUEUE.md), [déploiement](docs/DEPLOYMENT.md), [décisions](docs/DECISIONS.md), [ancien journal de relève](.agent/CONTINUATION.md) et [journal des commits](WORKLOG.md)
- [Contrat QMAPS/TAKATAK](docs/takatak-integration.md)
- [Préparation à la production](docs/production-readiness.md)
- [Parcours et accès](docs/route-inventory.md)
- [Checklist de déploiement](docs/deployment-checklist.md)

**Règles :** ne pas générer de faux commerces/avis/connexions ; préserver l'isolation entre commerçants et la confidentialité des clients ; journaliser les changements conformément à [AGENTS.md](AGENTS.md).
