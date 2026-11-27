# Agrandir l’annuaire QMAPS au Québec

## Catalogue déjà préparé

Le catalogue provincial existant a été constitué pour FLEXS et conservé dans sa base ALKAO. Les PR [Montréal #12](https://github.com/takatakca/flexsca/pull/12), [sources provinciales #13](https://github.com/takatakca/flexsca/pull/13) et [OpenStreetMap #14](https://github.com/takatakca/flexsca/pull/14) retracent les étapes. Ce catalogue n’était pas celui de QMAPS. FLEXS a une règle de retrait et exclut les lignes non publiques. [Sources et règles FLEXS](https://github.com/takatakca/flexsca/blob/main/docs/DIRECTORY.md)

L’extraction publique du 27 novembre 2026 contient 155 634 fiches du Québec, soit 112 601 CC BY/CC0 et 43 033 ODbL. Les comptes exacts par source correspondent à ceux du catalogue public. Aucun UUID ni couple source/référence en double. Le rapprochement nom et ville dans PostgreSQL signale 2 156 groupes à examiner, sans les fusionner.

La projection transférable contient le nom, la municipalité, la région lorsque fournie, l’activité, l’identifiant de référence et la provenance. Elle ne contient ni coordonnées, ni adresse de rue, ni téléphone, ni courriel, ni comptes, ni justificatifs de revendication. Une fiche de base issue de cette projection ne doit pas devenir une fiche vérifiée ou signalée « ouverte maintenant ». Une entreprise peut apparaître plusieurs fois si elle a plusieurs établissements distincts.

## Sources exploitables et limites

| Source | Usage prévu |
| --- | --- |
| RBQ, OPC, SIT Québec, commerces et établissements alimentaires de Montréal déjà assemblés par FLEXS | CC BY 4.0. Conserver le crédit de chaque jeu d’origine. Ne pas copier les droits associés aux revendications. |
| Entreprendre Sherbrooke via FLEXS | CC0 1.0. Conserver le crédit de provenance. C’est une couverture locale, pas un registre exhaustif. |
| OpenStreetMap via FLEXS | ODbL 1.0. Garder l’extrait distinct, attribuer les contributeurs et assurer l’accès à la base dérivée ODbL avant republication. [Licence OSM](https://www.openstreetmap.org/copyright/fr) |
| Permis d’alcool de la RACJ | CC BY 4.0. Premier complément ciblé pour repérer des établissements de restauration dans les 17 régions. Un permis n’indique pas que l’établissement est ouvert au moment de la recherche. [Données Québec](https://www.donneesquebec.ca/recherche/dataset/racj-alcool-detaillant) |
| Overture Places | Complément pour les établissements absents des jeux sectoriels. Garder le millésime, les crédits par source et le statut fourni. Filtrer par activité, province et qualité plutôt que publier les points bruts. [Places](https://docs.overturemaps.org/guides/places/) · [Attribution](https://docs.overturemaps.org/attribution/) |
| Registraire des entreprises du Québec | L’export du REQ est CC BY-NC-SA 4.0. Ne pas l’utiliser dans cet annuaire commercial sans autorisation distincte. [Licence du jeu](https://www.donneesquebec.ca/recherche/fr/dataset/registre-des-entreprises) |

411.ca, Pages Jaunes, Canada411 et Yelp ne servent pas de flux d’import libre. Les conditions de 411.ca et de Pages Jaunes encadrent ou interdisent l’extraction et la redistribution commerciale. Yelp offre des intégrations sous licence. L’API Places ordinaire limite la conservation de son contenu à 24 heures. Aucune licence réutilisable pour les listes de RestoMontréal n’a été confirmée. Ces annuaires restent de bonnes références pour les fonctionnalités QMAPS, par exemple les fiches, les catégories, la carte et la revendication. Ne pas reprendre leurs avis, photos ou descriptions sans droits. [411.ca](https://411.ca/terms-and-conditions) · [Pages Jaunes et Canada411](https://solutions.yp.ca/terms-of-use) · [Yelp Canada](https://terms.yelp.com/tos/en_ca/20260101_en_ca/) · [Yelp Places](https://docs.developer.yelp.com/docs/places-faq) · [RestoMontréal](https://www.restomontreal.ca/contact/?lang=fr)

## Dépôt privé des clichés FLEXS

L’extraction doit venir de la projection publique FLEXS, ne contenir que les fiches `listed` ou `claimed` du Québec, et être séparée en deux fichiers. Les lignes marquées `claimed` ne transfèrent aucun compte ni statut de revendication à QMAPS. Le format CSV strict est le suivant.

```text
id,source,source_ref,name,other_name,city,region,province,trade,category_slug,status
```

Sur une base PostgreSQL QMAPS autorisée, employer le client local sous le rôle opérateur et sélectionner la base par sa connexion habituelle. Vérifier d’abord une sauvegarde si l’opération se fait dans le cluster de production. [Sauvegarde et récupération](../server/README.md#sauvegarde-et-récupération)

```sh
sh server/db/imports/stage-flexs-directory.sh open /chemin/flexs-basic-cc.csv
sh server/db/imports/stage-flexs-directory.sh odbl /chemin/flexs-basic-osm-odbl.csv
```

Le script charge par `COPY` dans une transaction. L’entête exact, les licences, la province, les doublons de référence et les changements d’identité sont vérifiés. Le fichier `open` doit contenir les six sources attendues `rbq`, `mtl_food`, `mtl_shops`, `opc`, `sit` et `shb`. Le fichier `odbl` reste distinct et contient uniquement `osm`. Une source attendue absente fait refuser le fichier entier. Le reçu privé `qmaps_ops.flexs_directory_snapshots` est mis à jour dans la même transaction que les lignes de `qmaps_ops.flexs_directory_stage`, avec un horodatage identique et les comptes par source. Les rôles web et API n’ont accès ni aux données ni aux reçus.

La présence des sources ne prouve pas que l’export contient toutes leurs fiches. Comparer les comptes par source et l’empreinte du fichier avec le manifeste d’export. Le reçu indique le chargement QMAPS, pas l’âge du registre d’origine. Conserver les lignes omises en privé et lire leur compte par source à la fin du chargement. Examiner ces omissions, notamment les demandes de retrait. Aucun chargement ne crée ou ne retire automatiquement des fiches publiques, comptes ou revendications. Les collisions nom et ville sont signalées, pas fusionnées automatiquement.

Le test SQL peut être joué dans une base QMAPS jetable nommée `qmaps_flexs_stage_test` avec `sh server/test/flexs-directory-stage.sh`.

Le dépôt complet a été testé sur PostgreSQL jetable. Les 155 634 fiches ont été chargées en privé, avec zéro accès pour les trois rôles applicatifs et aucun changement du catalogue public. Une simulation de publication dans la même base jetable indique que la recherche sans filtre ferait 623 requêtes de 250 fiches avant affichage. La première réponse locale comptait 127 457 octets. Ce n’est pas une mesure de performance de production.

## Préparer un premier lot de restaurants montréalais

Utiliser un cliché complet et récent du fichier ouvert FLEXS. En base de recette, charger le cliché avec la commande de dépôt ci-dessus, puis générer le rapport avec le même rôle opérateur. La requête est en lecture seule et ne publie ni ne modifie aucune fiche. Ne pas commiter le rapport nominatif.

```sh
psql -X -Atq -v ON_ERROR_STOP=1 \
  -f server/db/imports/preview-flexs-montreal-restaurants.sql > montreal-restaurants-a-verifier.json
```

Le rapport couvre la source `mtl_food` du dernier reçu ouvert, à la ville de Montréal et à l’activité FLEXS « Restaurant ». Il donne les comptes par source du reçu, les comptes par motif, le crédit et jusqu’à 24 références stables. L’aperçu et la première activation s’arrêtent si le reçu ouvert est absent ou si ses comptes diffèrent des lignes chargées. Pour une base déjà préparée avant cette vérification, recharger un cliché ouvert complet et récent plutôt que d’inférer un reçu à partir d’anciennes lignes.

Le rapport écarte les références non numériques, les noms sans lettres, les identifiants ou noms déjà présents dans QMAPS et les collisions de noms ou d’alias dans le même cliché ouvert. La comparaison de nom ignore les accents et la ponctuation et recherche aussi dans les arrondissements de Montréal. Elle signale des chevauchements possibles sans les fusionner. Les données ODbL et les lignes omises du dernier cliché ne participent pas au lot ni à la comparaison entre sources. Les fiches QMAPS existantes, même inactives, restent protégées contre les collisions.

L’activité FLEXS « Restaurant » regroupe plusieurs types municipaux, dont les camions-cuisines et les cantines mobiles. Pour ce premier lot, retrouver la référence `source_ref` dans le champ `business_id` du registre municipal. Retenir le type exact `Restaurant`, une ligne au statut municipal `Ouvert`, un nom qui concorde et une adresse de rue exploitable à Montréal. Examiner les adresses partagées, changements de noms et chevauchements avec QMAPS et ON2GO avant publication. Les informations municipales peuvent avoir du retard. Le statut administratif `Ouvert` ne confirme ni les heures d’ouverture ni le propriétaire. [Registre et licence CC BY 4.0](https://www.donneesquebec.ca/recherche/dataset/vmtl-etablissements-alimentaires)

Pour les futures fiches publiques, afficher le crédit de la Ville de Montréal, la référence et la licence. Mentionner la sélection et l’adaptation FLEXS/QMAPS. Laisser vides les heures, le téléphone et les coordonnées non corroborés. Ne proposer ni statut vérifié, ni revendication sans parcours de reprise. Conserver un manifeste des identifiants exacts du lot. En cas de retrait, désactiver seulement les fiches concernées après vérification des modifications ou revendications, sans supprimer en cascade les avis, favoris ou médias.

### Activer ou retirer le lot après la recette

Valider d’abord sur une base jetable. L’aperçu et le manifeste de revue ne déclenchent aucun import. Seul l’opérateur PostgreSQL autorisé peut exécuter ces commandes. Avant toute publication sur la base QMAPS publique, vérifier le déploiement de la recherche paginée et l’affichage du crédit sur une fiche de recette, confirmer une sauvegarde, et revérifier les références municipales du petit lot.

```sh
sh server/db/imports/run-flexs-montreal-pilot.sh publish mtl-2026-11-27-v1 /chemin/lot-pilote-confirme.csv
sh server/db/imports/run-flexs-montreal-pilot.sh withdraw mtl-2026-11-27-v1 /chemin/lot-pilote-confirme.csv
```

Le fichier de revue fournit de 1 à 24 lignes CC BY 4.0 corroborées. L’en-tête exact et les champs sont `id_qmaps_propose,reference_municipale,nom,adresse_publique,ville,province,categorie_qmaps,source,licence`. Les quatre derniers champs utilisent `QC`, `restaurants`, `Ville de Montréal — Établissements alimentaires` et `CC BY 4.0`, et la ville est `Montréal`. Ce fichier reste hors Git. L’adresse vient du rapprochement municipal, pas du cliché FLEXS. Une référence absente du dernier cliché, un chevauchement avec une fiche QMAPS existante même inactive, ou un conflit de nom, d’alias ou d’adresse empêche l’activation du lot entier.

Vérifier le code de sortie et le JSON de l’opération. Le reçu privé du lot enregistre les identifiants exacts. Il faut réutiliser le même contenu pour le retrait, sous le même identifiant de lot. Le retrait fonctionne même si le reçu de préparation a changé ou n’existe plus. Une nouvelle exécution après retrait ne rend pas les fiches visibles. Le retrait désactive les fiches intactes et conserve les fiches modifiées, revendiquées ou en cours de revendication pour examen. Les avis, favoris et médias restent en base, et les compteurs dérivés des avis ne bloquent pas le retrait. Les fiches activées ne contiennent ni horaires, ni coordonnées, ni information de propriété supposée. Leur détail affiche le crédit municipal et distingue le statut administratif de la source de toute confirmation des horaires ou de l’exploitant actuel.

## Avant publication

1. La recherche publique actuelle télécharge toutes les pages de résultats avant d’afficher les fiches. Déployer et vérifier une recherche paginée côté serveur qui conserve le tri et les filtres, notamment les heures, les services et la proximité. Vérifier les index avec le vrai volume, l’accès invité et le masquage par compte.
2. Tester une première cohorte avec un comptage complet et des échantillons de plusieurs régions. Ne pas remplacer les fiches originales QMAPS, ON2GO, avis ou revendications. Associer une référence stable à chaque fiche et éviter de fusionner deux succursales de même nom.
3. Publier les cohortes vérifiées dans PostgreSQL QMAPS. Comparer les comptes par source, confirmer les champs et crédits, et tester la première page et les pages suivantes avant d’élargir. Ne pas annoncer une couverture exhaustive à partir de sources sectorielles.
