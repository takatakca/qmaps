import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MerchantBottomNav from "@/components/MerchantBottomNav";
import {
  ArrowLeft, Megaphone, Zap, TrendingUp, Eye, Star, X,
  MousePointerClick, Crown, Rocket, ChevronRight, CheckCircle2,
  Target, MapPinned, LineChart, Sparkles, Phone, Images,
  ShieldOff, BadgeCheck, Compass, PartyPopper, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import CheckoutGuidanceDialog from "@/components/merchant/CheckoutGuidanceDialog";
import type { Tables } from "@/integrations/supabase/types";

type AddOnStatus = "included" | "pro" | "trial" | "soon";

const statusMap: Record<AddOnStatus, { label: string; className: string }> = {
  included: { label: "Inclus", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  pro: { label: "Disponible avec Pro", className: "bg-primary/15 text-primary border-primary/30" },
  trial: { label: "Essai 7 jours", className: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  soon: { label: "Bientôt disponible", className: "bg-muted text-muted-foreground border-border" },
};

const addOns: { icon: typeof Zap; title: string; benefit: string; status: AddOnStatus }[] = [
  { icon: MapPinned, title: "Mise en avant locale", benefit: "Soyez vu en premier par les clients de votre région.", status: "trial" },
  { icon: Crown, title: "Position sponsorisée", benefit: "Apparaissez au-dessus des résultats pour vos mots-clés.", status: "pro" },
  { icon: Sparkles, title: "Business Highlights", benefit: "Affichez jusqu'à 6 badges qui rendent votre entreprise unique.", status: "pro" },
  { icon: MousePointerClick, title: "Bouton Call to Action", benefit: "Transformez les vues en réservations, appels ou achats.", status: "pro" },
  { icon: Images, title: "Slideshow de photos", benefit: "Choisissez vos meilleures photos en haut de votre page.", status: "pro" },
  { icon: ShieldOff, title: "Retirer les pubs concurrentes", benefit: "Gardez l'attention de vos visiteurs sur votre entreprise.", status: "pro" },
  { icon: BadgeCheck, title: "Visibilité sponsorisée", benefit: "Présence renforcée dans les listes de recommandations.", status: "trial" },
  { icon: TrendingUp, title: "Plus de clics", benefit: "Optimisation pour générer plus de trafic vers votre page.", status: "included" },
  { icon: Phone, title: "Plus d'appels", benefit: "Mettez en avant votre numéro pour recevoir plus d'appels.", status: "included" },
  { icon: Target, title: "Plus de demandes clients", benefit: "Captez plus de prospects qualifiés via les leads QMAPS.", status: "trial" },
];

const steps = [
  { n: 1, icon: Compass, title: "Choisissez une option de visibilité", desc: "Parcourez les add-ons et plans QMAPS adaptés à votre entreprise." },
  { n: 2, icon: Rocket, title: "Activez votre plan ou essai gratuit", desc: "Démarrez en quelques clics, sans engagement, paiement sécurisé via Stripe." },
  { n: 3, icon: Sparkles, title: "QMAPS met votre entreprise en avant", desc: "Vous gagnez en visibilité auprès des clients qui cherchent vos services." },
  { n: 4, icon: LineChart, title: "Suivez les résultats", desc: "Mesurez clics, appels et leads dans votre tableau de bord." },
];

const metrics = [
  { icon: Eye, label: "Impressions", value: "—" },
  { icon: MousePointerClick, label: "Clics", value: "—" },
  { icon: Star, label: "Leads", value: "—" },
  { icon: TrendingUp, label: "ROI", value: "—" },
];

const WELCOME_KEY = "qmaps-optimization-welcome-dismissed";

const MerchantOptimization = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Tables<"businesses"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [dailyBudget, setDailyBudget] = useState(18);
  const [radiusKm, setRadiusKm] = useState(12);
  const [callsEnabled, setCallsEnabled] = useState(true);
  const [webClicksEnabled, setWebClicksEnabled] = useState(true);
  const [priorityPlacement, setPriorityPlacement] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const estimatedClicks = useMemo(() => Math.round(dailyBudget * 34), [dailyBudget]);
  const estimatedLeads = useMemo(() => Math.max(4, Math.round(dailyBudget * 1.6)), [dailyBudget]);
  const monthlyCap = useMemo(() => dailyBudget * 30, [dailyBudget]);

  useEffect(() => {
    if (typeof window !== "undefined" && !window.localStorage.getItem(WELCOME_KEY)) {
      setShowWelcome(true);
    }
  }, []);

  const dismissWelcome = () => {
    setShowWelcome(false);
    if (typeof window !== "undefined") window.localStorage.setItem(WELCOME_KEY, "1");
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

  const businessName = business?.name || "votre entreprise";
  const openCheckout = () => setCheckoutOpen(true);

  return (
    <div className="min-h-screen bg-background pb-24 max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/merchant/home")} aria-label="Retour"><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="font-heading text-lg font-bold text-foreground flex-1">Optimisation & Publicité</h1>
      </div>

      <div className="p-4 space-y-5">
        {/* Welcome popup */}
        {showWelcome && (
          <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background p-4">
            <button
              onClick={dismissWelcome}
              aria-label="Fermer"
              className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-muted"
            >
              <X size={16} />
            </button>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 shrink-0">
                <PartyPopper size={20} className="text-primary" />
              </div>
              <div className="flex-1 pr-6">
                <h3 className="font-heading text-base font-bold text-foreground">Bienvenue dans l'Optimisation QMAPS</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cette section vous aide à attirer plus de clients avec des options de visibilité, des boutons d'action, des mises en avant et des campagnes sponsorisées.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="rounded-full" onClick={dismissWelcome}>
                    Voir comment ça marche
                  </Button>
                  <Button size="sm" className="rounded-full" onClick={() => { dismissWelcome(); openCheckout(); }}>
                    Explorer les plans
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hero / Premium banner */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-5 text-primary-foreground shadow-lg">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
              <Crown size={12} /> QMAPS Pro
            </span>
            <h2 className="mt-3 font-heading text-2xl font-bold leading-tight">
              Faites découvrir {businessName} partout au Québec
            </h2>
            <p className="mt-2 text-sm text-primary-foreground/90">
              Boostez votre visibilité, recevez plus de clics et transformez les visiteurs en clients.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={openCheckout}
                className="rounded-full bg-white text-primary hover:bg-white/90 font-bold flex-1"
              >
                Commencer l'essai gratuit de 7 jours
              </Button>
              <Button
                onClick={openCheckout}
                variant="outline"
                className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white flex-1"
              >
                Voir les plans
              </Button>
            </div>
            <p className="mt-3 text-[11px] text-primary-foreground/75 flex items-center gap-1.5">
              <ShieldCheck size={12} /> Paiement sécurisé via Stripe · Annulation à tout moment
            </p>
          </div>
        </div>

        {/* How it works steps */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <h3 className="font-heading font-bold text-foreground mb-3">Comment ça marche</h3>
          <div className="space-y-3">
            {steps.map((s) => (
              <div key={s.n} className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <s.icon size={18} className="text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Étape {s.n}</span>
                  </div>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">{s.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add-ons grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-foreground">Add-ons & options de visibilité</h3>
            <span className="text-[10px] font-bold uppercase tracking-wide text-primary">QMAPS</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {addOns.map((a) => {
              const s = statusMap[a.status];
              return (
                <div key={a.title} className="group rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5">
                      <a.icon size={20} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground leading-tight">{a.title}</p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{a.benefit}</p>
                      <div className="mt-2">
                        <Badge variant="outline" className={`text-[10px] font-semibold ${s.className}`}>{s.label}</Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={openCheckout}
                    size="sm"
                    variant={a.status === "included" ? "outline" : "default"}
                    className="mt-3 w-full rounded-full"
                  >
                    {a.status === "included" ? "Gérer" : a.status === "soon" ? "Bientôt disponible" : "Activer"}
                    <ChevronRight size={14} />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance preview */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <h3 className="font-heading font-bold text-foreground mb-3">Performance estimée</h3>
          <div className="grid grid-cols-2 gap-3">
            {metrics.map((m, i) => (
              <div key={i} className="rounded-xl bg-muted/40 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <m.icon size={14} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{m.label}</span>
                </div>
                <p className="text-lg font-bold text-foreground">{m.value}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Les chiffres réels apparaîtront ici dès qu'une campagne sera active.
          </p>
        </div>

        {/* Budget simulator */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-heading font-bold text-foreground">Simulateur de campagne</h3>
              <p className="text-xs text-muted-foreground mt-1">Ajustez votre budget et votre rayon pour visualiser votre potentiel.</p>
            </div>
            <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">Aperçu</span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Budget journalier</span>
              <span className="text-sm font-bold text-primary">CA${dailyBudget}/jour</span>
            </div>
            <Slider value={[dailyBudget]} min={5} max={60} step={1} onValueChange={([v]) => setDailyBudget(v)} />
            <p className="mt-2 text-xs text-muted-foreground">Plafond mensuel estimé: CA${monthlyCap}</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Rayon de diffusion</span>
              <span className="text-sm font-bold text-primary">{radiusKm} km</span>
            </div>
            <Slider value={[radiusKm]} min={3} max={40} step={1} onValueChange={([v]) => setRadiusKm(v)} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Recevoir plus d'appels</p>
                <p className="text-xs text-muted-foreground">Favorise les prospects prêts à contacter l'entreprise.</p>
              </div>
              <Switch checked={callsEnabled} onCheckedChange={setCallsEnabled} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Générer plus de trafic web</p>
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
            <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-3">
              <p className="text-xs text-muted-foreground">Clics estimés / mois</p>
              <p className="text-lg font-bold text-foreground">{estimatedClicks}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-3">
              <p className="text-xs text-muted-foreground">Leads estimés / mois</p>
              <p className="text-lg font-bold text-foreground">{estimatedLeads}</p>
            </div>
          </div>

          <Button onClick={openCheckout} className="w-full rounded-full gap-1">
            <Megaphone size={14} /> Activer cette campagne
          </Button>
        </div>

        {/* Final CTA */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Sparkles size={18} className="text-primary" />
          </div>
          <h3 className="font-heading text-lg font-bold text-foreground">Essayez les outils Pro pendant 7 jours</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Mettez votre entreprise en avant dans votre région, sans engagement.
          </p>
          <Button onClick={openCheckout} className="mt-3 rounded-full">Voir les plans QMAPS</Button>
        </div>
      </div>

      <CheckoutGuidanceDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />
      <MerchantBottomNav />
    </div>
  );
};

export default MerchantOptimization;
