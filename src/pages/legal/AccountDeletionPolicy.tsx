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
      You can request to close your account at any time from Settings &gt; Close account. Here is
      how each type of data is handled.
    </p>
    <Section title="✅ Deleted">
      <ul className="list-disc pl-5 space-y-1">
        <li>Profile (display name, email, avatar)</li>
        <li>Bookmarks and private collections</li>
        <li>Notifications</li>
        <li>Personal preferences</li>
        <li>Unapproved business claims</li>
      </ul>
    </Section>
    <Section title="🔒 Anonymized (kept without link to your identity)">
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Published reviews</strong> — the rating remains to preserve the business average, but the author name is replaced with "Deleted user".</li>
        <li><strong>Review photos</strong> — kept if attached to a public review.</li>
        <li><strong>Messages</strong> — your identity is anonymized in conversations; content remains visible to other participants.</li>
        <li><strong>Recommendation events</strong> — user identifiers are erased.</li>
      </ul>
    </Section>
    <Section title="📁 Retained (legal and audit obligations)">
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Moderation logs</strong> — kept for audit purposes (platform integrity).</li>
        <li><strong>Billing records and receipts</strong> — kept per Canadian tax law (up to 7 years).</li>
        <li><strong>Account closure requests</strong> — kept as proof of compliance.</li>
        <li><strong>Sponsored ad events</strong> — kept in aggregated form for merchant billing.</li>
      </ul>
    </Section>
    <Section title="🏪 Claimed businesses">
      <p>If you are the verified owner of a business, ownership is not automatically removed. Our team will contact you to transfer or release the listing.</p>
    </Section>
    <Section title="Processing time">
      <p>Requests are processed within 30 business days. You can cancel a request while it is in "pending" status.</p>
    </Section>
  </>
);

const renderFr = () => (
  <>
    <p className="text-foreground">
      Vous pouvez demander la fermeture de votre compte à tout moment depuis Paramètres &gt; Fermer
      le compte. Voici comment chaque type de donnée est traité.
    </p>
    <Section title="✅ Supprimé">
      <ul className="list-disc pl-5 space-y-1">
        <li>Profil (nom d'affichage, courriel, avatar)</li>
        <li>Signets et collections privées</li>
        <li>Notifications</li>
        <li>Préférences personnelles</li>
        <li>Réclamations de commerce non approuvées</li>
      </ul>
    </Section>
    <Section title="🔒 Anonymisé (conservé sans lien à votre identité)">
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Avis publiés</strong> — la note reste pour préserver la moyenne du commerce, mais le nom d'auteur est remplacé par « Utilisateur supprimé ».</li>
        <li><strong>Photos d'avis</strong> — conservées si elles servent à un avis public.</li>
        <li><strong>Messages</strong> — votre identité est anonymisée dans les conversations, le contenu reste visible aux autres participants.</li>
        <li><strong>Événements de recommandation</strong> — les identifiants utilisateur sont effacés.</li>
      </ul>
    </Section>
    <Section title="📁 Conservé (obligations légales et audit)">
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Journaux de modération</strong> — conservés à des fins d'audit (intégrité de la plateforme).</li>
        <li><strong>Registres de facturation et reçus</strong> — conservés selon la législation fiscale canadienne (jusqu'à 7 ans).</li>
        <li><strong>Demandes de fermeture de compte</strong> — conservées pour preuve de conformité.</li>
        <li><strong>Événements publicitaires sponsorisés</strong> — conservés sous forme agrégée pour la facturation des commerçants.</li>
      </ul>
    </Section>
    <Section title="🏪 Commerces réclamés">
      <p>Si vous êtes propriétaire d'un commerce vérifié, la propriété n'est pas automatiquement supprimée. Notre équipe vous contactera pour transférer la fiche ou la libérer.</p>
    </Section>
    <Section title="Délai de traitement">
      <p>Les demandes sont traitées sous 30 jours ouvrables. Vous pouvez annuler une demande tant qu'elle est au statut « en attente ».</p>
    </Section>
  </>
);

const AccountDeletionPolicy = () => (
  <LegalPageLayout
    title={{ en: "Account Deletion Policy", fr: "Politique de suppression de compte" }}
    description={{
      en: "What is deleted, anonymized or retained when you close your QMAPS account.",
      fr: "Ce qui est supprimé, anonymisé ou conservé lorsque vous fermez votre compte QMAPS.",
    }}
    canonicalPath="/account-deletion-policy"
    lastUpdated="2026-04-25"
    reviewHistory={[
      { date: "2026-04-25", en: "Initial account deletion policy.", fr: "Politique initiale de suppression de compte." },
      { date: "2026-04-25", en: "Added bilingual version and retention explanation.", fr: "Ajout de la version bilingue et de l'explication sur la rétention." },
    ]}
  >
    {(lang: LegalLang) => (lang === "fr" ? renderFr() : renderEn())}
  </LegalPageLayout>
);

export default AccountDeletionPolicy;
