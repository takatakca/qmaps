# QMAPS — Relève des agents

Mise à jour : 2026-10-14. Source : `takatakca/qmaps`, branche `main`.

## État vérifié dans GitHub

- PR #5 fusionnée : suppression du `.env` suivi et ajout de la relève. Les valeurs précédemment commitées restent dans l'historique Git jusqu'à purge ; examiner la restriction/rotation des clés concernées.
- PR #3 et #4 fusionnées : typage Supabase/lint, migrations de liens TAKATAK et réponses aux avis commerçants. La migration n'est pas confirmée appliquée en production.
- PR #2 fusionnée : adaptateur HMAC de matching TAKATAK/R2F, contrôle de taille fail-closed, correction de type Deno.
- Actions GitHub du 2026-10-14 : CI principale réussie, vérification du contrat TAKATAK réussie (commits antérieurs aux travaux SEO/déploiement).
- Le test recommendationDedupe est isolé du client Supabase afin que la CI fonctionne sans fichier `.env`.
- La cible publique est qmaps.ca ; SEO et fichiers statiques mis à jour. Le domaine et l'hébergement réel ne sont **pas** vérifiés par GitHub.
- Une voie de déploiement SSH/cPanel est préparée, **désactivée tant que QMAPS_DEPLOY_ENABLED n'est pas activé et les secrets fournis**.

- Redirections Stripe protégées par liste de domaines HTTPS autorisés côté serveur ; domaine qmaps.ca utilisé par défaut, anciens domaines à ajouter uniquement après vérification.

## Étapes restantes (ne pas considérer comme terminées)

1. Confirmer où pointe réellement `qmaps.ca` (DNS, hébergeur, web root, SSL, serveur web).
2. Renseigner uniquement les secrets d'environnement GitHub / hébergeur ; ne jamais enregistrer de secrets dans le dépôt.
3. Déployer `dist/` via workflow SSH si l'hébergement est Apache/cPanel, ou adapter à l'hébergement réel.
4. Contrôler sauvegarde et application de `supabase/migrations/20261011120000_takatak_workspace_and_review_reply.sql`, puis installer les secrets des trois nouvelles Edge Functions et les déployer de façon contrôlée.
5. Réaliser un appel TAKATAK HMAC signé en préproduction, vérifier matching, espaces/tenant, données minimisées, absence de mélange entre entreprises et idempotence.
6. Vérifier Google Maps, authentification, inscription commerçants, fiches, paiements Stripe, avis, suppression de compte, portail marchand et expérience mobile.
7. Vérifier les URLs et boîtes de courriel historiques en `qmaps.app`, les corriger uniquement lorsque les nouvelles adresses sont opérationnelles.
8. Mettre à jour le GO/NO-GO et la preuve de déploiement avec une date et un SHA réels.

## Règles

Lire [AGENTS.md](../AGENTS.md), le haut de [WORKLOG.md](../WORKLOG.md), les PRs ouvertes et les workflows. Ne pas réintroduire `.env` dans Git. Ne pas déclarer un déploiement effectif à partir d'une CI de build. Ne pas coupler QMAPS directement à R2F : seul TAKATAK orchestre les décisions.
