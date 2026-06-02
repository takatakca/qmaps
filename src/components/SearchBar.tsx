import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface SearchBarProps {
  initialValue?: string;
}

const SearchBar = ({ initialValue = "" }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="group flex items-center rounded-full bg-card border border-border shadow-soft hover:shadow-elevated focus-within:shadow-glow focus-within:border-primary/40 transition-all overflow-hidden">
        <div className="pl-4">
          <Search size={18} className="text-primary" />
        </div>
        <input
          type="text"
          placeholder="Rechercher un commerce, un service, un quartier…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 px-3 py-3.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-body"
        />
        {query.trim() && (
          <button
            type="submit"
            className="mr-1.5 my-1 px-4 py-2 rounded-full bg-brand-gradient text-primary-foreground text-xs font-semibold shadow-soft hover:shadow-glow transition-shadow"
          >
            Rechercher
          </button>
        )}
      </div>
    </form>
  );
};

export default SearchBar;
