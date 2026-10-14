# QMAPS — État du projet

Dernière mise à jour : 2026-10-14. Dépôt : `takatakca/qmaps`, publication GitHub : `main`.

## Architecture vérifiée
- React 18, TypeScript, Vite, Tailwind, shadcn/ui ; Supabase Auth, PostgreSQL/RLS et Edge Functions ; Stripe pour les abonnements.
- QMAPS est une application autonome de l'écosystème GROUPE TAKATAK. TAKATAK coordonne l'identité maître et le routage des besoins R2F. Les entreprises ne doivent accéder qu'à leurs données.
- Les PR #2–#5 ont été fusionnées : typage/lint, adaptation R2F via HMAC, association à un espace TAKATAK, réponses aux avis, protection des fichiers d'environnement.
- Une interface commerçant existe ; la sélection multi-entreprises et le rafraîchissement des avis ont été améliorés dans la présente reprise.

## Validation technique
- Dernier `main` constaté avant cette reprise : `60fcdb8ba60559bc3986c5f9b6a9574390ce0cc5`.
- CI principale et contrat TAKATAK : GitHub Actions **réussis sur ce SHA**.
- La présente modification doit recevoir son propre résultat CI après le push. Les résultats précédents ne garantissent pas ce nouveau commit.
- Aucune preuve de tests fonctionnels complets en environnement QMAPS réel n'a été trouvée.

## Production
- Domaine cible : `qmaps.ca`. Le 14 octobre 2026, la résolution DNS n'a pas réussi depuis l'environnement d'inspection et le navigateur distant n'a pas pu atteindre le site. Cela ne prouve pas une panne globale, mais **aucun déploiement n'a été vérifié**.
- `.github/workflows/qmaps-ssh-deploy.yml` : pipeline préparé, volontairement ignoré tant que `QMAPS_DEPLOY_ENABLED=true` et les secrets SSH/environnement ne sont pas configurés.
- Projet Supabase du code : `ldvkebjfuldnemfdoted`. Il n'est pas présent parmi les projets accessibles dans la connexion Supabase disponible au 14 octobre 2026 ; base et Edge Functions non vérifiées en production.
- Migrations du 11 octobre (champ espace TAKATAK / réponse aux avis) et du 14 octobre (protections des colonnes) : **code en dépôt, application en production non confirmée**.

## Verdict de livraison
**Code intégré / CI automatisée à confirmer sur HEAD ; publication fonctionnelle 100 % NON démontrée.** Suivre [TASK_QUEUE.md](TASK_QUEUE.md), [AGENT_HANDOFF.md](AGENT_HANDOFF.md), [DEPLOYMENT.md](DEPLOYMENT.md) et [DECISIONS.md](DECISIONS.md). Ne pas confondre un GO issu du build avec un GO opérationnel.
