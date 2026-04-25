import { useState } from "react";
import LegalPageLayout, { type LegalLang } from "@/components/LegalPageLayout";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h2 className="font-heading text-base font-bold text-foreground">{title}</h2>
    <div className="space-y-2 text-muted-foreground">{children}</div>
  </section>
);

const TOPICS = [
  { value: "general", en: "General support", fr: "Support général" },
  { value: "privacy", en: "Privacy / account deletion", fr: "Vie privée / suppression de compte" },
  { value: "abuse", en: "Abuse / DMCA", fr: "Abus / DMCA" },
  { value: "billing", en: "Merchant billing", fr: "Facturation commerçant" },
  { value: "listing", en: "Business listing issue", fr: "Problème de fiche commerciale" },
];

const ContactForm = ({ lang }: { lang: LegalLang }) => {
  const [topic, setTopic] = useState("general");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const labels = lang === "fr"
    ? { topic: "Sujet", email: "Votre courriel (optionnel)", message: "Message", button: "Ouvrir le courriel", title: "📨 Formulaire de contact" }
    : { topic: "Topic", email: "Your email (optional)", message: "Message", button: "Open email", title: "📨 Contact form" };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const topicEntry = TOPICS.find((t) => t.value === topic);
    const topicLabel = topicEntry ? topicEntry[lang] : topic;
    const url = typeof window !== "undefined" ? window.location.href : "";
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const body = [
      `Topic / Sujet: ${topicLabel}`,
      email ? `Email: ${email}` : "",
      `URL: ${url}`,
      `User-Agent: ${ua}`,
      "",
      "---",
      message,
    ].filter(Boolean).join("\n");
    const subject = `[QMAPS Support] ${topicLabel}`;
    const mailto = `mailto:support@qmaps.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  return (
    <section className="space-y-3 bg-card border border-border rounded-xl p-4">
      <h2 className="font-heading text-base font-bold text-foreground">{labels.title}</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">{labels.topic}</label>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            {TOPICS.map((t) => (
              <option key={t.value} value={t.value}>{t[lang]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">{labels.email}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">{labels.message}</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground resize-y"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground rounded-md py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {labels.button}
        </button>
      </form>
    </section>
  );
};

const renderEn = () => (
  <>
    <p className="text-foreground">
      The QMAPS team is here to help users and merchants. Here is how to reach us and what to expect.
    </p>
    <Section title="📧 Contact channels">
      <ul className="list-disc pl-5 space-y-1">
        <li>General support: <a href="mailto:support@qmaps.app" className="text-primary underline">support@qmaps.app</a></li>
        <li>Privacy and data: <a href="mailto:privacy@qmaps.app" className="text-primary underline">privacy@qmaps.app</a></li>
        <li>Abuse / DMCA: <a href="mailto:abuse@qmaps.app" className="text-primary underline">abuse@qmaps.app</a></li>
        <li>Merchants and billing: <a href="mailto:business@qmaps.app" className="text-primary underline">business@qmaps.app</a></li>
      </ul>
    </Section>
    <Section title="⏱ Response times">
      <ul className="list-disc pl-5 space-y-1">
        <li>General requests: 2 business days</li>
        <li>Privacy and account deletion: 5 business days</li>
        <li>Abuse reports: 24 hours</li>
        <li>Billing disputes: 3 business days</li>
      </ul>
    </Section>
    <Section title="📝 Before contacting us">
      <p>To speed up handling, please provide:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Your account email</li>
        <li>The business name or relevant URL</li>
        <li>Screenshots if possible</li>
      </ul>
    </Section>
    <Section title="🚫 Reported content">
      <p>To report a review or business, use the "Report" button directly in the app. All reports are reviewed by a human.</p>
    </Section>
    <Section title="🌍 Language">
      <p>Support is offered in French and English.</p>
    </Section>
    <ContactForm lang="en" />
  </>
);

const renderFr = () => (
  <>
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
    <ContactForm lang="fr" />
  </>
);

const SupportPolicy = () => (
  <LegalPageLayout
    title={{ en: "Support Policy", fr: "Politique de support" }}
    description={{
      en: "How to reach QMAPS support and our response times.",
      fr: "Comment nous joindre et nos délais de réponse pour le support QMAPS.",
    }}
    canonicalPath="/support-policy"
    lastUpdated="2026-04-25"
    reviewHistory={[
      { date: "2026-04-25", en: "Initial support policy.", fr: "Politique de support initiale." },
      { date: "2026-04-25", en: "Added bilingual version and mailto support form.", fr: "Ajout de la version bilingue et du formulaire de contact mailto." },
    ]}
  >
    {(lang: LegalLang) => (lang === "fr" ? renderFr() : renderEn())}
  </LegalPageLayout>
);

export default SupportPolicy;
