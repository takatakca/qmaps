import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, Search, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import NearbyBusinessPicker from "@/components/business/NearbyBusinessPicker";
import { useNearbyBusinesses } from "@/hooks/useNearbyBusinesses";
import BusinessMediaUploader from "@/components/media/BusinessMediaUploader";
import BottomNav from "@/components/BottomNav";

const AddPhoto = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const { businesses: nearby, loading: nearbyLoading, error: nearbyError, refresh } = useNearbyBusinesses(8);
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);
  const [caption, setCaption] = useState("");

  const search = async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    const { data } = await supabase.from("businesses").select("id, name, address, image_url").ilike("name", `%${q}%`).limit(10);
    setResults(data || []);
  };

  if (!user) { navigate("/auth"); return null; }

  const list = query.length >= 2 ? results : nearby;

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-foreground" /></button>
          <h1 className="font-heading text-lg font-bold text-foreground">Ajouter photo ou vidéo</h1>
        </div>
        <button onClick={() => navigate(-1)}><X size={22} className="text-muted-foreground" /></button>
      </div>

      <div className="px-4 pt-4">
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Chercher un commerce..." value={query} onChange={e => search(e.target.value)} className="pl-10 rounded-xl" />
        </div>

        <h3 className="font-heading font-bold text-foreground mb-3">
          {selectedBusiness ? "Publier votre média" : query.length >= 2 ? "Résultats" : "Commerces à proximité"}
        </h3>
        {selectedBusiness ? (
          <div className="space-y-4 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <img src={selectedBusiness.image_url || "/placeholder.svg"} alt={selectedBusiness.name} className="h-14 w-14 rounded-lg object-cover" />
              <div>
                <p className="text-sm font-semibold text-foreground">{selectedBusiness.name}</p>
                <p className="text-xs text-muted-foreground">{selectedBusiness.address}</p>
              </div>
            </div>
            <Textarea placeholder="Ajouter une légende facultative..." value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} />
            <div className="flex gap-2">
              <BusinessMediaUploader businessId={selectedBusiness.id} userId={user.id} kind="business" onUploaded={() => navigate(`/business/${selectedBusiness.id}`)} />
              <Button variant="outline" className="rounded-full" onClick={() => setSelectedBusiness(null)}>Changer</Button>
            </div>
          </div>
        ) : (
          <NearbyBusinessPicker businesses={list} loading={nearbyLoading && query.length < 2} error={nearbyError} emptyLabel="Aucun commerce trouvé pour le moment." onSelect={setSelectedBusiness} onRefresh={refresh} />
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default AddPhoto;
