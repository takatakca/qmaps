# QMAPS — File de tâches priorisée

## Statut faisant autorité — 14 octobre 2026
- **Dernier code `main` :** `328d8918a8cf6dccb249425628d5411d128b3f6e`, CI run [38624571461](https://github.com/takatakca/qmaps/actions/runs/38624571461) à revérifier.
- **CI verte la plus récente confirmée :** `f774e0af`, [run 38624432519](https://github.com/takatakca/qmaps/actions/runs/38624432519).
- **Priorité bloquante extérieure P0 :** issue [#6](https://github.com/takatakca/qmaps/issues/6) (hébergeur, DNS, accès au vrai projet Supabase QMAPS, migrations et secrets). Ne pas confondre le code CI validé avec un lancement.
- **Priorités de recette P0 :** tests SQL de modifications interdites des notes/stats/modération, tests d'isolement inter-commerces (avis/campagnes/facturation), reprise de brouillon avec catégorie/role, Stripe/webhook et géolocalisation, empreinte `qmaps-release.json` après publication.
- Les états ci-dessous reflètent des livraisons **en code uniquement** tant que les validations de production restent bloquées.


Toutes les tâches doivent être validées par des preuves, non par une déclaration.

| Priorité | État | Tâche | Critère de réussite |
|---|---|---|---|
| P0 | CODE VALIDÉ EN CI, PROD À VÉRIFIER | Vérifier TypeScript explicitement dans GitHub Actions, sans se limiter au build Vite | `bun run typecheck` passe sur HEAD et ne révèle aucune anomalie |
| P0 | CODE ÉCRIT, CI À CONTRÔLER | Achever la propagation des sélections propriétaires vers messagerie, optimisation, catégories services et publicité sponsorisée | Tous ces parcours utilisent le commerce actif et refusent un ID non possédé |
| P0 | CODE ÉCRIT, CI À CONTRÔLER | Propager le choix multi-entreprises à tous les écrans marchand, paiement compris, avec sélection par utilisateur validée côté Supabase | Choix conservé et lecture des photos/menu/billing de la bonne entreprise, aucun accès cross-merchant |
| P0 | CODE VALIDÉ EN CI, PROD À VÉRIFIER | Sélectionner plusieurs entreprises dans le portail, préserver la sélection après édition, isoler les avis par entreprise | Tests unitaires verts, bouton de sélection visible pour plusieurs entreprises, aucun résultat d'un ancien commerce après changement |
| P0 | CODE ÉCRIT, MIGRATION BLOQUÉE | Empêcher un auteur d'avis de changer sa modération, les compteurs de réactions, l'auteur ou le commerce visé | `supabase/migrations/20261014231000_guard_review_moderation_integrity.sql` appliquée, écritures non admin refusées et actions administrateur permises |
| P0 | CODE ÉCRIT, MIGRATION BLOQUÉE | Verrouiller le statut propriétaire vérifié et les agrégats des avis contre les UPDATE/INSERT commerçant | `supabase/migrations/20261014230000_protect_business_verification_and_rating_integrity.sql` appliquée sur QMAPS ; RLS refus marchand + écriture admin et rafraîchissement de note vérifiés |
| P0 | BLOQUÉ — issue #6 | Identifier l'hébergement réel de qmaps.ca, DNS/SSL, répertoire web et version en ligne | Domaine accessible en HTTPS, empreinte/version déployée vérifiée |
| P0 | TERMINÉ EN CODE, MIGRATION BLOQUÉE | Fermer les contournements par INSERT : faux lien TAKATAK, réponse d'entreprise falsifiée, attribution d'entreprise à un autre utilisateur | Migration `supabase/migrations/20261014210000_guard_inserts_and_business_owner_assignment.sql` appliquée après les précédentes, tests SQL RLS en environnement autorisé |
| P0 | TERMINÉ EN CODE, MIGRATION BLOQUÉE | Sauvegarder les nouvelles fiches commerçantes en brouillon privé, ne les rendre publiques qu'après publication confirmée | Aucun commerce nouveau actif avant dernière étape ; publication contrôlée par propriétaire et vérification SQL |
| P0 | TERMINÉ EN CODE, MIGRATION BLOQUÉE | Corriger l'insertion commerçant RLS `is_claimed=false` et supprimer la localisation Montréal par défaut lorsque les coordonnées sont inconnues | Migration `supabase/migrations/20261014220000_nullable_business_coordinates_no_fallback.sql` appliquée, nouveaux commerces sans coordonnées valides enregistrés sans faux point |
| P0 | BLOQUÉ — issue #6 | Vérifier le projet Supabase `ldvkebjfuldnemfdoted` et appliquer les migrations du 11 et du 14 octobre dans l'ordre | Sauvegarde contrôlée, migrations listées, requêtes RLS/tenant vérifiées |
| P0 | BLOQUÉ — issue #6 | Installer les secrets côté serveur et déployer les Edge Functions TAKATAK + réponse commerçant + fonctions Stripe mises à jour | Tests réels signés, propriétaire correct, cross-tenant interdit, Stripe fonctionne |
| P0 | CODE COMPLET, ACTIVATION BLOQUÉE | Activer le workflow SSH si le site utilise réellement SSH/Apache avec dossier isolé et secrets GitHub | CI success → transfert réel → HTTP et SHA déployé vérifiés |
| P1 | CODE VALIDÉ EN CI, PROD À VÉRIFIER | Remplacer la création directe d'une fausse fiche « Mon entreprise » par le formulaire réel et diriger le propriétaire vers son tableau de bord | Le raccourci n'insère aucun commerce fictif ; aucun statut revendiqué attribué silencieusement |
| P1 | CODE VALIDÉ EN CI, PROD À VÉRIFIER | Nettoyer le portail commerçant des horaires 24 h, rabais et badges fictifs ainsi que des boutons inactifs | La fiche affiche ses propres données ou un état non configuré ; actions actives ; tests rouges si retour d'éléments inventés |
| P1 | CODE VALIDÉ EN CI, PROD À VÉRIFIER | Demander explicitement la ville des fiches créées par un utilisateur au lieu d'utiliser Montréal par défaut | Le formulaire exige ville et adresse et transmet la vraie ville dans la requête |
| P1 | CODE VALIDÉ EN CI, PROD À VÉRIFIER | Rendre fonctionnels le filtre de note, « Lire plus » et l'ajout de photo depuis les avis publics ; retirer les compteurs et boutons fictifs | Filtre et texte étendu changent visiblement, clic photo mène au vrai formulaire |
| P0 | CODE ÉCRIT, CI À CONTRÔLER | Reprendre une fiche commerçante privée après interruption, contrôler les catégories et empêcher la publication incomplète | Récupération du brouillon, catégorie réellement enregistrée, erreurs visibles et publication uniquement après vérification |
| P0 | CODE ÉCRIT, CI À CONTRÔLER | Corriger les avis commerçants en échec réseau : ne pas présenter zéro avis, permettre un nouvel essai, bloquer les avis du mauvais commerce dans l'aperçu | Erreur explicite et retry, aucune fuite d'affichage inter-entreprise |
| P0 | CODE ÉCRIT, CI À CONTRÔLER | Empêcher les réponses réseau publicitaires obsolètes de révéler des campagnes d'une autre entreprise, et afficher les erreurs SQL | Les requêtes périmées sont rejetées, les campagnes sont filtrées selon l'entreprise chargée, la panne ne devient pas « aucune campagne » |
| P1 | CODE ÉCRIT, CI À CONTRÔLER | Remplacer le simulateur publicitaire non persistant par les campagnes réelles, statuts et budgets visibles seulement par leur propriétaire | Liste issue de sponsored_campaigns, aucune fausse campagne active ou performance inventée |
| P1 | À FAIRE | Vérification mobile/tablette, Google Maps, inscription, avis, profils, paiements, suppression de compte, alertes et parcours marchand | Rapport de recette avec preuves et erreurs corrigées |
| P1 | À FAIRE | Contrôler les anciennes URLs et courriels `qmaps.app`, dépendances historiques Lovable et remplacer sans régression | Services et courriels fonctionnels ; aucune dépendance indispensable laissée sans solution |
| P1 | À FAIRE | Réviser avertissements RLS, déclencheurs privilégiés et logs d'accès des services | Audit sécurité et tests d'isolement |
| P2 | À FAIRE | SEO serveur pour pages entreprises et sitemap dynamique sans données privées | Robots/canonical valides, indexation publique vérifiée |

Liens : [PROJECT_STATUS.md](PROJECT_STATUS.md), [DEPLOYMENT.md](DEPLOYMENT.md), [AGENT_HANDOFF.md](AGENT_HANDOFF.md). La vérification des résultats GitHub Actions est obligatoire après chaque push.

CI dernière version de code : `23aa06e4e38dafc8be6cf30e59eddf426cf533ac`, https://github.com/takatakca/qmaps/actions/runs/38615907405 (success). Les validations de production restent ouvertes dans [issue #6](https://github.com/takatakca/qmaps/issues/6).
