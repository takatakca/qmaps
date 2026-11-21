# Exploiter QMAPS dans Coolify

Le site, les migrations et les fonctions de QMAPS sont versionnés dans ce dépôt. Dans le projet QMAPS de Coolify, la ressource applicative sert le site statique. La pile de données utilise PostgreSQL, GoTrue, PostgREST, Storage, le moteur de fonctions et Studio. L’hébergement consomme les ressources du serveur existant.

## Installation et mise à jour

1. Déployer la pile de données avec le modèle Supabase de Coolify. Garder PostgreSQL, les services de stockage et le moteur de fonctions sur le réseau privé du projet. Seule la passerelle a besoin du domaine HTTPS.
2. Dans le conteneur PostgreSQL, télécharger une révision GitHub identifiée par son SHA complet. Exécuter `PGHOST=/var/run/postgresql sh ops/self-host/install.sh` depuis cette révision. Le script applique chaque migration en transaction, conserve son empreinte et reprend après une interruption. Une seconde exécution conserve les lignes existantes. Les trois fiches « QMAPS Démo » appartiennent au nouvel environnement.
3. Installer les répertoires de `supabase/functions/` dans le montage `/home/deno/functions/` du moteur de fonctions. Conserver son gestionnaire de routage `main`. Redémarrer le moteur de fonctions et vérifier une fonction sans effet de bord.
4. Dans les variables de **compilation** du site, régler `VITE_SUPABASE_URL` sur la passerelle et `VITE_SUPABASE_PUBLISHABLE_KEY` sur sa clé publique de rôle `anon`. Utiliser `VITE_SUPABASE_PROJECT_ID=qmaps-coolify`. Le lien facultatif `VITE_QMAPS_STUDIO_URL` mène au Studio protégé. Google OAuth se présente uniquement avec `VITE_QMAPS_GOOGLE_AUTH=true` et un fournisseur Google configuré.
5. Déployer la même révision. Vérifier le SHA de `/qmaps-release.json`, le catalogue de Montréal, les favoris, les parcours commerçant et le contrôle d’accès de `/console`. Conserver l’image précédente dans Coolify pour revenir à cette version en cas d’incident.

## Propriétaire et intégrations

Le propriétaire crée un compte personnel et confirme son adresse. Un opérateur Coolify vérifie son identité et relève son UUID dans le Studio privé. Dans le conteneur de la base, exécuter `sh ops/self-host/grant-owner.sh UUID`. Se reconnecter à `/console`. Le rôle administrateur n’est jamais attribué à partir d’un domaine de courriel ou d’une inscription publique.

Configurer le domaine de retour de GoTrue et son SMTP pour envoyer les confirmations et réinitialisations de mot de passe. Les SMS, paiements et appels Google exigent leurs propres identifiants. La modération travaille par règles par défaut. Son extension facultative utilise un service choisi par l’opérateur avec `AI_REVIEW_ANALYSIS_ENABLED`, `QMAPS_AI_URL`, `QMAPS_AI_MODEL` et `QMAPS_AI_API_KEY`.

Conserver les secrets dans Coolify. Pour restaurer la plateforme, il faut les données PostgreSQL, les objets du stockage et la configuration opérateur. Garder les sauvegardes privées et tester la restauration sur une instance distincte avant de remplacer des données.

## Vérification sur le serveur

Exécuter `node verify-live.mjs --qmaps-test` dans le conteneur Studio à partir du fichier `ops/self-host/verify-live.mjs` de la révision déployée. Le test crée trois comptes fictifs déjà confirmés, connecte chaque compte par mot de passe et vérifie la publication, la liste d’attente, l’isolation des collections et le stockage. Il supprime ses propres objets, son commerce et ses utilisateurs à la fin. Les confirmations par courriel se testent séparément avec une boîte autorisée.

## Production QMAPS.ca

Le domaine de la passerelle est `https://qmaps.ca/qmaps-api`. La route Coolify envoie ce préfixe vers le port 8000 de Kong. Les autres chemins de QMAPS.ca servent l’application. GoTrue utilise `https://qmaps.ca` comme site et la passerelle comme adresse externe. Le Studio privé de Coolify conserve son point d’accès distinct.

Les sauvegardes locales de la base et du répertoire des objets sont programmées chaque jour, avec sept archives par tâche. Les deux premières exécutions ont réussi. Pour consulter une exécution, ouvrir la ressource de données QMAPS dans Coolify, puis **Backups**.

### Répéter une restauration

Dans le conteneur PostgreSQL d’une pile QMAPS initialisée avec la même image, lancer `sh ops/self-host/rehearse-restore.sh /chemin/vers/sauvegarde.dump`. Le script crée une base temporaire, restaure les objets, les propriétaires et les autorisations, puis teste la lecture du catalogue et le refus du courrier privé avec le rôle visiteur. Il traite le cas du routeur GraphQL fourni par l’image. La base temporaire est supprimée en fin d’essai. Le 21 novembre 2026, la copie du premier instantané présentait trois fiches visibles et 46 étapes d’installation consignées, conformément à son contenu au moment de la sauvegarde.
