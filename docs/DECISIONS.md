# QMAPS — Registre des décisions

| Date | Décision | Motif et conséquence |
|---|---|---|
| 2026-10-15 | Ne jamais recycler un abonnement d'une entreprise dans l'affichage d'une autre ; ne pas inventer solde ou prochaine facture | Résultats Supabase vérifiés par businessId et requête, erreur affichée et paiement bloqué jusqu'à vérification |
| 2026-10-15 | Ne pas afficher comme établi un tri d'avis « recommandés/non recommandés » sans donnée ou algorithme réel | Présenter le nombre réel d'avis reçus et une action de configuration vérifiable ; conserver les réponses via Edge Function |
| 2026-10-15 | Exiger aussi une CI réussie lors d'un déploiement SSH manuel et un docroot dédié | Une opération manuelle ne contourne pas la validation ni n'écrit à la racine du serveur |
| 2026-10-15 | Lier toute permission client à l'ID courant de session et invalider les réponses de rôles anciennes | Évite la conservation d'un menu d'administration ou commerçant entre deux comptes ; vérification serveur RLS maintenue |
| 2026-10-14 | Continuer `takatakca/qmaps` sur `main` sans reconstruire de zéro | Code existant, contrats et travaux d'autres agents conservés |
| 2026-10-14 | QMAPS conserve ses écrans et permissions propres, TAKATAK reste maître identité/routage | Éviter mélange des locataires et dépendances directes entre produits |
| 2026-10-14 | Limiter le matching TAKATAK à un adaptateur HMAC et données publiques minimales | Pas de service-role exposée au client ni d'accès R2F direct à QMAPS |
| 2026-10-14 | Les réponses commerçant nécessitent JWT, contrôle serveur du propriétaire et garde-fous SQL | Ne jamais autoriser un auteur d'avis à usurper une réponse |
| 2026-10-14 | Garder le déploiement SSH optionnel jusqu'à validation de l'hébergement | Éviter d'écraser un autre site, ne pas publier des secrets ou migrer une mauvaise base |
| 2026-10-14 | Mémoriser l'identifiant de commerce sélectionné en session par utilisateur et le revérifier côté Supabase | Aucune autorisation par stockage local ; le paiement et les écrans secondaires ciblent l'entreprise réellement possédée |
| 2026-10-14 | Les avis dans un portail multi-entreprises sont invalidés lors du changement d'entreprise | Ne pas afficher les résultats asynchrones de la mauvaise entreprise |
| 2026-10-14 | Préserver les migrations déjà publiées et ajouter une migration correctrice pour protéger aussi INSERT | Les premiers garde-fous concernaient UPDATE seulement ; les déclencheurs INSERT empêchent l'usurpation avant une mise en production |
| 2026-10-14 | L'onboarding ne marque plus les nouveaux commerçants comme propriétaires vérifiés ; géolocalisation nulle plutôt que point Montréal fictif | Conformité RLS et honnêteté des cartes ; migration additive, sans suppression de données historiques |
| 2026-10-14 | Réserver is_claimed et les notes agrégées à l'administration et aux processus serveur, y compris lors d'un UPDATE | Empêcher un propriétaire de s'attribuer le badge vérifié ou de fabriquer sa moyenne d'avis sans modifier les autres champs légitimes |
| 2026-10-14 | Réserver aux admins/services les champs de modération des avis, compteurs de réactions et la réattribution d'identité | L'auteur peut corriger texte/note mais ne peut ni réafficher un avis caché ni déplacer un avis pour manipuler une moyenne |
| 2026-10-14 | Afficher les campagnes sponsorisées réelles au lieu du simulateur non persistant et des chiffres publicitaires inventés | Une activation ou un revenu ne peut être revendiqué qu'après stockage, validation et observation des événements |
| 2026-10-14 | Reprendre les brouillons de fiche privée et vérifier les catégories et droits avant publication | Ne pas transformer une interruption/erreur de base en profil faussement publié ni perdre les progrès des commerçants |
| 2026-10-14 | Ne pas déclarer `qmaps.ca` actif sans preuve DNS/SSL/HTTP et SHA | Pas d'affirmations de livraison inventées |
| 2026-10-14 | Élever TypeScript en étape bloquante de CI et suivre la production en issue #6 | Une compilation Vite seule ne contrôle pas les types ; les prérequis externes ont un suivi vérifiable |
| 2026-10-14 | Les cinq fichiers de suivi vivent dans `docs/` ; `.agent/CONTINUATION.md` reste un pointeur de compatibilité | Relève autonome sans duplication non maîtrisée |

**Écart connu :** des documents anciens utilisent `qmaps.app` et des mécanismes historiques Lovable ; ils ne sont pas automatiquement convertis lorsque les domaines, courriels et intégrations de remplacement ne sont pas vérifiés.
