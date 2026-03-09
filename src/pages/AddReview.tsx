import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";

const AddReview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [nearby, setNearby] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadNearby = async () => {
    if (loaded) return;
    const { data } = await supabase.from("businesses").select("id, name, address, image_url").limit(10);
    setNearby(data || []);
    setLoaded(true);
  };

  const search = async (q: string) => {
    setQuery(q);
    if (!loaded) loadNearby();
    if (q.length < 2) { setResults([]); return; }
    const { data } = await supabase.from("businesses").select("id, name, address, image_url").ilike("name", `%${q}%`).limit(10);
    setResults(data || []);
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  const list = query.length >= 2 ? results : nearby;

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-foreground" /></button>
          <h1 className="font-heading text-lg font-bold text-foreground">Ajouter un avis</h1>
        </div>
        <button onClick={() => navigate(-1)}><X size={22} className="text-muted-foreground" /></button>
      </div>

      <div className="px-4 pt-4">
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Chercher un commerce..."
            value={query}
            onChange={e => search(e.target.value)}
            onFocus={() => loadNearby()}
            className="pl-10 rounded-xl"
          />
        </div>

        <h3 className="font-heading font-bold text-foreground mb-3">
          {query.length >= 2 ? "Résultats" : "Commerces à proximité"}
        </h3>
        <div className="divide-y divide-border">
          {list.map(b => (
            <button key={b.id} onClick={() => navigate(`/business/${b.id}?tab=reviews`)} className="w-full flex items-center gap-3 py-3">
              <img src={b.image_url || "/placeholder.svg"} alt="" className="w-14 h-14 rounded-lg object-cover" />
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">{b.name}</p>
                <p className="text-xs text-muted-foreground">{b.address}</p>
              </div>
            </button>
          ))}
          {list.length === 0 && query.length >= 2 && (
            <p className="text-sm text-muted-foreground py-8 text-center">Aucun résultat</p>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default AddReview;
