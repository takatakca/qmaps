import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useMerchantSubscription } from "@/hooks/useMerchantSubscription";
import { PLANS, type PlanDefinition, type PlanKey } from "@/lib/billing";
import { useToast } from "@/hooks/use-toast";
import Seo from "@/components/Seo";
import type { Tables } from "@/integrations/supabase/types";

const ctaLabel = (cta: PlanDefinition["cta"]): string => {
  switch (cta) {
    case "current":
      return "Plan actuel";
    case "coming_soon":
      return "Bientôt disponible";
    case "contact":
      return "Contacter QMaps";
    case "checkout":
      return "Choisir ce plan";
    default:
      return "Choisir";
  }
};

const MerchantBillingPlans = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [businesses, setBusinesses] = useState<Pick<Tables<"businesses">, "id" | "name">[]>([]);
  const [selectedBizId, setSelectedBizId] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<PlanKey | null>(null);
  const { plan: currentPlan, loading: subLoading } = useMerchantSubscription(selectedBizId);

  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      const { data } = await supabase
        .from("businesses")
        .select("id, name")
        .eq("owner_user_id", user.id);
      const list = data || [];
      setBusinesses(list);
      if (list.length > 0) setSelectedBizId(list[0].id);
    })();
  }, [user, authLoading]);

  const startCheckout = async (plan: PlanKey) => {
    if (!selectedBizId) {
      toast({
        title: "Aucune entreprise",
        description: "Réclamez d'abord une entreprise pour souscrire à un plan.",
        variant: "destructive",
      });
      return;
    }
    setCheckoutLoading(plan);
    try {
      const { data, error } = await supabase.functions.invoke(
        "create-merchant-checkout-session",
        { body: { business_id: selectedBizId, plan } }
      );
      if (error) throw error;
      const payload = data as { url?: string; error?: string; message?: string };
      if (payload?.url) {
        window.location.href = payload.url;
        return;
      }
      if (payload?.error === "provider_not_configured" || payload?.error === "price_not_configured") {
        toast({
          title: "Bientôt disponible",
          description: payload.message || "Les paiements ne sont pas encore activés.",
        });
      } else {
        toast({
          title: "Erreur",
          description: payload?.message || "Impossible de démarrer le paiement.",
          variant: "destructive",
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Edge function returns 503 with provider_not_configured when Stripe isn't set up.
      if (msg.includes("provider_not_configured") || msg.includes("503")) {
        toast({
          title: "Bientôt disponible",
          description: "Les paiements arrivent bientôt sur QMaps.",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de démarrer le paiement.",
          variant: "destructive",
        });
      }
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-2xl mx-auto pb-20">
      <Seo
        title="Plans marchands | QMaps"
        description="Comparez les plans QMaps pour les marchands : Gratuit, Starter, Pro, Premium."
        noindex
      />
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)} aria-label="Retour">
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <h1 className="font-heading text-lg font-bold text-foreground">Plans QMaps</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="text-sm text-muted-foreground">
          Choisissez le plan qui correspond à votre entreprise. Les plans payants seront
          activés prochainement.
        </div>

        {businesses.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {businesses.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBizId(b.id)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                  selectedBizId === b.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border"
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PLANS.map((p) => {
            const isCurrent = !subLoading && currentPlan === p.key;
            const cta: PlanDefinition["cta"] = isCurrent ? "current" : p.cta;
            const isLoading = checkoutLoading === p.key;
            const disabled =
              cta === "current" || cta === "coming_soon" || isLoading;
            return (
              <Card
                key={p.key}
                className={p.highlighted ? "border-primary/40 shadow-sm" : ""}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      {p.name}
                      {p.highlighted && (
                        <Sparkles size={14} className="text-primary" />
                      )}
                    </CardTitle>
                    {isCurrent && <Badge variant="secondary">Actuel</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{p.tagline}</p>
                  <p className="text-sm font-semibold text-foreground pt-1">
                    {p.priceLabel}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-1.5">
                    {p.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm text-foreground"
                      >
                        <Check size={14} className="text-primary mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={isCurrent ? "outline" : "default"}
                    className="w-full rounded-full"
                    disabled={disabled}
                    onClick={() => {
                      if (cta === "contact") {
                        window.location.href =
                          "mailto:hello@qmaps.app?subject=Plan Premium";
                        return;
                      }
                      if (cta === "checkout") {
                        startCheckout(p.key);
                      }
                    }}
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      ctaLabel(cta)
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-xs text-muted-foreground text-center pt-2">
          Le paiement est traité de façon sécurisée. Vous pouvez annuler à tout moment.
        </div>
      </div>
    </div>
  );
};

export default MerchantBillingPlans;
