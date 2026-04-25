import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import NearbyBusinessPicker from "@/components/business/NearbyBusinessPicker";
import { useNearbyBusinesses } from "@/hooks/useNearbyBusinesses";
import { useToast } from "@/hooks/use-toast";
import { useReviewTrust } from "@/hooks/useReviewTrust";
import BottomNav from "@/components/BottomNav";

const AddReview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { submitReviewForScoring } = useReviewTrust();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const { businesses: nearby, loading: nearbyLoading, error: nearbyError, refresh } = useNearbyBusinesses(8);
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const search = async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    const { data } = await supabase.from("businesses").select("id, name, address, image_url").ilike("name", `%${q}%`).limit(10);
    setResults(data || []);
  };

  const handleSave = async () => {
    if (!user || !selectedBusiness || rating < 1) return;
    setSaving(true);
    const { data: inserted, error } = await supabase.from("reviews").upsert({
      business_id: selectedBusiness.id,
      user_id: user.id,
      rating,
      body,
    }, { onConflict: "business_id,user_id" }).select("id").maybeSingle();

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Avis publié" });
      // Fire-and-forget background scoring; never blocks UX
      if (inserted?.id) void submitReviewForScoring(inserted.id);
      navigate(`/business/${selectedBusiness.id}?tab=reviews`);
    }
    setSaving(false);
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
          <Input placeholder="Chercher un commerce..." value={query} onChange={e => search(e.target.value)} className="pl-10 rounded-xl" />
        </div>

        <h3 className="font-heading font-bold text-foreground mb-3">
          {selectedBusiness ? "Votre avis" : query.length >= 2 ? "Résultats" : "Commerces à proximité"}
        </h3>
        {selectedBusiness ? (
          <div className="space-y-4 rounded-xl border border-border bg-card p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">{selectedBusiness.name}</p>
              <p className="text-xs text-muted-foreground">{selectedBusiness.address}</p>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} onClick={() => setRating(value)} className={`h-10 w-10 rounded-full border text-sm font-semibold ${rating >= value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground"}`}>
                  {value}
                </button>
              ))}
            </div>
            <Textarea placeholder="Partagez votre expérience..." value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-full" onClick={() => setSelectedBusiness(null)}>Changer</Button>
              <Button className="flex-1 rounded-full" onClick={handleSave} disabled={saving || rating < 1}>{saving ? "Envoi..." : "Publier"}</Button>
            </div>
          </div>
        ) : (
          <>
            <NearbyBusinessPicker businesses={list} loading={nearbyLoading && query.length < 2} error={nearbyError} emptyLabel="Aucun commerce trouvé pour le moment." onSelect={setSelectedBusiness} onRefresh={refresh} />
            {list.length === 0 && query.length >= 2 && <p className="text-sm text-muted-foreground py-8 text-center">Aucun résultat</p>}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default AddReview;
