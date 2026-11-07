# QMAPS — Registre des décisions

## Livraison séquentielle — Codex, 2026-11-07 UTC

Source de départ : main `6e73f0f68c1791a3c34c34971b3c6c66f9b0a3cc`. Intégrations successives : PR #7 KLEAN (note historique), REVEW `0fd418b8ac6ed6bedc77520ce8c288b72bdeae68` (API avis), puis SEO `63ef0b53800b0e7857fd0cd9d150dd7ad5a716d0`. Le WORKLOG conserve les notes des agents; aucun squash ni réécriture de leur historique.

- API : lectures, visibilité des IDs suivis et réponses liées au client/commerce actif, avis visibles/trusted non masqués, comparaison atomique du lien existant. Authentification serveur minimale 32 caractères et corps limité. Aucun secret ni migration ajouté. Ces fonctions ne sont PAS déployées par un build du frontend.
- SEO : métadonnées/canonique de production, recherche non indexable, sitemap de pages publiques, générateur séparé `npm run sitemap:generate`. La génération de données exige un accès explicite au vrai catalogue et n'est pas une condition réseau du build. Routes privées `/projects` et `/search` exclues. Icônes PNG existantes conservées.
- Conflits Stripe : contrôle actuel `resolveCheckoutReturnOrigin` conservé intégralement (HTTPS/origines exactes); l'ancien helper concurrent et ses tests ne sont pas introduits. Tests actifs des retours conservés.
- Le build produit désormais `qmaps-release.json` depuis SOURCE_COMMIT, GITHUB_SHA ou le HEAD Git complet; une valeur fournie invalide échoue. Cela permet la même preuve de version via Coolify et SSH.
- Cible retrouvée : application Coolify 21, UUID `89fbfywlq5aarvqrgbjs2jwp`, contrôleur sur `31.220.96.134`, **destination effective `209.145.49.63`** malgré le nom historique « vps2 ». Nixpacks statique `/dist`, domaines qmaps.ca/www. Ancien conteneur `f48e9db` en service, déploiement du 26 octobre. Ne pas changer la destination sur la base de son nom.
- Avant livraison, le site répond 200 mais `/qmaps-release.json` retourne du HTML SPA : ce n'est pas une preuve de version. Le pipeline SSH reste skipped. Vérifier CI exacte avant toute publication native et consigner le reçu dans la PR/issue #6.
- Supabase `ldvkebjfuldnemfdoted` absent des cinq projets connectés. Pas de migration, de fonction, de paiement ni de réponse réelle publiée. Ne pas utiliser un autre projet.

Branches préservées : outbox Claude non intégré car sélection/backfill insuffisants pour le contrat actuel (hidden_at et statuts visible/trusted, événements de suppression à réconcilier). `seo-legal-kit` est une proposition de consentement/SEO distincte avec sept conflits et préférences email non persistées; aucun suivi ajouté/activé ici. Handoff sécurité ancien : suppression .env déjà effective sur main; note historique périmée. Instructions git owner-main anciennes non substituées aux consignes actuelles et à l'autorisation explicite de fusion du propriétaire.

Validation de la combinaison API/SEO : 451 tests passent, typecheck et build passent; lint 0 erreur, 44 avertissements existants. Tests du nouveau manifeste et CI exacte finale à confirmer dans le reçu GitHub. Source et production sont deux preuves séparées.

Signature : Codex — ChatGPT Work.

---

| Date | Décision | Motif et conséquence |
|---|---|---|
| 2026-10-16 | Ne pas divulguer publiquement les catégories associées aux brouillons marchands | Les fiches non actives restent visibles seulement au propriétaire et à l'admin; liste publique conservée pour les commerces publiés |
| 2026-10-15 | Ne pas afficher de Guest Manager factice, de tarifs/témoignages non vérifiés ni de fausse confirmation d'envoi | Présenter l'état non lancé et renvoyer vers le contact existant, développer le backend seulement avec une vraie intégration |
| 2026-10-15 | Corriger les villes présélectionnées sans preuve et les chiffres de conversion photographique inventés | Les commerçants saisissent leur ville réelle et voient uniquement des messages fondés |
| 2026-10-15 | Parser le YAML des workflows avant la compilation en CI | Prévenir une publication automatisée qui devient invalide malgré des tests frontend verts |
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
