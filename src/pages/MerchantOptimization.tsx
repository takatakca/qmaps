import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MerchantBottomNav from "@/components/MerchantBottomNav";
import {
  ArrowLeft, Megaphone, Zap, TrendingUp, Eye, Star,
  MousePointerClick, Crown, Rocket, ChevronRight, CheckCircle2,
  Target, MapPinned, BadgeDollarSign, LineChart, Sparkles, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
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

const boosters = [
  {
    icon: Target,
    title: "Boost de visibilité locale",
    description: "Passez devant les concurrents dans votre secteur avec une présence prioritaire.",
    cta: "Activer Boost",
  },
  {
    icon: MapPinned,
    title: "Zone géographique ciblée",
    description: "Choisissez précisément votre rayon de diffusion et concentrez votre budget là où ça convertit.",
    cta: "Définir la zone",
  },
  {
    icon: LineChart,
    title: "Suivi des performances",
    description: "Mesurez les clics, appels et leads générés pour ajuster vos campagnes plus vite.",
    cta: "Voir les stats",
  },
];

const revenueLevers = [
  "Annonces sponsorisées avec budget journalier",
  "Position prioritaire dans les résultats QMAPS",
  "Mise en avant de l'offre et du call-to-action",
  "Visibilité renforcée sur mobile à proximité",
];

const MerchantOptimization = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [business, setBusiness] = useState<Tables<"businesses"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState("premium");
  const [dailyBudget, setDailyBudget] = useState(18);
  const [radiusKm, setRadiusKm] = useState(12);
  const [callsEnabled, setCallsEnabled] = useState(true);
  const [webClicksEnabled, setWebClicksEnabled] = useState(true);
  const [priorityPlacement, setPriorityPlacement] = useState(true);
  const [campaignName, setCampaignName] = useState("Campagne locale QMAPS");
  const [campaignPublished, setCampaignPublished] = useState(false);

  const estimatedClicks = useMemo(() => Math.round(dailyBudget * 34), [dailyBudget]);
  const estimatedLeads = useMemo(() => Math.max(4, Math.round(dailyBudget * 1.6)), [dailyBudget]);
  const monthlyCap = useMemo(() => dailyBudget * 30, [dailyBudget]);
  const selectedPackageData = useMemo(() => packages.find((pkg) => pkg.id === selectedPackage) ?? packages[0], [selectedPackage]);

  const goToBilling = () => {
    toast({
      title: "Bientôt disponible",
      description: "Les campagnes publicitaires QMAPS arrivent. En attendant, gérez votre abonnement.",
    });
    navigate("/merchant/billing/plans");
  };

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

  const businessName = business?.name || "Votre entreprise";

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/merchant/home")}><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="font-heading text-lg font-bold text-foreground flex-1">Optimisation & Publicité</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <BadgeDollarSign size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Moteur de revenus</p>
              <h2 className="mt-1 font-heading text-lg font-bold text-foreground">Développez {businessName} avec QMAPS Ads</h2>
              <p className="mt-1 text-sm text-muted-foreground">Créez des campagnes, activez des boosts et transformez la visibilité locale en appels, clics et demandes clients.</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {revenueLevers.map((item) => (
              <div key={item} className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground">
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Active promotions */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-heading font-bold text-foreground mb-3">Promotions actives</h3>
          {campaignPublished ? (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{campaignName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{selectedPackageData.name} • {radiusKm} km • CA${dailyBudget}/jour</p>
                </div>
                <span className="rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground">Active</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-card p-2">
                  <p className="text-[10px] text-muted-foreground">Clics</p>
                  <p className="text-sm font-bold text-foreground">{estimatedClicks}</p>
                </div>
                <div className="rounded-md bg-card p-2">
                  <p className="text-[10px] text-muted-foreground">Leads</p>
                  <p className="text-sm font-bold text-foreground">{estimatedLeads}</p>
                </div>
                <div className="rounded-md bg-card p-2">
                  <p className="text-[10px] text-muted-foreground">Budget</p>
                  <p className="text-sm font-bold text-foreground">CA${monthlyCap}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Rocket size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Aucune promotion active</p>
              <p className="text-xs text-muted-foreground mt-1">Lancez une campagne pour booster votre visibilité.</p>
            </div>
          )}
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

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-foreground">Boosts de visibilité</h3>
            <span className="text-[10px] font-bold uppercase tracking-wide text-primary">QMAPS</span>
          </div>
          <div className="space-y-3">
            {boosters.map((booster) => (
              <div key={booster.title} className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <booster.icon size={18} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{booster.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{booster.description}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full rounded-full"
                  onClick={() => navigate("/merchant/ads")}
                >
                  {booster.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-heading font-bold text-foreground">Contrôle de revenu</h3>
              <p className="text-xs text-muted-foreground mt-1">Ajustez votre budget, votre rayon et vos leviers de conversion avant publication.</p>
            </div>
            <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">Bêta marchand</span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Budget journalier</span>
              <span className="text-sm font-bold text-primary">CA${dailyBudget}/jour</span>
            </div>
            <Slider value={[dailyBudget]} min={5} max={60} step={1} onValueChange={([value]) => setDailyBudget(value)} />
            <p className="mt-2 text-xs text-muted-foreground">Plafond mensuel estimé: CA${monthlyCap}</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Rayon de diffusion</span>
              <span className="text-sm font-bold text-primary">{radiusKm} km</span>
            </div>
            <Slider value={[radiusKm]} min={3} max={40} step={1} onValueChange={([value]) => setRadiusKm(value)} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Recevoir des appels</p>
                <p className="text-xs text-muted-foreground">Favorise les prospects prêts à contacter l’entreprise.</p>
              </div>
              <Switch checked={callsEnabled} onCheckedChange={setCallsEnabled} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Trafic web</p>
                <p className="text-xs text-muted-foreground">Pousse les visiteurs vers votre site ou votre menu.</p>
              </div>
              <Switch checked={webClicksEnabled} onCheckedChange={setWebClicksEnabled} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Placement prioritaire</p>
                <p className="text-xs text-muted-foreground">Ajoute une mise en avant locale dans les résultats.</p>
              </div>
              <Switch checked={priorityPlacement} onCheckedChange={setPriorityPlacement} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Clics estimés / mois</p>
              <p className="text-lg font-bold text-foreground">{estimatedClicks}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Leads estimés / mois</p>
              <p className="text-lg font-bold text-foreground">{estimatedLeads}</p>
            </div>
          </div>
        </div>

        {/* Packages */}
        <div>
          <h3 className="font-heading font-bold text-foreground mb-3">Forfaits disponibles</h3>
          <div className="space-y-3">
            {packages.map(pkg => (
              <div key={pkg.id} className={`bg-card rounded-xl border p-4 relative ${selectedPackage === pkg.id || pkg.popular ? "border-primary" : "border-border"}`}>
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
                  onClick={() => setSelectedPackage(pkg.id)}
                  size="sm"
                  className="w-full rounded-full mt-3 gap-1"
                  variant={selectedPackage === pkg.id || pkg.popular ? "default" : "outline"}
                >
                  {selectedPackage === pkg.id ? <>Sélectionné <Check size={14} /></> : <>Activer <ChevronRight size={14} /></>}
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

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-primary" />
            <h3 className="font-heading font-bold text-foreground">Campagnes et acquisition</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Lancez des campagnes orientées appels, clics web ou visibilité générale, puis optimisez-les selon vos objectifs.
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span className="text-sm text-foreground">Objectif appels entrants</span>
              <span className="text-xs font-medium text-primary">{callsEnabled ? "Activé" : "Inactif"}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span className="text-sm text-foreground">Objectif trafic web</span>
              <span className="text-xs font-medium text-primary">{webClicksEnabled ? "Activé" : "Inactif"}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span className="text-sm text-foreground">Campagne de notoriété locale</span>
              <span className="text-xs font-medium text-primary">{priorityPlacement ? "Activé" : "Inactif"}</span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Nom de campagne</label>
            <Input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} className="rounded-lg" />
          </div>
          <Button onClick={() => navigate("/merchant/ads")} className="mt-4 w-full rounded-full gap-1">
            Configurer une campagne <ChevronRight size={14} />
          </Button>
          <Button variant="outline" onClick={publishCampaign} className="mt-2 w-full rounded-full gap-1">
            Publier la campagne <Megaphone size={14} />
          </Button>
        </div>
      </div>

      <MerchantBottomNav />
    </div>
  );
};

export default MerchantOptimization;
