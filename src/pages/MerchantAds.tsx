import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, X, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import AdStepGoal from "@/components/ads/AdStepGoal";
import AdStepPhoto from "@/components/ads/AdStepPhoto";
import AdStepText from "@/components/ads/AdStepText";
import AdStepKeywords from "@/components/ads/AdStepKeywords";
import AdStepLocation from "@/components/ads/AdStepLocation";
import AdStepBudget from "@/components/ads/AdStepBudget";
import AdStepPayment from "@/components/ads/AdStepPayment";
import AdPreviewCard from "@/components/ads/AdPreviewCard";
import type { Tables } from "@/integrations/supabase/types";

export interface AdFormData {
  goal: "optimize" | "calls" | "clicks";
  callForwarding: boolean;
  websiteUrl: string;
  photoUrl: string;
  smartPhotoSelection: boolean;
  adText: string;
  smartTextSelection: boolean;
  keywords: string[];
  boostedKeywords: string[];
  locationRadius: number;
  budgetPreset: number;
  customBudget: number | null;
  upgradePackage: boolean;
}

const defaultFormData: AdFormData = {
  goal: "optimize",
  callForwarding: true,
  websiteUrl: "",
  photoUrl: "",
  smartPhotoSelection: true,
  adText: "",
  smartTextSelection: true,
  keywords: [],
  boostedKeywords: [],
  locationRadius: 25,
  budgetPreset: 24,
  customBudget: null,
  upgradePackage: true,
};

const STEP_LABELS = ["Objectif", "Photo", "Texte", "Mots-clés", "Zone", "Budget", "Paiement"];

const MerchantAds = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<AdFormData>(defaultFormData);
  const [business, setBusiness] = useState<Tables<"businesses"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResume, setShowResume] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    fetchBusiness();
  }, [user, authLoading]);

  const fetchBusiness = async () => {
    const { data } = await supabase.from("businesses").select("*").eq("owner_user_id", user!.id).limit(1).single();
    setBusiness(data);
    if (data) {
      setFormData(prev => ({
        ...prev,
        adText: data.description || `${data.name} — ${data.address}`,
        websiteUrl: data.website || "",
        photoUrl: data.image_url || "",
      }));
    }
    setLoading(false);
  };

  const update = (partial: Partial<AdFormData>) => setFormData(prev => ({ ...prev, ...partial }));

  const goNext = () => {
    setCompletedSteps(prev => prev.includes(step) ? prev : [...prev, step]);
    if (step < 6) setStep(step + 1);
  };
  const goBack = () => { if (step > 0) setStep(step - 1); };

  if (authLoading || loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Chargement...</p></div>;
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <h2 className="font-heading text-xl font-bold text-foreground mb-2">Aucune entreprise</h2>
        <p className="text-sm text-muted-foreground mb-4">Créez d'abord une entreprise dans le tableau de bord FLEXS</p>
        <Button onClick={() => navigate("/merchant")} className="rounded-full">Aller au Dashboard</Button>
      </div>
    );
  }

  // Resume screen
  if (showResume) {
    return (
      <div className="min-h-screen bg-background max-w-lg mx-auto">
        <div className="p-4">
          <button onClick={() => setShowResume(false)} className="absolute top-4 right-4"><X size={22} className="text-foreground" /></button>
          <div className="bg-card rounded-xl border border-border p-4 mb-6">
            <div className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full w-fit mx-auto mb-3">
              Aperçu de votre pub sur QMAPS
            </div>
            <AdPreviewCard business={business} formData={formData} />
          </div>
          <h2 className="font-heading text-2xl font-bold text-foreground mb-1">Bon retour! Terminons votre publicité QMAPS</h2>
          <p className="text-sm text-muted-foreground mb-6">{completedSteps.length}/7 étapes complétées</p>
          <div className="space-y-3 mb-8">
            {STEP_LABELS.map((label, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${completedSteps.includes(i) ? "bg-primary" : "bg-muted"}`}>
                  <Check size={14} className={completedSteps.includes(i) ? "text-primary-foreground" : "text-muted-foreground"} />
                </div>
                <span className={`text-sm ${completedSteps.includes(i) ? "text-foreground font-medium" : "text-muted-foreground"}`}>{label}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowResume(false)} className="flex-1 text-sm font-medium text-primary">Modifier les étapes</button>
            <Button onClick={() => { setShowResume(false); setStep(completedSteps.length); }} className="flex-1 rounded-full gap-2 bg-primary">
              Continuer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={goBack} className={step === 0 ? "invisible" : ""}><ArrowLeft size={22} className="text-foreground" /></button>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Étape {step + 1} de 7</p>
            <h1 className="font-heading text-base font-bold text-foreground">{STEP_LABELS[step]}</h1>
          </div>
          <button onClick={() => navigate("/merchant")}><X size={22} className="text-muted-foreground" /></button>
        </div>
        <Progress value={((step + 1) / 7) * 100} className="mt-2 h-1" />
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto p-4">
        {step === 0 && <AdStepGoal formData={formData} update={update} />}
        {step === 1 && <AdStepPhoto formData={formData} update={update} business={business} />}
        {step === 2 && <AdStepText formData={formData} update={update} />}
        {step === 3 && <AdStepKeywords formData={formData} update={update} />}
        {step === 4 && <AdStepLocation formData={formData} update={update} business={business} />}
        {step === 5 && <AdStepBudget formData={formData} update={update} />}
        {step === 6 && <AdStepPayment formData={formData} update={update} business={business} />}

        {/* Ad Preview */}
        {step < 6 && (
          <div className="mt-6 bg-muted/50 rounded-2xl p-4">
            <div className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full w-fit mx-auto mb-3">
              Aperçu de votre pub sur QMAPS
            </div>
            <AdPreviewCard business={business} formData={formData} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-card border-t border-border p-4">
        {step === 3 ? (
          <div className="flex gap-3">
            <Button variant="outline" onClick={goNext} className="flex-1 rounded-full">Passer pour l'instant</Button>
            <Button onClick={goNext} className="flex-1 rounded-full gap-2">Suivant <ChevronRight size={16} /></Button>
          </div>
        ) : step === 6 ? (
          <Button onClick={() => navigate("/merchant/billing/plans")} className="w-full rounded-full bg-primary text-primary-foreground font-bold">
            Bientôt disponible · Voir les plans
          </Button>
        ) : (
          <Button onClick={goNext} className="w-full rounded-full gap-2">Suivant <ChevronRight size={16} /></Button>
        )}
      </div>
    </div>
  );
};

export default MerchantAds;
