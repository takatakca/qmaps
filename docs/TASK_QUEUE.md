# QMAPS — File de tâches priorisée

Toutes les tâches doivent être validées par des preuves, non par une déclaration.

| Priorité | État | Tâche | Critère de réussite |
|---|---|---|---|
| P0 | TERMINÉ EN CODE, CI À RECONTRÔLER | Sélectionner plusieurs entreprises dans le portail, préserver la sélection après édition, isoler les avis par entreprise | Tests unitaires verts, bouton de sélection visible pour plusieurs entreprises, aucun résultat d'un ancien commerce après changement |
| P0 | BLOQUÉ PAR ACCÈS | Identifier l'hébergement réel de qmaps.ca, DNS/SSL, répertoire web et version en ligne | Domaine accessible en HTTPS, empreinte/version déployée vérifiée |
| P0 | TERMINÉ EN CODE, MIGRATION BLOQUÉE | Fermer les contournements par INSERT : faux lien TAKATAK, réponse d'entreprise falsifiée, attribution d'entreprise à un autre utilisateur | Migration `supabase/migrations/20261014210000_guard_inserts_and_business_owner_assignment.sql` appliquée après les précédentes, tests SQL RLS en environnement autorisé |
| P0 | BLOQUÉ PAR ACCÈS | Vérifier le projet Supabase `ldvkebjfuldnemfdoted` et appliquer les migrations du 11 et du 14 octobre dans l'ordre | Sauvegarde contrôlée, migrations listées, requêtes RLS/tenant vérifiées |
| P0 | BLOQUÉ PAR ACCÈS | Installer les secrets côté serveur et déployer les Edge Functions TAKATAK + réponse commerçant + fonctions Stripe mises à jour | Tests réels signés, propriétaire correct, cross-tenant interdit, Stripe fonctionne |
| P0 | CODE COMPLET, ACTIVATION BLOQUÉE | Activer le workflow SSH si le site utilise réellement SSH/Apache avec dossier isolé et secrets GitHub | CI success → transfert réel → HTTP et SHA déployé vérifiés |
| P1 | TERMINÉ EN CODE, CI À VÉRIFIER | Remplacer la création directe d'une fausse fiche « Mon entreprise » par le formulaire réel et diriger le propriétaire vers son tableau de bord | Le raccourci n'insère aucun commerce fictif ; aucun statut revendiqué attribué silencieusement |
| P1 | TERMINÉ EN CODE, CI À VÉRIFIER | Nettoyer le portail commerçant des horaires 24 h, rabais et badges fictifs ainsi que des boutons inactifs | La fiche affiche ses propres données ou un état non configuré ; actions actives ; tests rouges si retour d'éléments inventés |
| P1 | À FAIRE | Vérification mobile/tablette, Google Maps, inscription, avis, profils, paiements, suppression de compte, alertes et parcours marchand | Rapport de recette avec preuves et erreurs corrigées |
| P1 | À FAIRE | Contrôler les anciennes URLs et courriels `qmaps.app`, dépendances historiques Lovable et remplacer sans régression | Services et courriels fonctionnels ; aucune dépendance indispensable laissée sans solution |
| P1 | À FAIRE | Réviser avertissements RLS, déclencheurs privilégiés et logs d'accès des services | Audit sécurité et tests d'isolement |
| P2 | À FAIRE | SEO serveur pour pages entreprises et sitemap dynamique sans données privées | Robots/canonical valides, indexation publique vérifiée |

Liens : [PROJECT_STATUS.md](PROJECT_STATUS.md), [DEPLOYMENT.md](DEPLOYMENT.md), [AGENT_HANDOFF.md](AGENT_HANDOFF.md). La vérification des résultats GitHub Actions est obligatoire après chaque push.
