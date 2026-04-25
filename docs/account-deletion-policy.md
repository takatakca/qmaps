# Politique de suppression de compte — QMAPS

_Dernière mise à jour : Phase 10C_

QMAPS prend très au sérieux les demandes de suppression de compte. Cette politique
décrit ce qui est supprimé, anonymisé ou conservé lorsqu'un utilisateur demande
la fermeture définitive de son compte.

## 1. Comment demander la suppression

1. Ouvrir l'app QMAPS et se connecter.
2. Aller dans **Paramètres → Fermer le compte**.
3. Lire l'avertissement, taper `DELETE` pour confirmer, soumettre.
4. Une demande est créée avec le statut `pending` et examinée par notre équipe.

Aucune suppression n'est exécutée immédiatement. La demande peut être annulée
en contactant le support tant qu'elle n'est pas marquée `completed`.

## 2. Données supprimées

Les éléments suivants sont **supprimés** une fois la demande approuvée :

- Profil utilisateur (display_name, avatar_url, email)
- Favoris (`bookmarks`)
- Collections personnelles (`collections`, `collection_items`)
- Préférences de recommandations (`user_preference_profiles`)
- Notifications personnelles (`notifications`)
- Conversations privées et messages 1:1
- Réactions d'avis (`review_reactions`)
- Demandes de projets ouvertes sans devis acceptés

## 3. Données anonymisées

Pour préserver l'intégrité des notes moyennes et la qualité du contenu public,
certains éléments sont **anonymisés** plutôt que supprimés :

| Donnée | Action |
|--------|--------|
| Avis publiés (`reviews`) | `user_id` désassocié, affichage « Utilisateur supprimé » |
| Photos d'avis | Conservation publique, `user_id` anonymisé |
| Devis envoyés (`project_quotes`) | Affichage anonymisé côté propriétaire de projet |

## 4. Données conservées (obligation légale ou intégrité)

Les éléments suivants sont **conservés** de manière permanente ou pour la
durée requise par la loi / nos obligations contractuelles :

- Historique de modération (`review_moderation_actions`, `review_trust_scores`)
- Signalements émis ou reçus (`reports`)
- Réclamations d'entreprise (`business_claims`)
- Événements de facturation marchand (`merchant_billing_events`)
- Abonnements marchands archivés (`merchant_subscriptions`)
- Journaux d'événements anti-fraude
- Demande de suppression elle-même (`account_deletion_requests`) à des fins d'audit

## 5. Propriété d'entreprise

Si le compte est propriétaire d'une ou plusieurs fiches `businesses` :

- L'ownership n'est **pas retiré automatiquement**.
- L'équipe support transfère la propriété (par exemple à un co-propriétaire identifié)
  ou archive la fiche avant la finalisation de la suppression.
- Les données opérationnelles (avis, photos, notes) restent publiques.

## 6. Délais

- Examen initial : sous 7 jours ouvrables
- Suppression effective : sous 30 jours après approbation
- Conservation des journaux d'audit : jusqu'à 7 ans selon obligations légales

## 7. Suppression de l'authentification

La suppression définitive du compte Supabase Auth (`auth.users`) est effectuée
**hors interface admin** par un script supervisé, après vérification :

- Aucune réclamation d'entreprise active
- Aucun litige de facturation ouvert
- Aucun signalement non résolu

## 8. Contact

Pour toute question : `support@qmaps.app`
