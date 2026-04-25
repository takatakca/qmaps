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
      QMAPS uses minimal client-side storage and a few event logs to keep you signed in and to
      improve recommendations. We do not use third-party advertising cookies.
    </p>
    <Section title="🗂 Local storage">
      <p>QMAPS stores small preferences in your browser's local storage (e.g. selected language for legal pages, distance units, recent searches). This data never leaves your device unless you sign in.</p>
    </Section>
    <Section title="🔐 Authentication session">
      <p>Our backend (Supabase auth) stores a session token in your browser to keep you signed in. Removing it logs you out.</p>
    </Section>
    <Section title="📊 Recommendation events">
      <p>We log anonymized events such as business views, search clicks, recommendation impressions, clicks and dismissals to improve personalized suggestions. These are deduplicated per session.</p>
    </Section>
    <Section title="📣 Sponsored listings">
      <p>Impressions and clicks on sponsored placements are recorded for merchant reporting and fraud prevention. No external ad network profile is created.</p>
    </Section>
    <Section title="💳 Billing">
      <p>Stripe handles billing data. QMAPS does not store full credit card numbers and only retains invoice references.</p>
    </Section>
    <Section title="🚫 No third-party ad cookies">
      <p>QMAPS does not load third-party advertising or cross-site tracking cookies at this stage.</p>
    </Section>
    <Section title="🧹 Clearing your data">
      <p>You can clear your local recommendation history from Settings &gt; Clear history (when available). You can also clear your browser's site data at any time.</p>
    </Section>
  </>
);

const renderFr = () => (
  <>
    <p className="text-foreground">
      QMAPS utilise un stockage client minimal et quelques journaux d'événements pour vous garder
      connecté et améliorer les recommandations. Nous n'utilisons pas de témoins publicitaires tiers.
    </p>
    <Section title="🗂 Stockage local">
      <p>QMAPS conserve de petites préférences dans le stockage local de votre navigateur (langue choisie pour les pages légales, unités de distance, recherches récentes). Ces données ne quittent pas votre appareil sans connexion.</p>
    </Section>
    <Section title="🔐 Session d'authentification">
      <p>Notre backend (Supabase auth) stocke un jeton de session dans votre navigateur pour vous garder connecté. Le supprimer vous déconnecte.</p>
    </Section>
    <Section title="📊 Événements de recommandation">
      <p>Nous enregistrons des événements anonymisés tels que vues de commerces, clics de recherche, impressions et clics de recommandations afin d'améliorer les suggestions. Ils sont dédupliqués par session.</p>
    </Section>
    <Section title="📣 Annonces sponsorisées">
      <p>Les impressions et clics sur les placements sponsorisés sont enregistrés pour les rapports commerçants et la prévention de la fraude. Aucun profil sur un réseau publicitaire externe n'est créé.</p>
    </Section>
    <Section title="💳 Facturation">
      <p>Stripe gère les données de facturation. QMAPS ne stocke pas les numéros complets de cartes et ne conserve que des références de facture.</p>
    </Section>
    <Section title="🚫 Aucun témoin publicitaire tiers">
      <p>QMAPS ne charge pas de témoins publicitaires tiers ni de témoins de suivi inter-sites à ce stade.</p>
    </Section>
    <Section title="🧹 Effacer vos données">
      <p>Vous pouvez effacer votre historique de recommandations depuis Paramètres &gt; Effacer l'historique (lorsque disponible). Vous pouvez aussi vider les données du site dans votre navigateur en tout temps.</p>
    </Section>
  </>
);

const Cookies = () => (
  <LegalPageLayout
    title={{ en: "Cookies & Tracking", fr: "Témoins et suivi" }}
    description={{
      en: "How QMAPS uses local storage, session tokens and event logs.",
      fr: "Comment QMAPS utilise le stockage local, les jetons de session et les journaux d'événements.",
    }}
    canonicalPath="/cookies"
    lastUpdated="2026-04-25"
    reviewHistory={[
      { date: "2026-04-25", en: "Initial cookies and tracking disclosure.", fr: "Divulgation initiale sur les témoins et le suivi." },
    ]}
  >
    {(lang: LegalLang) => (lang === "fr" ? renderFr() : renderEn())}
  </LegalPageLayout>
);

export default Cookies;
