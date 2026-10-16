import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, Search, Store, MapPin, User, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import type { BusinessSearchHit } from "@/lib/business";

type Step = "relationship" | "search" | "form";

const AddBusiness = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("relationship");
  const [relationship, setRelationship] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BusinessSearchHit[]>([]);
  const [form, setForm] = useState({ name: "", address: "", city: "", phone: "", website: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchRequest = useRef(0);
  const submitInFlight = useRef(false);

  useEffect(() => () => { searchRequest.current += 1; }, []);

  const searchBusinesses = async (q: string) => {
    const request = ++searchRequest.current;
    setQuery(q);
    setSearchError(null);
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    try {
      const { data, error } = await supabase.from("businesses")
        .select("id, name, address, image_url")
        .ilike("name", `%${term.slice(0, 100)}%`)
        .limit(10);
      if (request !== searchRequest.current) return;
      if (error) throw error;
      setResults(data ?? []);
    } catch (error) {
      if (request !== searchRequest.current) return;
      setResults([]);
      setSearchError(error instanceof Error ? error.message : "Recherche impossible");
    } finally {
      if (request === searchRequest.current) setSearchLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) { navigate("/auth"); return; }
    if (submitInFlight.current) return; // A rapid double-click cannot create duplicate listings.
    if (form.name.trim().length < 2 || form.address.trim().length < 3 || form.city.trim().length < 2) {
      toast({ title: "Nom, adresse et ville requis", variant: "destructive" });
      return;
    }
    submitInFlight.current = true;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("businesses").insert({
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        region: "QC",
        phone: form.phone.trim() || null,
        website: form.website.trim() || null,
        description: form.description.trim() || null,
        owner_user_id: relationship === "owner" ? user.id : null,
        is_claimed: false,
      });
      if (error) throw error;
      toast({ title: "Commerce ajouté!", description: "Les renseignements seront affichés conformément aux règles de publication QMAPS." });
      navigate(relationship === "owner" ? "/merchant" : "/");
    } catch (error) {
      toast({
        title: "Ajout non confirmé",
        description: error instanceof Error ? error.message : "Le commerce n'a pas pu être enregistré.",
        variant: "destructive",
      });
    } finally {
      submitInFlight.current = false;
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto flex flex-col items-center justify-center px-4">
        <Store size={48} className="text-muted-foreground mb-4" />
        <p className="text-foreground font-semibold mb-4">Connectez-vous pour ajouter un commerce</p>
        <Button onClick={() => navigate("/auth")} className="rounded-full">Se connecter</Button>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => step === "relationship" ? navigate(-1) : setStep(step === "form" ? "search" : "relationship")}>
            <ArrowLeft size={22} className="text-foreground" />
          </button>
          <h1 className="font-heading text-lg font-bold text-foreground">
            {step === "relationship" ? "Ajouter un commerce" : step === "search" ? "Chercher un commerce" : "Nouveau commerce"}
          </h1>
        </div>
        <button onClick={() => navigate(-1)}><X size={22} className="text-muted-foreground" /></button>
      </div>

      {step === "relationship" && (
        <div className="px-4 pt-8">
          <div className="text-center mb-8">
            <div className="w-48 h-32 bg-muted rounded-2xl mx-auto flex items-center justify-center mb-4">
              <Store size={48} className="text-muted-foreground" />
            </div>
            <h2 className="font-heading text-lg font-bold text-foreground">Ajouter un commerce</h2>
            <p className="text-sm text-muted-foreground mt-2">Quel est votre lien avec ce commerce?</p>
          </div>
          <div className="space-y-3">
            <button onClick={() => { setRelationship("customer"); setStep("search"); }} className="w-full p-4 border border-border rounded-xl text-center text-foreground font-medium hover:bg-accent/50 transition-colors flex items-center justify-center gap-3">
              <User size={20} /> Je suis un client
            </button>
            <button onClick={() => { setRelationship("owner"); setStep("search"); }} className="w-full p-4 border border-border rounded-xl text-center text-foreground font-medium hover:bg-accent/50 transition-colors flex items-center justify-center gap-3">
              <Briefcase size={20} /> Je suis propriétaire ou gestionnaire
            </button>
          </div>
        </div>
      )}

      {step === "search" && (
        <div className="px-4 pt-4">
          <div className="relative mb-4">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Chercher un commerce..."
              value={query}
              onChange={e => searchBusinesses(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
          <h3 className="font-heading font-bold text-foreground mb-3">Résultats de recherche</h3>
          {searchLoading && <p role="status" className="text-sm text-muted-foreground mb-3">Recherche en cours…</p>}
          {searchError && <p role="alert" className="text-sm text-destructive mb-3">Recherche impossible : {searchError}</p>}
          {!searchLoading && !searchError && query.trim().length >= 2 && results.length === 0 && (
            <p className="text-sm text-muted-foreground mb-3">Aucun commerce trouvé avec ce nom.</p>
          )}
          <div className="divide-y divide-border">
            {results.map(b => (
              <button key={b.id} onClick={() => navigate(`/business/${b.id}`)} className="w-full flex items-center gap-3 py-3">
                <img src={b.image_url || "/placeholder.svg"} alt="" className="w-14 h-14 rounded-lg object-cover" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">{b.name}</p>
                  <p className="text-xs text-muted-foreground">{b.address}</p>
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => setStep("form")} className="w-full mt-6 py-3 text-sm font-medium text-primary">
            Commerce introuvable? Ajoutez-le →
          </button>
        </div>
      )}

      {step === "form" && (
        <div className="px-4 pt-4 space-y-4">
          <Input placeholder="Nom du commerce *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="rounded-xl" />
          <Input placeholder="Adresse *" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="rounded-xl" />
          <Input aria-label="Ville du commerce" placeholder="Ville * (Québec)" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="rounded-xl" />
          <Input placeholder="Téléphone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="rounded-xl" />
          <Input placeholder="Site web" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} className="rounded-xl" />
          <Textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="rounded-xl" />
          <Button onClick={handleSubmit} className="w-full rounded-full" disabled={submitting}>
            {submitting ? "Ajout..." : "Ajouter le commerce"}
          </Button>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default AddBusiness;
