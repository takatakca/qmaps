# Workflow support — Suppression de compte QMAPS

_Phase 10D — usage interne support / admin._

Ce document décrit la procédure opérationnelle complète pour traiter une
demande de fermeture de compte enregistrée via `/settings/delete-account`.

## 1. Vue d'ensemble

1. L'utilisateur soumet une demande → statut `pending`.
2. Un événement `created` est inséré automatiquement dans
   `account_deletion_request_events`.
3. Le support examine la demande dans `/admin/account-deletions`.
4. Chaque changement de statut ou note interne génère un événement audit
   immuable.

## 2. Vérification d'identité

Avant de passer une demande à `processing` :

- [ ] Confirmer que la demande provient bien du propriétaire du compte
      (email vérifié, dernière activité cohérente).
- [ ] Si suspicion de compromission, contacter l'utilisateur via l'email
      enregistré et demander confirmation.
- [ ] Vérifier l'absence de litige actif :
  - réclamations d'entreprise ouvertes (`business_claims.status = 'pending'`)
  - paiements en cours (`merchant_subscriptions.status = 'active'`)
  - signalements ouverts (`reports.status = 'open'`)

## 3. Checklist d'anonymisation

Avant de marquer `completed`, vérifier que ces données ont bien été
anonymisées par le script support (NE PAS supprimer manuellement) :

- [ ] `profiles` : `display_name` → "Utilisateur supprimé", `avatar_url` → null,
      `email` → null
- [ ] `reviews` : conserver le contenu, marquer l'auteur comme anonyme
- [ ] `review_photos` : conservation publique, lien auteur retiré
- [ ] `project_quotes` : afficher "Marchand anonymisé" côté demandeur de projet
- [ ] `messages` : conserver pour la contrepartie, masquer le nom de l'expéditeur

## 4. Données à NE JAMAIS supprimer

- `review_moderation_actions`
- `review_trust_scores`
- `review_moderation_signals`
- `merchant_billing_events`
- `business_claims` (historique)
- `account_deletion_requests` (la demande elle-même)
- `account_deletion_request_events` (audit trail)

## 5. Propriété d'entreprise

Si l'utilisateur possède une fiche `businesses` :

1. Identifier les fiches : `SELECT id, name FROM businesses WHERE owner_user_id = '<uid>'`.
2. Proposer un transfert vers un co-propriétaire identifié, sinon archivage
   (`is_active = false`) après période de grâce de 30 jours.
3. **Ne jamais** retirer `owner_user_id` automatiquement avant transfert
   ou archivage explicite.

## 6. Étapes de complétion

1. Exécuter le script support `account_deletion.py --user-id <uid>` (hors UI).
2. Le script anonymise selon §3 et supprime les données privées listées dans
   `docs/account-deletion-policy.md`.
3. Le script supprime le compte `auth.users` en dernier.
4. Marquer la demande comme `completed` dans l'admin avec note interne :
   `"Anonymisé + auth supprimé via script v<N> le <date>"`.
5. Un événement `status_changed` est automatiquement enregistré.

## 7. Refus / annulation

- `rejected` : l'utilisateur n'est pas le titulaire OU des litiges actifs
  bloquent la suppression. Documenter la raison dans la note interne.
- `canceled` : l'utilisateur a retiré sa demande (par email ou support).
  Documenter la source de l'annulation.

## 8. Délais cibles

| Étape | Délai cible |
|-------|-------------|
| Examen initial | 7 jours ouvrables |
| Identité vérifiée → `processing` | +2 jours ouvrables |
| Anonymisation + suppression auth | +30 jours max |
| Réponse à l'utilisateur | À chaque changement de statut |

## 9. Communication utilisateur

Modèles d'email recommandés :

- **Reçue** : « Nous avons reçu votre demande. Examen sous 7 jours. »
- **En traitement** : « Votre demande est en cours de traitement. »
- **Complétée** : « Votre compte a été fermé. Certaines données ont été
  anonymisées conformément à notre politique. »
- **Refusée** : « Nous ne pouvons pas traiter votre demande pour la raison
  suivante : … »
