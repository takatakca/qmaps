# QMAPS — Recette Stripe en préproduction

Cette recette valide un abonnement marchand de test, son suivi par webhook et sa gestion dans le portail Stripe. Utiliser exclusivement un [Stripe Sandbox](https://docs.stripe.com/sandboxes) dédié à QMAPS et un environnement de préproduction isolé.

## Confirmer les accès et le périmètre

- Identifier dans le Dashboard Stripe le compte QMAPS et le Sandbox autorisé. Confirmer que les tarifs et la destination du webhook appartiennent à ce même Sandbox.
- Confirmer l’origine HTTPS de préproduction, le projet Supabase qui alimente son interface de facturation, et le commit QMAPS déployé. Utiliser un marchand de recette rattaché à une seule fiche de test et sans abonnement préexistant dans ce projet.
- À défaut de confirmation de l’un de ces éléments, consigner « Bloqué » avec l’accès manquant. Arrêter avant de déployer une fonction, de créer une session Checkout ou de déclencher un webhook. Garder le Dashboard en mode Sandbox pendant toute la recette et utiliser uniquement des moyens de paiement publics de test. [Cartes de test Stripe](https://docs.stripe.com/testing#cards)

## Configurer la préproduction

Préparer le projet de préproduction vérifié. Appliquer la migration [qui réserve les reçus Stripe au service](../supabase/migrations/20261126080026_protect_stripe_billing_receipts.sql). Avant d’appliquer la [migration de transaction Stripe](../supabase/migrations/20261127040944_apply_stripe_billing_event.sql), contrôler l’unicité des reçus déjà présents dans cette même base, sans exporter d’identifiants.

```sql
select count(*) as groupes_de_doublons
from (
  select provider_event_id
  from public.merchant_billing_events
  where provider = 'stripe' and provider_event_id is not null
  group by provider_event_id
  having count(*) > 1
) as doublons;
```

S’il existe des doublons, bloquer cette mise à jour et préserver l’historique pour une réconciliation distincte. Si le résultat est zéro, appliquer la migration puis déployer `create-merchant-checkout-session`, `create-merchant-billing-portal-session` et `stripe-webhook` depuis le même commit, avant d’activer la livraison Sandbox. Le frontend doit pointer sur ce projet via `VITE_SUPABASE_URL` et sa clé publique `VITE_SUPABASE_PUBLISHABLE_KEY`.

| Variable serveur | Valeur attendue en préproduction |
| --- | --- |
| `STRIPE_SECRET_KEY` | Clé API du Sandbox QMAPS identifié. |
| `STRIPE_WEBHOOK_SECRET` | Secret de signature de la destination Sandbox qui pointe vers cette fonction. |
| `STRIPE_STARTER_PRICE_ID`, `STRIPE_PRO_PRICE_ID`, `STRIPE_PREMIUM_PRICE_ID` | Identifiants des tarifs récurrents actifs de ce Sandbox, associés à leurs plans respectifs. |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Variables fournies à l’exécution par le projet Supabase de préproduction. Les deux fonctions de session utilisent la clé anonyme avec le jeton du marchand. Le webhook utilise la clé de service. |
| `QMAPS_ALLOWED_RETURN_ORIGINS` | Origine HTTPS exacte de la préproduction, sans chemin. Si plusieurs origines autorisées sont nécessaires, les séparer par des virgules. |

Déposer les valeurs sensibles dans les secrets serveur de préproduction. Dans les tickets, captures et journaux, noter uniquement si chaque variable est configurée. Écarter les clés, secrets de signature, jetons, cookies, en-têtes d’autorisation, URL de sessions Stripe et données de carte.

Dans Stripe Sandbox, configurer une destination webhook vers `/functions/v1/stripe-webhook` sur l’hôte du projet de préproduction et activer le portail client du Sandbox. La configuration QMAPS définit `verify_jwt = false` pour ce webhook, qui vérifie la signature Stripe. Les fonctions Checkout et portail exigent une session Supabase valide et vérifient la propriété de la fiche. [Configuration des fonctions](../supabase/config.toml)

Configurer la version d’API de la destination pour correspondre à celle utilisée par les fonctions (`2024-06-20`). Abonner la destination aux événements consommés par le code.

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## Exécuter la recette

1. **Annulation Checkout.** Se connecter comme marchand de recette et ouvrir `/merchant/billing/plans` en préproduction. Choisir un plan et vérifier que Stripe affiche le Sandbox attendu ainsi que le tarif et la périodicité configurés. Quitter Checkout avec son lien de retour. Vérifier le retour sur l’origine de préproduction, à `/merchant/billing/plans?checkout=cancel`, et confirmer que le plan gratuit est inchangé.
2. **Abonnement.** Relancer Checkout depuis la même fiche et terminer le parcours avec une carte de test. Vérifier le retour sur cette même origine à `/merchant/billing?checkout=success`. Recharger la facturation après la livraison du webhook et vérifier le plan choisi. Un retour sur un domaine de production signale une configuration d’origine à corriger.
3. **Persistance et preuve Stripe.** Dans Stripe Sandbox, ouvrir la livraison de `checkout.session.completed` issue de l’abonnement et vérifier son code 2xx. Dans la base de préproduction, vérifier le plan et le statut dans `merchant_subscriptions`, puis le reçu portant le même identifiant d’événement et la même fiche dans `merchant_billing_events`. Utiliser les extraits SQL existants en filtrant sur la fiche ou l’événement de recette. Un 2xx seul ne prouve pas que le reçu existe. Une livraison générique qui ne porte pas les métadonnées QMAPS ne remplace pas celle créée par Checkout. [Requêtes de vérification](production-verification-sql.md)
4. **Rediffusion.** Une fois le reçu confirmé, renvoyer ce même événement depuis Stripe Sandbox. Confirmer la réponse 200 avec `duplicate: true`, un seul reçu pour cet identifiant et un abonnement inchangé. En base, la même transaction enregistre le reçu et toute mise à jour d’abonnement pour un événement donné, même en cas de rediffusion simultanée de ce même identifiant. Les tests locaux couvrent aussi l’échec de cette transaction, qui ne laisse pas de reçu empêchant une nouvelle tentative. Cela ne détermine pas l’ordre de deux événements différents. [Tests du webhook](../src/test/stripeBillingHandlers.test.ts) · [Livraison des webhooks Stripe](https://docs.stripe.com/webhooks)
5. **Abonnement déjà en cours, portail et annulation.** Avec l’abonnement de recette reconnu en base, essayer de choisir un autre plan. L’application doit revenir à la facturation et aucun nouveau Checkout ne doit s’ouvrir. Depuis `/merchant/billing`, ouvrir « Gérer l’abonnement » et vérifier que le portail Sandbox présente le même abonnement. L’annuler suivant la configuration du portail. Après livraison du webhook de souscription, vérifier `cancel_at_period_end` ou `status = canceled`, selon le mode d’annulation, dans Supabase et dans l’interface QMAPS. Une annulation programmée ne rend pas encore l’abonnement terminal. Après une annulation effective confirmée, vérifier qu’un nouveau Checkout peut s’ouvrir, puis le quitter sans payer.
6. **Isolation.** Depuis une autre session marchande de test, vérifier que les données de facturation de la première fiche sont inaccessibles. Les tests SQL du dépôt vérifient que les rôles applicatifs ne peuvent pas créer de reçus Stripe et que les écritures manuelles autorisées restent possibles. [Tests des droits sur les reçus](../server/test/billing-receipts.sql)

Le test automatisé simule aussi une première livraison active reçue après l’annulation du même abonnement. Le webhook relit l’état actuel chez Stripe et l’abonnement reste annulé. Si cette lecture échoue, le webhook renvoie 500 sans enregistrer de reçu, pour permettre une nouvelle livraison. Une clé Sandbox restreinte doit autoriser la lecture des abonnements. Ce contrôle ne couvre ni les événements simultanés ni le remplacement par un autre abonnement. [Tests du webhook](../src/test/stripeBillingHandlers.test.ts)

La vérification Checkout protège un abonnement Stripe déjà enregistré dans QMAPS. Elle ne remplace pas une protection contre deux premiers Checkouts simultanés, avant que le webhook soit traité.

Pour distinguer les deux états d’annulation dans QMAPS, vérifier que l’annulation programmée laisse « Plan actuel » et « annulation prévue ». Quand le statut enregistré passe à `canceled`, le tableau marchand indique « Abonnement inactif » et la facturation indique « Dernier abonnement », sans période en cours. Vérifier l’historique et le lien « Voir les plans ». Si le client Stripe est enregistré, vérifier que le bouton du portail est toujours visible et ouvre le portail Sandbox configuré.

## Consigner les résultats et nettoyer

Pour chaque contrôle, consigner « Réussi », « Échec » ou « Bloqué », l’heure, le commit, le nom du Sandbox, l’origine de préproduction et la preuve correspondante. Pour le webhook, noter le type d’événement, le code HTTP et le résultat des lectures SQL en limitant les données à la fiche de test. Les identifiants de corrélation complets restent dans le journal privé de recette.

Après la recette, annuler les abonnements actifs créés par cet essai dans le Sandbox et confirmer les livraisons d’annulation avant de retirer les accès temporaires. Inventorier les fixtures créées pour cet essai dans le journal et les retirer selon la politique de rétention du projet de préproduction. Conserver les reçus et preuves nécessaires au suivi.
