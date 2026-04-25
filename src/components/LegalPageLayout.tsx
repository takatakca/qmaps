import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Seo from "@/components/Seo";
import BottomNav from "@/components/BottomNav";

export type LegalLang = "en" | "fr";
const STORAGE_KEY = "qmaps:legal-language";

export const getStoredLegalLang = (): LegalLang => {
  if (typeof window === "undefined") return "en";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "fr" ? "fr" : "en";
};

export interface ReviewHistoryEntry {
  date: string;
  en: string;
  fr: string;
}

interface LegalPageLayoutProps {
  title: { en: string; fr: string };
  description: { en: string; fr: string };
  canonicalPath: string;
  lastUpdated: string;
  reviewHistory: ReviewHistoryEntry[];
  children: (lang: LegalLang) => ReactNode;
}

const LABELS = {
  en: {
    back: "Back",
    lastUpdated: "Last updated",
    reviewHistory: "Review history",
    contact: "For any question, write to us at",
    english: "English",
    french: "Français",
  },
  fr: {
    back: "Retour",
    lastUpdated: "Dernière mise à jour",
    reviewHistory: "Historique des révisions",
    contact: "Pour toute question, écrivez-nous à",
    english: "English",
    french: "Français",
  },
} as const;

const LegalPageLayout = ({
  title,
  description,
  canonicalPath,
  lastUpdated,
  reviewHistory,
  children,
}: LegalPageLayoutProps) => {
  const navigate = useNavigate();
  const [lang, setLang] = useState<LegalLang>(getStoredLegalLang);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, lang);
    }
  }, [lang]);

  const t = LABELS[lang];

  return (
    <div className="min-h-screen bg-background pb-24 max-w-2xl mx-auto">
      <Seo
        title={`${title[lang]} · QMAPS`}
        description={description[lang]}
        canonicalPath={canonicalPath}
        type="article"
      />
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center gap-3 px-4 py-3 pt-safe">
        <button onClick={() => navigate(-1)} aria-label={t.back}>
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <h1 className="font-heading text-lg font-bold text-foreground truncate flex-1">
          {title[lang]}
        </h1>
        <div className="flex items-center rounded-full border border-border overflow-hidden text-xs">
          <button
            onClick={() => setLang("en")}
            className={`px-2.5 py-1 transition-colors ${
              lang === "en" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
            }`}
            aria-pressed={lang === "en"}
          >
            EN
          </button>
          <button
            onClick={() => setLang("fr")}
            className={`px-2.5 py-1 transition-colors ${
              lang === "fr" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
            }`}
            aria-pressed={lang === "fr"}
          >
            FR
          </button>
        </div>
      </div>

      <article className="px-4 py-6 space-y-5 text-sm leading-relaxed text-foreground">
        <p className="text-xs text-muted-foreground">
          {t.lastUpdated}: {lastUpdated}
        </p>
        {children(lang)}

        <section className="space-y-2 pt-4 border-t border-border">
          <h2 className="font-heading text-base font-bold text-foreground">{t.reviewHistory}</h2>
          <ul className="space-y-1 text-muted-foreground">
            {reviewHistory.map((entry, i) => (
              <li key={i} className="text-xs">
                <span className="font-mono text-foreground">{entry.date}</span> — {entry[lang]}
              </li>
            ))}
          </ul>
        </section>

        <div className="pt-4 border-t border-border text-xs text-muted-foreground">
          <p>
            {t.contact}{" "}
            <a href="mailto:support@qmaps.app" className="text-primary underline">
              support@qmaps.app
            </a>
            .
          </p>
        </div>
      </article>

      <BottomNav />
    </div>
  );
};

export default LegalPageLayout;
