import { LayoutGrid, MapPin, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAllCategories, searchCategories } from "@/hooks/useAllCategories";

import { searchUrl } from "@/lib/localSearch";

interface SearchBarProps {
  initialCity?: string;
  initialCategory?: string;
  onCityChange?: (city: string) => void;
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

const SearchBar = ({ initialValue = "", initialCity = "", initialCategory = "", onCityChange, smart = false, onOpenAllCategories }: SearchBarProps) => {
  const [query, setQuery] = useState(initialValue);
  const [city, setCity] = useState(initialCity);
  const [phIndex, setPhIndex] = useState(0);
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();
  const rootRef = useRef<HTMLFormElement>(null);
  const { categories } = useAllCategories();

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => setCity(initialCity), [initialCity]);

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
    setFocused(false);
    navigate(searchUrl(query, city, initialCategory));
  };

  const pickSuggestion = (slug: string) => {
    setFocused(false);
    setQuery("");
    navigate(searchUrl("", city, slug));
  };

  const placeholder = smart
    ? ROTATING_PLACEHOLDERS[phIndex]
    : "Rechercher un commerce, un service, un quartier…";

  const showSuggestions = focused && query.trim().length >= 2 && suggestions.length > 0;

  return (
    <form onSubmit={handleSubmit} className="relative" ref={rootRef}>
      <div className="grid gap-1 rounded-lg border border-border bg-card p-1 text-card-foreground sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto] sm:items-center">
        <label className="flex min-w-0 items-center gap-2 px-3 focus-within:ring-2 focus-within:ring-primary">
          <Search size={17} className="shrink-0 text-primary" />
          <input
            type="search"
            placeholder={placeholder}
            aria-label="Recherche intelligente QMAPS"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={(e) => { if (e.key === "Escape") setFocused(false); }}
            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none"
          />
        </label>
        <label className="flex min-w-0 items-center gap-2 border-t border-border px-3 focus-within:ring-2 focus-within:ring-primary sm:border-l sm:border-t-0">
          <MapPin size={17} className="shrink-0 text-muted-foreground" />
          <input type="search" aria-label="Ville au Québec" placeholder="Ville au Québec"
            value={city} onChange={(e) => { setCity(e.target.value); onCityChange?.(e.target.value); }}
            onFocus={() => setFocused(false)}
            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none" />
        </label>
        <button type="submit" className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
          Rechercher
        </button>
      </div>

      {showSuggestions && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-card border border-border shadow-elevated overflow-hidden">
          <ul className="max-h-[320px] overflow-y-auto py-1">
            {suggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => pickSuggestion(s.slug)}
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
              Rechercher « {query.trim()} » {city.trim() ? `à ${city.trim()}` : "sur QMaps"}
            </button>
            {onOpenAllCategories && (
              <button
                type="button"
                onClick={() => {
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
