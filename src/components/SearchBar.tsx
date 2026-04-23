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
      <div className="flex items-center rounded-full bg-card border border-border shadow-sm overflow-hidden">
        <div className="pl-4">
          <Search size={18} className="text-primary" />
        </div>
        <input
          type="text"
          placeholder="Rechercher salons de coiffure..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 px-3 py-3 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-body"
        />
      </div>
    </form>
  );
};

export default SearchBar;
