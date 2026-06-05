import { Search, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface SearchBarProps {
  initialValue?: string;
  smart?: boolean;
}

const ROTATING_PLACEHOLDERS = [
  "De quoi avez-vous besoin aujourd'hui ?",
  "Ex: plombier, restaurant, comptable…",
  "Décrivez votre besoin, QMAPS vous guide.",
  "Rénovation cuisine, ménage, photographe…",
];

const SearchBar = ({ initialValue = "", smart = false }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [phIndex, setPhIndex] = useState(0);
  const navigate = useNavigate();

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const placeholder = smart
    ? ROTATING_PLACEHOLDERS[phIndex]
    : "Rechercher un commerce, un service, un quartier…";

  return (
    <form onSubmit={handleSubmit} className="relative">
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
    </form>
  );
};

export default SearchBar;
