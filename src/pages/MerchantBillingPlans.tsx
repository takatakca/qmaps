import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useMerchantSubscription } from "@/hooks/useMerchantSubscription";
import { PLANS, type PlanKey } from "@/lib/billing";
import Seo from "@/components/Seo";
import type { Tables } from "@/integrations/supabase/types";

const ctaLabel = (cta: typeof PLANS[number]["cta"]): string => {
  switch (cta) {
    case "current":
      return "Plan actuel";
    case "coming_soon":
      return "Bientôt disponible";
    case "contact":
      return "Contacter QMaps";
    default:
      return "Choisir";
  }
};

const MerchantBillingPlans = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [businesses, setBusinesses] = useState<Tables<"businesses">[]>([]);
  const [selectedBizId, setSelectedBizId] = useState<string | null>(null);
  const { plan: currentPlan, loading: subLoading } = useMerchantSubscription(selectedBizId);

  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      const { data } = await supabase
        .from("businesses")
        .select("id, name")
        .eq("owner_user_id", user.id);
      const list = (data as Tables<"businesses">[]) || [];
      setBusinesses(list);
      if (list.length > 0) setSelectedBizId(list[0].id);
    })();
  }, [user, authLoading]);

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
            const cta: typeof PLANS[number]["cta"] = isCurrent ? "current" : p.cta;
            const disabled = cta === "current" || cta === "coming_soon";
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
                        window.location.href = "mailto:hello@qmaps.app?subject=Plan Premium";
                      }
                    }}
                  >
                    {ctaLabel(cta)}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-xs text-muted-foreground text-center pt-2">
          Aucun paiement n'est traité pour le moment. Les plans payants arrivent bientôt.
        </div>
      </div>
    </div>
  );
};

export default MerchantBillingPlans;
