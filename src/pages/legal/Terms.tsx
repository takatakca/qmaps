import LegalPageLayout from "@/components/LegalPageLayout";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h2 className="font-heading text-base font-bold text-foreground">{title}</h2>
    <div className="space-y-2 text-muted-foreground">{children}</div>
  </section>
);

const Terms = () => (
  <LegalPageLayout
    title="Conditions d'utilisation"
    description="Conditions d'utilisation de la plateforme QMAPS pour les utilisateurs et commerces."
    canonicalPath="/terms"
    lastUpdated="25 avril 2026"
  >
    <p className="text-foreground">
      En utilisant QMAPS, vous acceptez les présentes conditions. QMAPS est une plateforme de
      découverte de commerces locaux et d'avis exploitée par QMAPS Inc. au Québec, Canada.
    </p>

    <Section title="1. Compte utilisateur">
      <p>Vous devez avoir au moins 13 ans. Vous êtes responsable de la sécurité de votre compte et de l'exactitude des informations fournies.</p>
    </Section>

    <Section title="2. Contenu publié">
      <p>Vous conservez la propriété de vos avis, photos et messages, mais accordez à QMAPS une licence non exclusive pour les afficher sur la plateforme.</p>
    </Section>

    <Section title="3. Règles de contenu">
      <p>Sont interdits : faux avis, contenu diffamatoire, harcèlement, contenu illégal, conflits d'intérêts non divulgués (avis sur sa propre entreprise ou un concurrent direct).</p>
    </Section>

    <Section title="4. Modération">
      <p>QMAPS peut masquer ou supprimer tout contenu enfreignant ces règles. Un score de confiance automatique peut être appliqué à chaque avis.</p>
    </Section>

    <Section title="5. Commerces et propriétaires">
      <p>Les propriétaires peuvent réclamer leur fiche, répondre aux avis et accéder à des outils payants (analytique, mise en avant). Les fausses réclamations peuvent entraîner la suspension du compte.</p>
    </Section>

    <Section title="6. Annonces sponsorisées">
      <p>Les annonces sont clairement identifiées « Sponsorisé ». Le placement sponsorisé n'influence pas les notes ou avis affichés.</p>
    </Section>

    <Section title="7. Abonnements payants">
      <p>Les abonnements commerçants sont facturés via Stripe selon le forfait choisi. Vous pouvez annuler à tout moment depuis le portail de facturation.</p>
    </Section>

    <Section title="8. Limites de responsabilité">
      <p>QMAPS ne garantit pas l'exactitude des fiches commerciales ni des avis publiés. Vous utilisez la plateforme à vos propres risques.</p>
    </Section>

    <Section title="9. Résiliation">
      <p>Nous pouvons suspendre un compte enfreignant ces conditions. Vous pouvez fermer votre compte à tout moment via Paramètres &gt; Fermer le compte.</p>
    </Section>

    <Section title="10. Droit applicable">
      <p>Ces conditions sont régies par les lois de la province de Québec, Canada.</p>
    </Section>
  </LegalPageLayout>
);

export default Terms;
