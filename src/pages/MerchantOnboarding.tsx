import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Building2, MapPin, Phone, Globe, ChevronRight, Check } from "lucide-react";

const steps = [
  { title: "Informations de base", icon: Building2 },
  { title: "Adresse", icon: MapPin },
  { title: "Contact & Web", icon: Globe },
];

const MerchantOnboarding = () => {
  const { user, loading: authLoading, refreshRoles } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);

  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Montréal");
  const [region, setRegion] = useState("QC");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");

  // Phase 6: Detect already-onboarded merchants and skip the form to prevent
  // duplicate `businesses` rows for the same owner.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth?role=merchant");
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_user_id", user.id)
        .limit(1);
      if (cancelled) return;
      if (biz && biz.length > 0) {
        // Ensure role is set then bounce to dashboard.
        await supabase.from("user_roles").upsert({ user_id: user.id, role: "merchant" as any });
        await refreshRoles();
        navigate("/merchant", { replace: true });
        return;
      }
      setCheckingExisting(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);


  const canNext = () => {
    if (step === 0) return businessName.trim().length > 0;
    if (step === 1) return address.trim().length > 0 && city.trim().length > 0;
    return true;
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);

    // Update profile with owner name
    if (ownerName) {
      await supabase.from("profiles").update({ display_name: ownerName }).eq("id", user.id);
    }

    // Create business
    const { data, error } = await supabase
      .from("businesses")
      .insert({
        name: businessName,
        description: description || null,
        address,
        city,
        region,
        postal_code: postalCode || null,
        phone: phone || null,
        website: website || null,
        owner_user_id: user.id,
        is_claimed: true,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Ensure merchant role
    await supabase.from("user_roles").upsert({ user_id: user.id, role: "merchant" as any });

    toast({ title: "Profil créé!", description: "Bienvenue sur QMAPS Professional." });
    navigate("/merchant");
    setLoading(false);
  };

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Chargement...</p></div>;
  }

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <div className="px-4 pt-4">
        <button onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
      </div>

      <div className="px-6 pt-6">
        <h1 className="font-heading text-xl font-bold text-foreground mb-1">Configuration du profil</h1>
        <p className="text-sm text-muted-foreground mb-6">Étape {step + 1} sur {steps.length}</p>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de l'entreprise *</Label>
              <Input placeholder="Ex: Café Montréal" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Nom du propriétaire</Label>
              <Input placeholder="Votre nom complet" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                placeholder="Décrivez votre entreprise..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px]"
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Adresse *</Label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <Input placeholder="123 Rue Principale" value={address} onChange={(e) => setAddress(e.target.value)} className="pl-10" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Ville *</Label>
                <Input placeholder="Montréal" value={city} onChange={(e) => setCity(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Province</Label>
                <Input placeholder="QC" value={region} onChange={(e) => setRegion(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Code postal</Label>
              <Input placeholder="H2X 1Y4" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <Input placeholder="+1 (514) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Site web</Label>
              <div className="relative">
                <Globe size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <Input placeholder="https://monsite.com" value={website} onChange={(e) => setWebsite(e.target.value)} className="pl-10" />
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="w-full rounded-full gap-2">
              Continuer <ChevronRight size={16} />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={loading || !canNext()} className="w-full rounded-full gap-2">
              {loading ? "Création..." : <><Check size={16} /> Terminer et accéder au dashboard</>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MerchantOnboarding;
