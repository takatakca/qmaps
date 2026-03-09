import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, Search, Store, MapPin, User, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";

type Step = "relationship" | "search" | "form";

const AddBusiness = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("relationship");
  const [relationship, setRelationship] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", address: "", phone: "", website: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const searchBusinesses = async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    const { data } = await supabase.from("businesses").select("id, name, address, image_url").ilike("name", `%${q}%`).limit(10);
    setResults(data || []);
  };

  const handleSubmit = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!form.name || !form.address) { toast({ title: "Nom et adresse requis", variant: "destructive" }); return; }
    setSubmitting(true);
    const { error } = await supabase.from("businesses").insert({
      name: form.name,
      address: form.address,
      phone: form.phone || null,
      website: form.website || null,
      description: form.description || null,
      owner_user_id: relationship === "owner" ? user.id : null,
    });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Commerce ajouté!" });
      navigate("/");
    }
    setSubmitting(false);
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
              <Briefcase size={20} /> J'y travaille
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
          <h3 className="font-heading font-bold text-foreground mb-3">Commerces à proximité</h3>
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
