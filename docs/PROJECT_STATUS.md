# QMAPS — État du projet

## État au 15 octobre 2026 — reprise technique
- GitHub `main` : code de cette reprise poussé, dernière révision avant l'état `2af6db645918c457b3972c6bed50b5c641d81290`. La CI auth est vérifiée verte au SHA `f61a32f5` (run 38803826151) et la CI avec validation de YAML au SHA `7126d0df` (run 38804537975). Les commits ultérieurs demandent leur propre vérification.
- Sécurité : permission `admin/merchant` liée à l'identité de session, réponses de rôles obsolètes rejetées, contrôle de l'écriture de droits avant navigation commerçant ou publication d'une fiche.
- Qualité : la ville de l'inscription commerçant n'est plus automatiquement « Montréal » ; plus de promesse photographique chiffrée non étayée.
- Déploiement : protection CI obligatoire sur lancement manuel, chemin SSH réduit à une racine spécifique, analyse syntaxique YAML en CI.
- **Production réelle : toujours non prouvée.** Cible Supabase QMAPS inaccessible depuis la connexion, domaine HTTPS non accessible depuis l'outil, SSH désactivé. Ne pas présenter les migrations ou fonctions comme installées.



## Appels à l'action promotionnels — 15 octobre 2026
L'ancien éditeur CTA simulait un rabais et permettait des choix non persistés. Il a été remplacé par un état d'indisponibilité clair et des liens vers les fonctions réellement câblées. L'implémentation du véritable système CTA publicitaire reste **inachevée** et dépend de la plateforme de publication/paiement autorisée.



## Guest Manager — 15 octobre 2026
Le formulaire qui affichait faussement « demande envoyée » et les chiffres/tarifs/témoignages non vérifiés ont été supprimés. Le produit Guest Manager est marqué comme non disponible et n'a pas de moteur de réservation actif. Son développement complet reste une tâche bloquée par les exigences et services réels ; cette correction ne constitue pas un lancement.



## Sécurisation facturation — 15 octobre 2026
Protection de la sélection d'entreprise dans le chargement des abonnements, erreurs explicites et refus d'un paiement pendant l'incertitude du statut. Suppression des montants et dates d'échéance fictifs. Livraison en code, tests réels Stripe non exécutés (accès QMAPS absent).

## Correction interface — 15 octobre 2026
L'interface des avis commerçants ne présente plus de politique de classement non étayée ni de boutons inertes, et renvoie le commerçant vers l'édition réelle de sa fiche. Test React ajouté. Les vérifications de production restent bloquées par issue #6.



## État de reprise faisant autorité — 14 octobre 2026, fin de session
- **Repository et branche :** `takatakca/qmaps`, `main`.
- **Dernier commit de code poussé :** `328d8918a8cf6dccb249425628d5411d128b3f6e`, récupération de brouillon marchand et contrôle du rôle professionnel avant publication.
- **CI dernière version confirmée avant celui-ci :** `f774e0af203026e1f4b0dec172bcd87baf65f8c7`, GitHub Actions run [38624432519](https://github.com/takatakca/qmaps/actions/runs/38624432519) : succès. CI de `328d8918` déclenchée dans [38624571461](https://github.com/takatakca/qmaps/actions/runs/38624571461), résultat à revérifier à la prochaine lecture.
- **Code intégré depuis la dernière reprise :** deux migrations additives de sécurité (vérification propriétaire / agrégats de notes ; modération des avis / anti-falsification), sélection multi-entreprises étendue aux sous-écrans et à la facturation, tableau publicitaire alimenté par `sponsored_campaigns`, protection des réponses réseau périmées, gestion d'erreurs des avis et reprise de brouillon onboarding.
- **En production : NON vérifiée.** Les nouveaux fichiers SQL ne sont **pas appliqués**, les nouvelles Edge Functions **non confirmées déployées** sur QMAPS, le workflow SSH est `skipped` et la résolution/SSL de `qmaps.ca` n'est pas établie dans l'environnement disponible.
- **Blocages réels :** absence d'accès au projet Supabase `ldvkebjfuldnemfdoted` (permission refusée), host/docroot/secret de déploiement QMAPS inconnus. Ne pas publier sur un autre site ni migrer un autre projet.
- **Suivi P0 :** [issue #6](https://github.com/takatakca/qmaps/issues/6). Une CI verte ou un rapport Go/No-Go de build **ne remplacent pas** la preuve d'une livraison en ligne.

Les sections suivantes documentent l'historique des travaux précédents et restent utiles, mais le présent état prévaut en cas de divergence.


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
- Nouvelles migrations de sécurité en code : verrouillage des badges vérifiés et moyennes commerçants, des champs de modération et de la réattribution des avis. **Non appliquées/confirmées dans QMAPS réel**.
- Migrations du 11 octobre (association TAKATAK / réponse commerçant) et du 14 octobre (guards UPDATE puis INSERT et coordonnées sans valeurs fictives) : **code en dépôt, application en production non confirmée**.

## Verdict de livraison
**Code intégré et CI vérifiée sur le dernier commit de code `23aa06e4` ; publication fonctionnelle 100 % NON démontrée.** Suivre [TASK_QUEUE.md](TASK_QUEUE.md), [AGENT_HANDOFF.md](AGENT_HANDOFF.md), [DEPLOYMENT.md](DEPLOYMENT.md) et [DECISIONS.md](DECISIONS.md). Ne pas confondre un GO issu du build avec un GO opérationnel.
