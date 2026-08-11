import { Globe, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LANGUAGES, useLang } from "@/i18n/language";

const LanguageSwitcher = () => {
  const { lang, setLang, t } = useLang();
  const active = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <Popover>
      <PopoverTrigger
        aria-label={t("language")}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-soft transition-shadow hover:shadow-glow"
      >
        <Globe size={13} className="text-primary" />
        {active.code.toUpperCase()}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-1">
        <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t("language")}
        </p>
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className="flex w-full items-center justify-between rounded-md px-2 py-2 text-sm text-foreground hover:bg-accent"
          >
            <span className="flex items-center gap-2">
              <span aria-hidden>{l.flag}</span> {l.label}
            </span>
            {l.code === lang && <Check size={14} className="text-primary" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};

export default LanguageSwitcher;
