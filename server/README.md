# API QMAPS et PostgreSQL

La pile définie dans `compose.qmaps.yaml` utilise PostgreSQL/PostGIS et un service Node.js écrit pour QMAPS. Les 45 migrations historiques sont du SQL repris dans cette base. Les schémas locaux `auth` et `storage` conservent les références des règles SQL existantes. Les conteneurs de cette pile ne nécessitent ni compte ni logiciel serveur Supabase.

Les comptes utilisent un identifiant et un mot de passe. À l’inscription, l’API retourne une seule fois un code de récupération. Une récupération réussie remplace ce code et révoque les sessions précédentes. Les sessions expirent au bout de douze heures. Les photos PNG et JPEG sont stockées dans PostgreSQL et bénéficient de la même sauvegarde que les données. Une photo est limitée à 3 Mio, avec un quota de 20 Mio par utilisateur.

Le service expose `/v1/health`, `/v1/places`, `/v1/accounts/register`, `/v1/accounts/login`, `/v1/accounts/recover` et `/v1/accounts/logout`. Les opérations privées utilisent le jeton de session dans le champ HTTP Authorization. Les identifiants des utilisateurs et des rôles sont déterminés par le serveur. Les favoris, publications et demandes utilisent les politiques PostgreSQL du dépôt.

Pour déployer, choisir **Docker Compose** depuis le dépôt QMAPS dans Coolify, avec `/compose.qmaps.yaml`. Seul le service `qmaps-api`, port 3000, doit recevoir un domaine. Les mots de passe de PostgreSQL et de l’utilisateur applicatif restent dans les variables privées de Coolify. La CI lance la même composition avec des mots de passe éphémères et teste le cycle des comptes, l’isolation des données, les publications commerçantes et les photos.

Les routes `/v1/browser/` utilisent un cookie de session Secure, HttpOnly et SameSite=Strict. Une écriture par navigateur nécessite l’origine HTTPS QMAPS. Les comptes web et mobiles appartiennent au même répertoire. La console lit `/v1/browser/console`, réservé aux administrateurs. Pour le premier propriétaire, vérifier son identifiant auprès de lui, relever son UUID dans PostgreSQL et appliquer `server/db/grant-owner.sql` avec `psql -X -d qmaps -v owner_id=UUID -f grant-owner.sql`. Aucun privilège ne découle de l’inscription.

### Fiches à proximité

`GET /v1/directory/nearby?lat=45.509&lng=-73.554&limit=6` et sa route navigateur utilisent les mêmes règles de visibilité que l’annuaire. Ils renvoient les fiches géolocalisées à 10 km ou moins, classées par distance en mètres, puis par identifiant. La limite par défaut est 6 et le maximum est 24. La réponse contient `items`, un `distance_meters` pour chaque fiche et `next: null`. Le filtre spatial s’appuie sur l’index PostGIS existant. Aucune migration de schéma n’est nécessaire.

Déployer l’API en premier. Vérifier un HTTP 200 JSON sur la route `/api/v1/browser/directory/nearby` de chacun des domaines QMAPS avec les coordonnées et la limite ci-dessus. Basculer ensuite la rangée web « À proximité ». Une route 404 ne constitue pas un catalogue vide et ne valide pas la bascule.

### Résultats de recherche paginés

`GET /v1/directory/results` et `GET /v1/browser/directory/results` renvoient `{items, next}`. Les résultats sont classés sur l’ensemble de la recherche avant pagination, avec l’identifiant comme départage. `limit` accepte 1 à 48 fiches et vaut 24 par défaut. Le paramètre `sort` accepte `recommended`, `rating`, `reviews`, `newest` et `distance`. Les filtres `q`, `city`, `category`, `match`, `price` et `rating` conservent les règles de l’annuaire. Les paramètres `service` sont répétables et exigent que tous les services soient offerts. `open=1` évalue l’ouverture à l’heure du Québec (`America/Toronto`) et tient compte des horaires spéciaux et de ceux qui dépassent minuit.

`lat` et `lng` sont nécessaires pour le tri par distance et pour appliquer un rayon de 1, 3, 5, 10, 25 ou 50 km. Quand les deux sont fournis, la réponse donne aussi une distance arrondie au mètre, ou `null` pour une fiche sans position. Sans rayon, ces fiches arrivent après les fiches géolocalisées dans le tri par distance.

Transmettre `next` tel quel dans `after` avec les mêmes filtres, le même tri et la même session. Un curseur invalide renvoie HTTP 400. Un curseur employé avec d’autres filtres, un autre tri ou un autre compte renvoie HTTP 409 et la recherche doit repartir de la première page. Seul `next: null` signifie que la liste est épuisée. Avec les filtres de service ou d’ouverture, une page peut être vide et contenir un curseur de continuation. Les données et l’ouverture sont évaluées à chaque requête, ce qui peut faire évoluer les résultats entre deux pages.

## Sauvegarde et récupération

La tâche quotidienne Coolify exécute `sh /opt/qmaps/server/db/backup.sh` dans
`qmaps-db`. Le volume dédié conserve les sept derniers fichiers PostgreSQL au
format custom, y compris les comptes et les médias. Pour vérifier un fichier
dans une base temporaire, utiliser `sh /opt/qmaps/server/db/verify-backup.sh /var/backups/qmaps/<archive>.dump`.
La restauration de vérification s’effectue sur le même cluster pour réutiliser
les rôles système. Sur un autre serveur, initialiser d’abord le cluster QMAPS,
puis restaurer dans une base vide avec ces rôles. Une copie hors serveur exige
une destination indépendante.

## Signature Android

Le service interne `qmaps-signing` possède son propre volume et aucun port
d’entrée. Dans son terminal Coolify, `qmaps-upload-key init` crée une seule
clé de téléversement pour le paquet `ca.qmaps.mobile`. Une seconde exécution
affiche la même empreinte. Le certificat public sert à enregistrer cette clé
auprès de Google Play. Le fichier PKCS12 et son mot de passe restent sur ce
volume, accessibles à ses administrateurs. Exporter une sauvegarde privée du
volume via les contrôles d’hébergement de l’organisation. Le certificat seul
ne permet pas de signer. Cette clé de téléversement est distincte de la
clé de distribution gérée par Play App Signing.
