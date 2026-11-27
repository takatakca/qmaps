# Import du répertoire ON2GO dans QMAPS

Cet import reprend les 32 couples enseigne–cuisine du fichier public ON2GO du 16 octobre 2026. Il couvre 17 enseignes rattachées à deux cuisines partagées à Montréal, dont 16 fiches à Notre-Dame-de-Grâce et 16 à Saint-Léonard. Po Poulet NDG est absent de la source. Le 27 novembre, les 32 identifiants correspondaient exactement aux couples publiés par Food Hub. Chaque fiche identifie une enseigne et son adresse de cuisine partagée. [Source et licence ON2GO](https://on2go.ca/directory.json) · [Flux public Food Hub](https://foodhub.on2go.ca/api/public/directory)

La projection conserve les noms, les cuisines, les adresses et les coordonnées publiées. Les coordonnées de Saint-Léonard restent inconnues. Les horaires, téléphones, prix, photos et liens de commande sont omis. Chaque fiche est ajoutée à la catégorie Restaurants et affiche le crédit ON2GO.ca dans sa description. Aucune fiche n’est attribuée à un compte commerçant.

## Exécution par le responsable de la base QMAPS

Exécuter le SQL sur PostgreSQL QMAPS existant avec le rôle `postgres` dans le service `qmaps-db`. Effectuer une sauvegarde et une restauration d’essai selon la [procédure PostgreSQL QMAPS](../server/README.md), puis utiliser le fichier de cette révision depuis le dépôt. Exemple dans l’environnement Compose qui héberge la base QMAPS.

```sh
docker compose -f compose.qmaps.yaml exec -T qmaps-db sh /opt/qmaps/server/db/backup.sh
docker compose -f compose.qmaps.yaml exec -T qmaps-db sh /opt/qmaps/server/db/verify-backup.sh /var/backups/qmaps/NOM-DE-L-ARCHIVE.dump
docker compose -f compose.qmaps.yaml exec -T qmaps-db psql -X -v ON_ERROR_STOP=1 -U postgres -d qmaps \
  < server/db/imports/on2go-directory.sql
```

Le fichier d’import prend un verrou d’écriture court et applique les modifications dans une transaction. Il s’arrête en cas de collision d’identité ou si une fiche de la même ville partage le nom et l’adresse normalisée, ou le nom et le code postal. Réconcilier la fiche concernée avant toute nouvelle tentative. Les fiches ON2GO déjà identifiées gardent leurs modifications locales et leurs catégories. Les trois fiches d’exemple conservent leur contenu et leur accès. Seuls les noms originaux et leurs UUID associés sont ciblés.

Une erreur annule tout le passage. Après un passage réussi, privilégier une correction ciblée avec le responsable de la base en comparant les fiches et les noms aux données sauvegardées. Une restauration complète par-dessus la base active effacerait les écritures effectuées depuis la sauvegarde.

## Vérification

Sur une base contenant les trois noms d’origine et sans import antérieur, la commande doit afficher `32` fiches, `32` liens à la catégorie Restaurants et `3` changements de nom. Une nouvelle exécution affiche trois zéros. Vérifier ensuite la recherche Montréal, une fiche à chaque adresse et l’accès aux trois fiches d’exemple par leurs UUID existants. [Recherche Montréal](https://qmaps.ca/api/v1/browser/directory?city=Montréal)

Pour la recette SQL, démarrer la pile PostgreSQL QMAPS habituelle avec un volume jetable et le nom de base `qmaps_on2go_import_test`. Depuis le dépôt, exécuter `server/test/on2go-directory-import.sql` avec `psql` sur cette base. Le script vérifie les 32 identités et les adresses, la lecture anonyme via le rôle de la passerelle, le contenu des fiches renommées et la conservation des modifications locales au second passage.
