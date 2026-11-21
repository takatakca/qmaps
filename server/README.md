# API QMAPS et PostgreSQL

La pile définie dans `compose.qmaps.yaml` utilise PostgreSQL/PostGIS et un service Node.js écrit pour QMAPS. Les 45 migrations historiques sont du SQL repris dans cette base. Les schémas locaux `auth` et `storage` conservent les références des règles SQL existantes. Les conteneurs de cette pile ne nécessitent ni compte ni logiciel serveur Supabase.

Les comptes utilisent un identifiant et un mot de passe. À l’inscription, l’API retourne une seule fois un code de récupération. Une récupération réussie remplace ce code et révoque les sessions précédentes. Les sessions expirent au bout de douze heures. Les photos PNG et JPEG sont stockées dans PostgreSQL et bénéficient de la même sauvegarde que les données. Une photo est limitée à 3 Mio, avec un quota de 20 Mio par utilisateur.

Le service expose `/v1/health`, `/v1/places`, `/v1/accounts/register`, `/v1/accounts/login`, `/v1/accounts/recover` et `/v1/accounts/logout`. Les opérations privées utilisent le jeton de session dans le champ HTTP Authorization. Les identifiants des utilisateurs et des rôles sont déterminés par le serveur. Les favoris, publications et demandes utilisent les politiques PostgreSQL du dépôt.

Pour déployer, choisir **Docker Compose** depuis le dépôt QMAPS dans Coolify, avec `/compose.qmaps.yaml`. Seul le service `qmaps-api`, port 3000, doit recevoir un domaine. Les mots de passe de PostgreSQL et de l’utilisateur applicatif restent dans les variables privées de Coolify. La CI lance la même composition avec des mots de passe éphémères et teste le cycle des comptes, l’isolation des données, les publications commerçantes et les photos.

Les routes `/v1/browser/` utilisent un cookie de session Secure, HttpOnly et SameSite=Strict. Une écriture par navigateur nécessite l’origine HTTPS QMAPS. Les comptes web et mobiles appartiennent au même répertoire. La console lit `/v1/browser/console`, réservé aux administrateurs. Pour le premier propriétaire, vérifier son identifiant auprès de lui, relever son UUID dans PostgreSQL et appliquer `server/db/grant-owner.sql` avec `psql -X -d qmaps -v owner_id=UUID -f grant-owner.sql`. Aucun privilège ne découle de l’inscription.
