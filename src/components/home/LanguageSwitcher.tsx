import { Globe, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LANGUAGES, useLang } from "@/i18n/language";
import { cn } from "@/lib/utils";

export const headerTriggerClass = (tone: "light" | "dark") =>
  cn(
    "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    tone === "dark"
      ? "border-white/25 bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
      : "border-border bg-card text-foreground shadow-soft hover:shadow-glow",
  );

const LanguageSwitcher = ({ tone = "light" }: { tone?: "light" | "dark" }) => {
  const { lang, setLang, t } = useLang();
  const active = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <Popover>
      <PopoverTrigger aria-label={t("language")} className={headerTriggerClass(tone)}>
        <Globe size={13} />
        {active.code.toUpperCase()}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-1">
        <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {t("language")}
        </p>
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-accent",
              l.code === lang ? "font-semibold text-foreground" : "text-foreground/80",
            )}
          >
            <span className="flex items-center gap-2">
              <span className="w-6 text-[11px] font-bold text-muted-foreground">{l.code.toUpperCase()}</span>
              {l.label}
            </span>
            {l.code === lang && <Check size={14} className="text-primary" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};

export default LanguageSwitcher;
