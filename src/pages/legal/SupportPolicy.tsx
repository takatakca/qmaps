import LegalPageLayout from "@/components/LegalPageLayout";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h2 className="font-heading text-base font-bold text-foreground">{title}</h2>
    <div className="space-y-2 text-muted-foreground">{children}</div>
  </section>
);

const SupportPolicy = () => (
  <LegalPageLayout
    title="Politique de support"
    description="Comment nous joindre et nos délais de réponse pour le support QMAPS."
    canonicalPath="/support-policy"
    lastUpdated="25 avril 2026"
  >
    <p className="text-foreground">
      L'équipe QMAPS est là pour aider utilisateurs et commerçants. Voici comment nous joindre et à
      quoi vous attendre.
    </p>

    <Section title="📧 Canaux de contact">
      <ul className="list-disc pl-5 space-y-1">
        <li>Support général : <a href="mailto:support@qmaps.app" className="text-primary underline">support@qmaps.app</a></li>
        <li>Vie privée et données : <a href="mailto:privacy@qmaps.app" className="text-primary underline">privacy@qmaps.app</a></li>
        <li>Signalement d'abus / DMCA : <a href="mailto:abuse@qmaps.app" className="text-primary underline">abuse@qmaps.app</a></li>
        <li>Commerçants et facturation : <a href="mailto:business@qmaps.app" className="text-primary underline">business@qmaps.app</a></li>
      </ul>
    </Section>

    <Section title="⏱ Délais de réponse">
      <ul className="list-disc pl-5 space-y-1">
        <li>Demandes générales : 2 jours ouvrables</li>
        <li>Vie privée et suppression de compte : 5 jours ouvrables</li>
        <li>Signalement d'abus : 24 heures</li>
        <li>Litiges de facturation : 3 jours ouvrables</li>
      </ul>
    </Section>

    <Section title="📝 Avant de nous écrire">
      <p>Pour accélérer le traitement, fournissez :</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Votre adresse courriel de compte</li>
        <li>Le nom du commerce ou l'URL concernée</li>
        <li>Des captures d'écran si possible</li>
      </ul>
    </Section>

    <Section title="🚫 Contenu signalé">
      <p>Pour signaler un avis ou un commerce, utilisez le bouton « Signaler » directement dans l'app. Toutes les signalisations sont examinées par un humain.</p>
    </Section>

    <Section title="🌍 Langue">
      <p>Le support est offert en français et en anglais.</p>
    </Section>
  </LegalPageLayout>
);

export default SupportPolicy;
