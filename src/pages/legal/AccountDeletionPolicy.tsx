import LegalPageLayout from "@/components/LegalPageLayout";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h2 className="font-heading text-base font-bold text-foreground">{title}</h2>
    <div className="space-y-2 text-muted-foreground">{children}</div>
  </section>
);

const AccountDeletionPolicy = () => (
  <LegalPageLayout
    title="Politique de suppression de compte"
    description="Ce qui est supprimé, anonymisé ou conservé lorsque vous fermez votre compte QMAPS."
    canonicalPath="/account-deletion-policy"
    lastUpdated="25 avril 2026"
  >
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
  </LegalPageLayout>
);

export default AccountDeletionPolicy;
