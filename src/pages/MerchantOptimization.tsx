import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MerchantBottomNav from "@/components/MerchantBottomNav";
import {
  ArrowLeft, Megaphone, Zap, TrendingUp, Eye, Star,
  MousePointerClick, Crown, Rocket, ChevronRight, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";

const packages = [
  {
    id: "boost",
    icon: Zap,
    name: "Boost Local",
    desc: "Apparaissez en haut des résultats dans votre zone.",
    price: "CA$5/jour",
    features: ["Position prioritaire", "Zone de 15 km", "Rapport de clics"],
    popular: false,
  },
  {
    id: "premium",
    icon: Crown,
    name: "Premium Visibilité",
    desc: "Maximum d'exposition avec badge vérifié et mise en avant.",
    price: "CA$12/jour",
    features: ["Top résultats", "Badge vérifié", "Photos mises en avant", "Statistiques avancées"],
    popular: true,
  },
  {
    id: "campaign",
    icon: Megaphone,
    name: "Campagne Publicitaire",
    desc: "Créez une publicité ciblée avec texte et image personnalisés.",
    price: "À partir de CA$8/jour",
    features: ["Texte personnalisé", "Image de pub", "Mots-clés ciblés", "Zone géographique"],
    popular: false,
  },
];

const metrics = [
  { icon: Eye, label: "Impressions", value: "—", change: "+0%" },
  { icon: MousePointerClick, label: "Clics", value: "—", change: "+0%" },
  { icon: Star, label: "Leads", value: "—", change: "+0%" },
  { icon: TrendingUp, label: "ROI", value: "—", change: "—" },
];

const MerchantOptimization = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Tables<"businesses"> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    supabase
      .from("businesses")
      .select("*")
      .eq("owner_user_id", user.id)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setBusiness(data);
        setLoading(false);
      });
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Chargement...</p></div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/merchant/home")}><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="font-heading text-lg font-bold text-foreground flex-1">Optimisation & Publicité</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Active promotions */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-heading font-bold text-foreground mb-3">Promotions actives</h3>
          <div className="text-center py-6">
            <Rocket size={32} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Aucune promotion active</p>
            <p className="text-xs text-muted-foreground mt-1">Lancez une campagne pour booster votre visibilité.</p>
          </div>
        </div>

        {/* Campaign metrics */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-heading font-bold text-foreground mb-3">Performance</h3>
          <div className="grid grid-cols-2 gap-3">
            {metrics.map((m, i) => (
              <div key={i} className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <m.icon size={14} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{m.label}</span>
                </div>
                <p className="text-lg font-bold text-foreground">{m.value}</p>
                <span className="text-[10px] text-green-600">{m.change}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Packages */}
        <div>
          <h3 className="font-heading font-bold text-foreground mb-3">Forfaits disponibles</h3>
          <div className="space-y-3">
            {packages.map(pkg => (
              <div key={pkg.id} className={`bg-card rounded-xl border p-4 relative ${pkg.popular ? "border-primary" : "border-border"}`}>
                {pkg.popular && (
                  <span className="absolute -top-2.5 right-3 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Populaire
                  </span>
                )}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <pkg.icon size={20} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground text-sm">{pkg.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{pkg.desc}</p>
                    <p className="text-sm font-bold text-primary mt-2">{pkg.price}</p>
                    <div className="mt-2 space-y-1">
                      {pkg.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 size={12} className="text-green-500" />
                          <span className="text-xs text-muted-foreground">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => pkg.id === "campaign" ? navigate("/merchant/ads") : null}
                  size="sm"
                  className="w-full rounded-full mt-3 gap-1"
                  variant={pkg.popular ? "default" : "outline"}
                >
                  Activer <ChevronRight size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Custom ad CTA */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 text-center">
          <h3 className="font-heading font-bold text-foreground mb-1">Publicité personnalisée</h3>
          <p className="text-xs text-muted-foreground mb-3">Créez une campagne sur mesure avec votre texte, photo et budget.</p>
          <Button onClick={() => navigate("/merchant/ads")} className="rounded-full gap-1">
            <Megaphone size={14} /> Créer une publicité
          </Button>
        </div>
      </div>

      <MerchantBottomNav />
    </div>
  );
};

export default MerchantOptimization;
