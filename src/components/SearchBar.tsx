import { LayoutGrid, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAllCategories, searchCategories } from "@/hooks/useAllCategories";

interface SearchBarProps {
  initialValue?: string;
  smart?: boolean;
  onOpenAllCategories?: () => void;
}

const ROTATING_PLACEHOLDERS = [
  "De quoi avez-vous besoin aujourd'hui ?",
  "Ex: plombier, restaurant, comptable…",
  "Décrivez votre besoin, QMAPS vous guide.",
  "Rénovation cuisine, ménage, photographe…",
];

const SearchBar = ({ initialValue = "", smart = false, onOpenAllCategories }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [phIndex, setPhIndex] = useState(0);
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();
  const rootRef = useRef<HTMLFormElement>(null);
  const { categories } = useAllCategories();

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (!smart) return;
    const t = setInterval(() => {
      setPhIndex((i) => (i + 1) % ROTATING_PLACEHOLDERS.length);
    }, 3200);
    return () => clearInterval(t);
  }, [smart]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const suggestions = useMemo(
    () => searchCategories(categories, query, 6),
    [categories, query],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setFocused(false);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const pickSuggestion = (slug: string) => {
    setFocused(false);
    setQuery("");
    navigate(`/search?category=${encodeURIComponent(slug)}`);
  };

  const placeholder = smart
    ? ROTATING_PLACEHOLDERS[phIndex]
    : "Rechercher un commerce, un service, un quartier…";

  const showSuggestions = focused && query.trim().length >= 2 && suggestions.length > 0;

  return (
    <form onSubmit={handleSubmit} className="relative" ref={rootRef}>
      <div className="group flex items-center rounded-full bg-card border border-border shadow-soft hover:shadow-elevated focus-within:shadow-glow focus-within:border-primary/40 transition-all overflow-hidden">
        <div className="pl-4">
          {smart ? (
            <Sparkles size={18} className="text-primary" />
          ) : (
            <Search size={18} className="text-primary" />
          )}
        </div>
        <input
          type="text"
          placeholder={placeholder}
          aria-label="Recherche intelligente QMAPS"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          className="flex-1 px-3 py-3.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-body transition-[placeholder] duration-300"
        />
        {query.trim() ? (
          <button
            type="submit"
            className="mr-1.5 my-1 px-4 py-2 rounded-full bg-brand-gradient text-primary-foreground text-xs font-semibold shadow-soft hover:shadow-glow transition-shadow"
          >
            Rechercher
          </button>
        ) : smart ? (
          <span className="mr-3 text-[10px] font-semibold uppercase tracking-wide text-primary/70 hidden sm:inline">
            Recherche intelligente
          </span>
        ) : null}
      </div>

      {showSuggestions && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-card border border-border shadow-elevated overflow-hidden">
          <ul className="max-h-[320px] overflow-y-auto py-1">
            {suggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pickSuggestion(s.slug);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-accent transition-colors flex items-center gap-3"
                >
                  <span className="text-lg leading-none w-6 text-center">{s.icon ?? "🔎"}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-foreground truncate">
                      {s.name}
                    </span>
                    {s.parent_name && (
                      <span className="block text-[11px] text-muted-foreground truncate">
                        dans {s.parent_name}
                      </span>
                    )}
                  </span>
                  <Sparkles size={12} className="text-primary/60" />
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-border bg-muted/30 flex">
            <button
              type="submit"
              className="flex-1 text-left px-4 py-2.5 text-xs font-semibold text-primary hover:bg-accent transition-colors flex items-center gap-2"
            >
              <Search size={12} />
              Rechercher « {query.trim()} » partout dans QMAPS
            </button>
            {onOpenAllCategories && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setFocused(false);
                  onOpenAllCategories();
                }}
                className="px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors flex items-center gap-1.5 border-l border-border"
              >
                <LayoutGrid size={12} />
                Toutes
              </button>
            )}
          </div>
        </div>
      )}
    </form>
  );
};

export default SearchBar;
