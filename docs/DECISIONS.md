# QMAPS — Registre des décisions

| Date | Décision | Motif et conséquence |
|---|---|---|
| 2026-10-14 | Continuer `takatakca/qmaps` sur `main` sans reconstruire de zéro | Code existant, contrats et travaux d'autres agents conservés |
| 2026-10-14 | QMAPS conserve ses écrans et permissions propres, TAKATAK reste maître identité/routage | Éviter mélange des locataires et dépendances directes entre produits |
| 2026-10-14 | Limiter le matching TAKATAK à un adaptateur HMAC et données publiques minimales | Pas de service-role exposée au client ni d'accès R2F direct à QMAPS |
| 2026-10-14 | Les réponses commerçant nécessitent JWT, contrôle serveur du propriétaire et garde-fous SQL | Ne jamais autoriser un auteur d'avis à usurper une réponse |
| 2026-10-14 | Garder le déploiement SSH optionnel jusqu'à validation de l'hébergement | Éviter d'écraser un autre site, ne pas publier des secrets ou migrer une mauvaise base |
| 2026-10-14 | Les avis dans un portail multi-entreprises sont invalidés lors du changement d'entreprise | Ne pas afficher les résultats asynchrones de la mauvaise entreprise |
| 2026-10-14 | Ne pas déclarer `qmaps.ca` actif sans preuve DNS/SSL/HTTP et SHA | Pas d'affirmations de livraison inventées |
| 2026-10-14 | Les cinq fichiers de suivi vivent dans `docs/` ; `.agent/CONTINUATION.md` reste un pointeur de compatibilité | Relève autonome sans duplication non maîtrisée |

**Écart connu :** des documents anciens utilisent `qmaps.app` et des mécanismes historiques Lovable ; ils ne sont pas automatiquement convertis lorsque les domaines, courriels et intégrations de remplacement ne sont pas vérifiés.
