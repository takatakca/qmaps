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

Le script charge par `COPY` dans une transaction. L’entête exact, les licences, la province, les doublons de référence et les changements d’identité sont vérifiés. Les lignes sont conservées uniquement dans `qmaps_ops.flexs_directory_stage`. Les rôles web et API n’ont pas d’accès. Aucune écriture dans `public.businesses`, les comptes ou les revendications. Une répétition met à jour les champs publics de la même référence sans en créer une deuxième. Les omissions entre deux clichés restent à auditer avant publication, notamment les demandes de retrait. Les collisions nom et ville sont signalées, pas fusionnées automatiquement.

Le test SQL peut être joué dans une base QMAPS jetable nommée `qmaps_flexs_stage_test` avec `sh server/test/flexs-directory-stage.sh`.

Le dépôt complet a été testé sur PostgreSQL jetable. Les 155 634 fiches ont été chargées en privé, avec zéro accès pour les trois rôles applicatifs et aucun changement du catalogue public. Une simulation de publication dans la même base jetable indique que la recherche sans filtre ferait 623 requêtes de 250 fiches avant affichage. La première réponse locale comptait 127 457 octets. Ce n’est pas une mesure de performance de production.

## Avant publication

1. La recherche publique actuelle télécharge toutes les pages de résultats avant d’afficher les fiches. Déployer et vérifier une recherche paginée côté serveur qui conserve le tri et les filtres, notamment les heures, les services et la proximité. Vérifier les index avec le vrai volume, l’accès invité et le masquage par compte.
2. Tester une première cohorte avec un comptage complet et des échantillons de plusieurs régions. Ne pas remplacer les fiches originales QMAPS, ON2GO, avis ou revendications. Associer une référence stable à chaque fiche et éviter de fusionner deux succursales de même nom.
3. Publier les cohortes vérifiées dans PostgreSQL QMAPS. Comparer les comptes par source, confirmer les champs et crédits, et tester la première page et les pages suivantes avant d’élargir. Ne pas annoncer une couverture exhaustive à partir de sources sectorielles.
