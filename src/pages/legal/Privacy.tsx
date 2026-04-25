import LegalPageLayout, { type LegalLang } from "@/components/LegalPageLayout";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h2 className="font-heading text-base font-bold text-foreground">{title}</h2>
    <div className="space-y-2 text-muted-foreground">{children}</div>
  </section>
);

const renderEn = () => (
  <>
    <p className="text-foreground">
      QMAPS Inc. ("QMAPS", "we") operates a local business discovery and review platform. This
      policy explains what data we collect and how we use it.
    </p>
    <Section title="1. Account data">
      <p>When you create an account, we collect your email, display name, and optionally a profile picture.</p>
    </Section>
    <Section title="2. Business listings">
      <p>Listings on QMAPS contain public information (name, address, phone, hours, photos). Verified owners can manage their content.</p>
    </Section>
    <Section title="3. Reviews and photos">
      <p>Your reviews, ratings and photos are published publicly under your display name. You can edit or delete them at any time.</p>
    </Section>
    <Section title="4. Messages">
      <p>Messages between users and businesses are encrypted in transit. Only conversation participants can access them.</p>
    </Section>
    <Section title="5. Notifications">
      <p>We send in-app notifications for replies, mentions, quote requests and activity related to your businesses. You can disable them in settings.</p>
    </Section>
    <Section title="6. Location">
      <p>Geolocation is used only with your explicit consent, to display nearby businesses. We do not store your position continuously.</p>
    </Section>
    <Section title="7. Recommendation events">
      <p>We log anonymized events (business views, clicks, searches) to improve personalized recommendations. You can clear this history in Settings &gt; Clear history.</p>
    </Section>
    <Section title="8. Sponsored ads">
      <p>We measure impressions and clicks on sponsored ads for merchant billing and fraud prevention. No external ad profile is created.</p>
    </Section>
    <Section title="9. Billing and subscriptions">
      <p>Payments are processed by Stripe. QMAPS never stores full credit card numbers. We retain invoices and transaction history per Canadian tax obligations.</p>
    </Section>
    <Section title="10. Moderation and trust scoring">
      <p>Reviews may be analyzed automatically (risk signals, trust scoring) to detect non-compliant content. Moderation actions are logged for audit purposes.</p>
    </Section>
    <Section title="11. Cookies and tracking">
      <p>
        See our{" "}
        <a href="/cookies" className="text-primary underline">
          cookies and tracking page
        </a>{" "}
        for full details on local storage, session tokens and event logging.
      </p>
    </Section>
    <Section title="12. Deletion and anonymization">
      <p>
        See our{" "}
        <a href="/account-deletion-policy" className="text-primary underline">
          account deletion policy
        </a>
        . Some data (reviews, moderation logs, accounting records) may be anonymized rather than deleted to preserve platform integrity.
      </p>
    </Section>
    <Section title="13. Your rights (Quebec Law 25)">
      <p>You can access, rectify and request deletion of your personal data. Contact us at <a href="mailto:privacy@qmaps.app" className="text-primary underline">privacy@qmaps.app</a>.</p>
    </Section>
  </>
);

const renderFr = () => (
  <>
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
    <Section title="11. Témoins et suivi">
      <p>
        Consultez notre{" "}
        <a href="/cookies" className="text-primary underline">
          page sur les témoins et le suivi
        </a>{" "}
        pour les détails complets sur le stockage local, les jetons de session et la journalisation.
      </p>
    </Section>
    <Section title="12. Suppression et anonymisation">
      <p>
        Voir notre{" "}
        <a href="/account-deletion-policy" className="text-primary underline">
          politique de suppression de compte
        </a>
        . Certaines données (avis, journaux de modération, registres comptables) peuvent être anonymisées plutôt que supprimées pour préserver l'intégrité de la plateforme.
      </p>
    </Section>
    <Section title="13. Vos droits (Loi 25 — Québec)">
      <p>Vous avez le droit d'accéder, de rectifier et de demander la suppression de vos données personnelles. Contactez-nous à <a href="mailto:privacy@qmaps.app" className="text-primary underline">privacy@qmaps.app</a>.</p>
    </Section>
  </>
);

const Privacy = () => (
  <LegalPageLayout
    title={{ en: "Privacy Policy", fr: "Politique de confidentialité" }}
    description={{
      en: "How QMAPS collects, uses and protects your personal data in Quebec.",
      fr: "Comment QMAPS collecte, utilise et protège vos données personnelles au Québec.",
    }}
    canonicalPath="/privacy"
    lastUpdated="2026-04-25"
    reviewHistory={[
      { date: "2026-04-25", en: "Initial public privacy policy.", fr: "Politique de confidentialité publique initiale." },
      { date: "2026-04-25", en: "Added bilingual legal content and cookies/tracking reference.", fr: "Ajout du contenu juridique bilingue et de la référence aux témoins/suivi." },
    ]}
  >
    {(lang: LegalLang) => (lang === "fr" ? renderFr() : renderEn())}
  </LegalPageLayout>
);

export default Privacy;
