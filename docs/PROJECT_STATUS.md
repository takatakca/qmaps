# QMAPS — État du projet

Dernière mise à jour : 2026-10-14. Dépôt : `takatakca/qmaps`, publication GitHub : `main`.

## Architecture vérifiée
- React 18, TypeScript, Vite, Tailwind, shadcn/ui ; Supabase Auth, PostgreSQL/RLS et Edge Functions ; Stripe pour les abonnements.
- QMAPS est une application autonome de l'écosystème GROUPE TAKATAK. TAKATAK coordonne l'identité maître et le routage des besoins R2F. Les entreprises ne doivent accéder qu'à leurs données.
- Les PR #2–#5 ont été fusionnées : typage/lint, adaptation R2F via HMAC, association à un espace TAKATAK, réponses aux avis, protection des fichiers d'environnement.
- Une interface commerçant existe ; la sélection multi-entreprises, le rafraîchissement des avis, la vérification des horaires réels et la suppression des actions fictives ont été améliorés.
- L'onboarding exige des données réelles, respecte le statut de revendication non vérifié et garde un brouillon privé jusqu'à publication explicite. Les avis publics ont filtre par note et développement du texte.
- Suivi GitHub P0 de la production : [issue #6](https://github.com/takatakca/qmaps/issues/6).

## Validation technique
- **Dernier commit de code testé avant la présente relève :** `23aa06e4e38dafc8be6cf30e59eddf426cf533ac`.
- **GitHub Actions CI réussie sur ce SHA :** https://github.com/takatakca/qmaps/actions/runs/38615907405 — lint, TypeScript typecheck, tests Vitest, contrôles de lancement, build et GO/NO-GO.
- Contrat TAKATAK Deno validé sur les modifications des fonctions serveur précédemment poussées. Chaque nouveau commit doit avoir sa CI vérifiée séparément.
- Aucune preuve de tests fonctionnels complets en environnement QMAPS réel n'a été trouvée.

## Production
- Domaine cible : `qmaps.ca`. Le 14 octobre 2026, la résolution DNS n'a pas réussi depuis l'environnement d'inspection et le navigateur distant n'a pas pu atteindre le site. Cela ne prouve pas une panne globale, mais **aucun déploiement n'a été vérifié**.
- `.github/workflows/qmaps-ssh-deploy.yml` : pipeline préparé, volontairement ignoré tant que `QMAPS_DEPLOY_ENABLED=true` et les secrets SSH/environnement ne sont pas configurés.
- Projet Supabase du code : `ldvkebjfuldnemfdoted`. Il n'est pas présent parmi les projets accessibles dans la connexion Supabase disponible au 14 octobre 2026 ; base et Edge Functions non vérifiées en production.
- Migrations du 11 octobre (association TAKATAK / réponse commerçant) et du 14 octobre (guards UPDATE puis INSERT et coordonnées sans valeurs fictives) : **code en dépôt, application en production non confirmée**.

## Verdict de livraison
**Code intégré et CI vérifiée sur le dernier commit de code `23aa06e4` ; publication fonctionnelle 100 % NON démontrée.** Suivre [TASK_QUEUE.md](TASK_QUEUE.md), [AGENT_HANDOFF.md](AGENT_HANDOFF.md), [DEPLOYMENT.md](DEPLOYMENT.md) et [DECISIONS.md](DECISIONS.md). Ne pas confondre un GO issu du build avec un GO opérationnel.
