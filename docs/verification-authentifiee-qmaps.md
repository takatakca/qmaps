# Recette authentifiée QMAPS

Le contrôle public `node scripts/verify-live-routing.mjs` ne connecte aucun compte. La recette ci-dessous teste l’API PostgreSQL par le chemin navigateur des trois domaines et complète le parcours visuel du formulaire. Elle n’utilise ni compte réel ni facturation.

## Vérifier un rôle séparément

Le parcours client en production est [déjà documenté](https://github.com/takatakca/qmaps/issues/6#issuecomment-7208896100). Les deux modes ci-dessous peuvent être exécutés indépendamment sans reprendre ce parcours. Ils ne font aucune écriture métier. Ils ouvrent et ferment seulement les sessions du compte dédié.

- **Commerçant** — lier uniquement `QMAPS_QA_MERCHANT_HANDLE`, `QMAPS_QA_MERCHANT_PASSWORD` et `QMAPS_QA_PLACE_ID`. Le mode vérifie que le commerçant retrouve sa fiche dans son espace et que la console admin lui est refusée. La fiche n’a pas besoin d’être publique.
- **Admin** — lier uniquement `QMAPS_QA_ADMIN_HANDLE` et `QMAPS_QA_ADMIN_PASSWORD`. Le mode vérifie l’accès à la console depuis les trois domaines, sans changer une fiche ni un rôle.

```sh
node scripts/verify-authenticated-routing.mjs --live-qa --merchant-only
node scripts/verify-authenticated-routing.mjs --live-qa --admin-only
```

Les mêmes règles de compte dédié `qa-…` et de liaison confidentielle s’appliquent. Ces modes ne prouvent ni une publication de fiche, ni une opération de modération, ni Stripe Checkout.

## Préparer les accès de recette

Faire préparer quatre comptes dédiés par le responsable QMAPS, tous avec un identifiant `qa-…`. Aucun compte personnel ni administrateur d’exploitation.

| Compte | Variables à lier à l’environnement confidentiel de recette |
| --- | --- |
| Client | `QMAPS_QA_CLIENT_HANDLE`, `QMAPS_QA_CLIENT_PASSWORD` |
| Deuxième client indépendant | `QMAPS_QA_OBSERVER_HANDLE`, `QMAPS_QA_OBSERVER_PASSWORD` |
| Commerçant avec une fiche de recette | `QMAPS_QA_MERCHANT_HANDLE`, `QMAPS_QA_MERCHANT_PASSWORD` |
| Administrateur de recette | `QMAPS_QA_ADMIN_HANDLE`, `QMAPS_QA_ADMIN_PASSWORD` |

Lier séparément `QMAPS_QA_PLACE_ID` à l’identifiant de la fiche de recette. Elle doit être détenue par le commerçant de recette, visible dans l’annuaire et absente des préférences des deux clients. Les variables confidentielles sont fournies par le coffre ou par les secrets d’exécution. Ne pas copier leur contenu dans le chat, une commande, un ticket ou un fichier du dépôt.

## Exécuter et consigner

Après confirmation des comptes et de la fiche, exécuter avec Node 22 ou plus récent.

```sh
node scripts/verify-authenticated-routing.mjs --live-qa
```

Le script vérifie le `401` anonyme, la connexion, les fiches du commerçant, le refus de la console au client et au commerçant et l’accès à la console de l’administrateur. Il enregistre ensuite une consultation, demande le retrait de la recommandation et relit le résultat depuis trois sessions distinctes du premier client. Le deuxième client ne doit voir aucune de ces préférences. En cas d’erreur comme en cas de réussite, le script tente de fermer toutes les sessions reçues et signale les échecs.

Les deux écritures de préférence ne concernent que le client de recette. La fiche et les profils ne sont pas modifiés. Pour répéter le test, choisir une autre fiche de recette ou un nouveau client de recette. Le script refuse de réutiliser une préférence déjà visible dans l’API, qui ne présente qu’un historique récent des consultations. Le parcours visuel de recommandation ou de fermeture de compte reste à tester séparément avec ces mêmes comptes, selon le périmètre autorisé.

Dans le suivi, noter le SHA, les domaines, les résultats et l’heure du test. Ne pas joindre de cookies, de mots de passe ni de corps de réponse. Tester la facturation à part dans [Stripe Sandbox](preproduction-verification-stripe-sandbox.md).
