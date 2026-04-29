# QMAPS — Owner Handoff Email Template

_Last reviewed: 2026-04-25_

Use this template when sending the release archive bundle to the
launch owner / client. Attach the most recent
`release-artifacts/<timestamp>/` folder (zipped) and adapt the bracketed
fields. Both **English** and **French** versions are provided.

---

## English version

**Subject:** QMAPS — Release archive ready for your sign-off

Hi [Owner],

The QMAPS release archive is ready for your review. Please find the
bundle attached (`release-artifacts/[timestamp].zip`).

**Current automated status: GO 🚀**

- Launch checks: 16/16 passing
- Go / No-Go gate: 4/4 passing
- Tests: all green
- Production build: clean

**What is included**

- `release-status.md` — stakeholder snapshot
- `final-launch-handoff.md` — full handoff pack
- `final-owner-signoff.md` — **the form you sign**
- `launch-checklist.md`, `release-candidate-checklist.md`,
  `deployment-checklist.md`, `app-store-readiness.md`
- `post-launch-checklist.md`, `production-verification-log.md`,
  `post-launch-issue-tracker.md`
- Production verification companion docs:
  `production-verification-sql.md` (read-only SQL),
  `production-verification-stripe.md`,
  `production-verification-mobile.md`,
  `production-verification-email-tests.md`
- Admin playbooks (incidents, reviews, billing, sponsored, claims)
- `go-no-go-report.generated.json` (machine-readable gate report)

**What still requires a manual signature**

The automated gate is green, but launch is **not** approved until you
have:

1. Walked through `final-owner-signoff.md` and signed every section.
2. Confirmed the manual checks in `production-verification-log.md`.
3. Counter-signed `app-store-readiness.md` if applicable.

**Manual checks that are not automated**

These remain your responsibility before publish:

- Stripe is in **Live** mode and the webhook secret is set.
- Custom domain `qmaps.app` is connected and SSL is **Active**.
- Support mailboxes (`support@`, `privacy@`, `abuse@`,
  `business@qmaps.app`) are monitored daily.

**After publish — first 72 hours**

Once live, follow:

- `post-launch-checklist.md` (T+0 → T+72h)
- `admin/first-72-hours-monitoring.md` (hour-by-hour)
- `admin/incident-response-playbook.md` (if anything breaks)

Please reply with the signed `final-owner-signoff.md` and we will
publish.

Thanks,
[Your name]

---

## Version française

**Objet :** QMAPS — Archive de mise en production prête pour votre approbation

Bonjour [Propriétaire],

L'archive de mise en production de QMAPS est prête pour votre revue.
Vous trouverez le lot ci-joint (`release-artifacts/[timestamp].zip`).

**Statut automatisé actuel : GO 🚀**

- Vérifications de lancement : 16/16 réussies
- Porte Go / No-Go : 4/4 réussies
- Tests : tous au vert
- Build de production : propre

**Ce qui est inclus**

- `release-status.md` — résumé pour les parties prenantes
- `final-launch-handoff.md` — dossier de transfert complet
- `final-owner-signoff.md` — **le formulaire à signer**
- `launch-checklist.md`, `release-candidate-checklist.md`,
  `deployment-checklist.md`, `app-store-readiness.md`
- `post-launch-checklist.md`, `production-verification-log.md`,
  `post-launch-issue-tracker.md`
- Documents compagnons de vérification production :
  `production-verification-sql.md` (SQL en lecture seule),
  `production-verification-stripe.md`,
  `production-verification-mobile.md`,
  `production-verification-email-tests.md`
- Guides administratifs (incidents, avis, facturation, sponsorisé, réclamations)
- `go-no-go-report.generated.json` (rapport machine du gate)

**Ce qui requiert encore une signature manuelle**

Le gate automatisé est au vert, mais la mise en production **n'est pas**
approuvée tant que vous n'avez pas :

1. Parcouru `final-owner-signoff.md` et signé chaque section.
2. Confirmé les vérifications manuelles dans
   `production-verification-log.md`.
3. Contre-signé `app-store-readiness.md` le cas échéant.

**Vérifications manuelles non automatisées**

Ces éléments restent sous votre responsabilité avant publication :

- Stripe est en mode **Live** et le secret webhook est configuré.
- Le domaine personnalisé `qmaps.app` est connecté et le SSL est **Actif**.
- Les boîtes de support (`support@`, `privacy@`, `abuse@`,
  `business@qmaps.app`) sont surveillées quotidiennement.

**Après publication — premières 72 heures**

Une fois en ligne, suivre :

- `post-launch-checklist.md` (T+0 → T+72h)
- `admin/first-72-hours-monitoring.md` (heure par heure)
- `admin/incident-response-playbook.md` (si un incident survient)

Merci de répondre avec le `final-owner-signoff.md` signé et nous
procéderons à la publication.

Merci,
[Votre nom]
