import LegalPageLayout from "@/components/LegalPageLayout";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h2 className="font-heading text-base font-bold text-foreground">{title}</h2>
    <div className="space-y-2 text-muted-foreground">{children}</div>
  </section>
);

const Privacy = () => (
  <LegalPageLayout
    title="Politique de confidentialité"
    description="Comment QMAPS collecte, utilise et protège vos données personnelles au Québec."
    canonicalPath="/privacy"
    lastUpdated="25 avril 2026"
  >
    <p className="text-foreground">
      QMAPS Inc. (« QMAPS », « nous ») exploite une plateforme de découverte de commerces locaux et
      d'avis. Cette politique explique quelles données nous collectons et comment nous les utilisons.
    </p>

    <Section title="1. Données de compte">
      <p>Lors de la création d'un compte, nous collectons votre adresse courriel, votre nom d'affichage et, optionnellement, une photo de profil.</p>
    </Section>

    <Section title="2. Fiches commerciales">
      <p>Les commerces présents sur QMAPS contiennent des informations publiques (nom, adresse, téléphone, horaires, photos). Les propriétaires vérifiés peuvent en gérer le contenu.</p>
    </Section>

    <Section title="3. Avis et photos">
      <p>Vos avis, notes et photos sont publiés publiquement sous votre nom d'affichage. Vous pouvez les modifier ou les supprimer en tout temps.</p>
    </Section>

    <Section title="4. Messages">
      <p>Les messages échangés entre utilisateurs et commerces sont stockés de façon chiffrée en transit. Seuls les participants à une conversation peuvent y accéder.</p>
    </Section>

    <Section title="5. Notifications">
      <p>Nous envoyons des notifications dans l'app pour les réponses, mentions, demandes de devis et activités liées à vos commerces. Vous pouvez les désactiver dans les paramètres.</p>
    </Section>

    <Section title="6. Localisation">
      <p>La géolocalisation est utilisée seulement avec votre consentement explicite, pour afficher des commerces à proximité. Nous ne stockons pas votre position en continu.</p>
    </Section>

    <Section title="7. Événements de recommandation">
      <p>Nous enregistrons des événements anonymisés (vues de commerce, clics, recherches) afin d'améliorer les recommandations personnalisées. Vous pouvez effacer cet historique dans Paramètres &gt; Effacer l'historique.</p>
    </Section>

    <Section title="8. Annonces sponsorisées">
      <p>Nous mesurons les impressions et clics sur les annonces sponsorisées pour la facturation des commerçants et la prévention de la fraude. Aucun profil publicitaire externe n'est créé.</p>
    </Section>

    <Section title="9. Facturation et abonnements">
      <p>Les paiements sont traités par Stripe. QMAPS ne stocke jamais les numéros complets de cartes de crédit. Nous conservons les factures et historiques de transactions selon les obligations fiscales canadiennes.</p>
    </Section>

    <Section title="10. Modération et score de confiance">
      <p>Les avis peuvent être analysés automatiquement (signaux de risque, score de confiance) pour détecter le contenu non conforme. Les actions de modération sont journalisées à des fins d'audit.</p>
    </Section>

    <Section title="11. Suppression et anonymisation">
      <p>
        Voir notre{" "}
        <a href="/account-deletion-policy" className="text-primary underline">
          politique de suppression de compte
        </a>
        . Certaines données (avis, journaux de modération, registres comptables) peuvent être anonymisées plutôt que supprimées pour préserver l'intégrité de la plateforme.
      </p>
    </Section>

    <Section title="12. Vos droits (Loi 25 — Québec)">
      <p>Vous avez le droit d'accéder, de rectifier et de demander la suppression de vos données personnelles. Contactez-nous à <a href="mailto:privacy@qmaps.app" className="text-primary underline">privacy@qmaps.app</a>.</p>
    </Section>
  </LegalPageLayout>
);

export default Privacy;
