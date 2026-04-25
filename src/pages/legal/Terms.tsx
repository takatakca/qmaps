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
      By using QMAPS you agree to these terms. QMAPS is a local business discovery and review
      platform operated by QMAPS Inc. in Quebec, Canada.
    </p>
    <Section title="1. User account"><p>You must be at least 13 years old. You are responsible for your account security and the accuracy of the information provided.</p></Section>
    <Section title="2. Posted content"><p>You retain ownership of your reviews, photos and messages but grant QMAPS a non-exclusive license to display them on the platform.</p></Section>
    <Section title="3. Content rules"><p>Prohibited: fake reviews, defamatory content, harassment, illegal content, undisclosed conflicts of interest (reviewing your own business or a direct competitor).</p></Section>
    <Section title="4. Moderation"><p>QMAPS may hide or remove any content that violates these rules. An automatic trust score may be applied to each review.</p></Section>
    <Section title="5. Businesses and owners"><p>Owners can claim their listing, reply to reviews and access paid tools (analytics, promotion). False claims may result in account suspension.</p></Section>
    <Section title="6. Sponsored ads"><p>Ads are clearly marked "Sponsored". Sponsored placement does not influence the ratings or reviews displayed.</p></Section>
    <Section title="7. Paid subscriptions"><p>Merchant subscriptions are billed via Stripe based on the chosen plan. You can cancel at any time from the billing portal.</p></Section>
    <Section title="8. Liability limits"><p>QMAPS does not guarantee the accuracy of business listings or published reviews. You use the platform at your own risk.</p></Section>
    <Section title="9. Termination"><p>We may suspend an account that violates these terms. You can close your account at any time via Settings &gt; Close account.</p></Section>
    <Section title="10. Governing law"><p>These terms are governed by the laws of the Province of Quebec, Canada.</p></Section>
  </>
);

const renderFr = () => (
  <>
    <p className="text-foreground">
      En utilisant QMAPS, vous acceptez les présentes conditions. QMAPS est une plateforme de
      découverte de commerces locaux et d'avis exploitée par QMAPS Inc. au Québec, Canada.
    </p>
    <Section title="1. Compte utilisateur"><p>Vous devez avoir au moins 13 ans. Vous êtes responsable de la sécurité de votre compte et de l'exactitude des informations fournies.</p></Section>
    <Section title="2. Contenu publié"><p>Vous conservez la propriété de vos avis, photos et messages, mais accordez à QMAPS une licence non exclusive pour les afficher sur la plateforme.</p></Section>
    <Section title="3. Règles de contenu"><p>Sont interdits : faux avis, contenu diffamatoire, harcèlement, contenu illégal, conflits d'intérêts non divulgués (avis sur sa propre entreprise ou un concurrent direct).</p></Section>
    <Section title="4. Modération"><p>QMAPS peut masquer ou supprimer tout contenu enfreignant ces règles. Un score de confiance automatique peut être appliqué à chaque avis.</p></Section>
    <Section title="5. Commerces et propriétaires"><p>Les propriétaires peuvent réclamer leur fiche, répondre aux avis et accéder à des outils payants (analytique, mise en avant). Les fausses réclamations peuvent entraîner la suspension du compte.</p></Section>
    <Section title="6. Annonces sponsorisées"><p>Les annonces sont clairement identifiées « Sponsorisé ». Le placement sponsorisé n'influence pas les notes ou avis affichés.</p></Section>
    <Section title="7. Abonnements payants"><p>Les abonnements commerçants sont facturés via Stripe selon le forfait choisi. Vous pouvez annuler à tout moment depuis le portail de facturation.</p></Section>
    <Section title="8. Limites de responsabilité"><p>QMAPS ne garantit pas l'exactitude des fiches commerciales ni des avis publiés. Vous utilisez la plateforme à vos propres risques.</p></Section>
    <Section title="9. Résiliation"><p>Nous pouvons suspendre un compte enfreignant ces conditions. Vous pouvez fermer votre compte à tout moment via Paramètres &gt; Fermer le compte.</p></Section>
    <Section title="10. Droit applicable"><p>Ces conditions sont régies par les lois de la province de Québec, Canada.</p></Section>
  </>
);

const Terms = () => (
  <LegalPageLayout
    title={{ en: "Terms of Service", fr: "Conditions d'utilisation" }}
    description={{
      en: "QMAPS terms of service for users and businesses.",
      fr: "Conditions d'utilisation de la plateforme QMAPS pour les utilisateurs et commerces.",
    }}
    canonicalPath="/terms"
    lastUpdated="2026-04-25"
    reviewHistory={[
      { date: "2026-04-25", en: "Initial public terms.", fr: "Conditions d'utilisation publiques initiales." },
      { date: "2026-04-25", en: "Added bilingual version.", fr: "Ajout de la version bilingue." },
    ]}
  >
    {(lang: LegalLang) => (lang === "fr" ? renderFr() : renderEn())}
  </LegalPageLayout>
);

export default Terms;
