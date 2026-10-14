import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Megaphone, BarChart3, CreditCard, ChevronRight, ShieldCheck } from "lucide-react";
import MerchantPageHeader from "@/components/merchant/layout/MerchantPageHeader";
import MerchantBottomNav from "@/components/MerchantBottomNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { chooseMerchantBusiness, getSavedMerchantBusinessId } from "@/lib/merchantSelection";
import { useSponsoredCampaigns } from "@/hooks/useSponsoredCampaigns";
import { SPONSORED_STATUS_LABELS, SPONSORED_PLACEMENT_LABELS } from "@/lib/sponsored";

type MerchantBusiness = { id: string; name: string };

const MerchantOptimization = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [business, setBusiness] = useState<MerchantBusiness | null>(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const { campaigns, loading: loadingCampaigns, error: campaignError, refresh: refreshCampaigns } = useSponsoredCampaigns(business?.id ?? null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setBusiness(null);
      setLoadingBusiness(false);
      return;
    }
    let cancelled = false;
    setLoadingBusiness(true);
    setError(null);
    void (async () => {
      const { data, error: loadError } = await supabase
        .from("businesses")
        .select("id, name")
        .eq("owner_user_id", user.id)
        .order("name", { ascending: true });
      if (cancelled) return;
      if (loadError) {
        setError(loadError.message);
        setBusiness(null);
      } else {
        setBusiness(chooseMerchantBusiness(data ?? [], getSavedMerchantBusinessId(user.id)));
      }
      setLoadingBusiness(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id, authLoading, reload]);

  const draftCount = campaigns.filter((campaign) => campaign.status === "draft").length;
  const reviewCount = campaigns.filter((campaign) => campaign.status === "pending_review").length;
  const approvedCount = campaigns.filter((campaign) => campaign.status === "approved").length;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-20">
      <MerchantPageHeader title="Optimisation et publicité" back="/merchant" />
      <main className="p-4 space-y-4">
        {authLoading || loadingBusiness ? (
          <p role="status" className="text-sm text-muted-foreground py-8 text-center">
            Chargement des entreprises...
          </p>
        ) : error ? (
          <Card className="p-5 space-y-3" role="alert">
            <p className="text-sm text-destructive">Impossible de charger vos entreprises : {error}</p>
            <Button variant="outline" size="sm" onClick={() => setReload((v) => v + 1)}>
              Réessayer
            </Button>
          </Card>
        ) : !business ? (
          <Card className="p-5 space-y-3 text-center">
            <h2 className="font-heading font-bold text-foreground">Aucune entreprise</h2>
            <p className="text-sm text-muted-foreground">
              Ajoutez une entreprise pour accéder aux campagnes sponsorisées.
            </p>
            <Button onClick={() => navigate("/add-business")}>Ajouter mon entreprise</Button>
          </Card>
        ) : (
          <>
            <Card className="p-5 space-y-2">
              <p className="text-xs uppercase font-semibold tracking-wide text-primary">Entreprise active</p>
              <h2 className="font-heading text-xl font-bold text-foreground">{business.name}</h2>
              <p className="text-sm text-muted-foreground">
                Toutes les campagnes affichées proviennent de votre compte QMAPS et de l'entreprise sélectionnée.
              </p>
            </Card>

            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Megaphone size={18} className="text-primary" />
                <h3 className="font-heading font-bold text-foreground">Mes campagnes sponsorisées</h3>
              </div>
              {loadingCampaigns ? (
                <p className="text-sm text-muted-foreground" role="status">Chargement des campagnes...</p>
              ) : campaignError ? (
                <div role="alert" className="space-y-2">
                  <p className="text-sm text-destructive">Impossible de charger les campagnes : {campaignError}</p>
                  <Button size="sm" variant="outline" onClick={() => void refreshCampaigns()}>Réessayer</Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-lg font-bold text-foreground">{draftCount}</p>
                      <p className="text-[11px] text-muted-foreground">Brouillons</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-lg font-bold text-foreground">{reviewCount}</p>
                      <p className="text-[11px] text-muted-foreground">En examen</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-lg font-bold text-foreground">{approvedCount}</p>
                      <p className="text-[11px] text-muted-foreground">Approuvées</p>
                    </div>
                  </div>
                  {campaigns.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Aucune campagne enregistrée pour cette entreprise.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {campaigns.slice(0, 5).map((campaign) => (
                        <div key={campaign.id} className="rounded-lg border border-border p-3 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {campaign.headline || "Campagne sans titre"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {SPONSORED_PLACEMENT_LABELS[campaign.placement]}
                              {campaign.daily_budget_cents == null ? "" : ` · CA$${(campaign.daily_budget_cents / 100).toFixed(2)}/jour`}
                            </p>
                          </div>
                          <Badge variant="outline">{SPONSORED_STATUS_LABELS[campaign.status]}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              <Button className="w-full rounded-full gap-2" onClick={() => navigate("/merchant/sponsored")}>
                <Megaphone size={15} /> Gérer ou créer une campagne <ChevronRight size={15} />
              </Button>
            </Card>

            <Card className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-primary" />
                <h3 className="font-heading font-bold text-foreground">Performance mesurée</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Consultez les événements et statistiques réellement enregistrés. Aucun clic,
                prospect ou rendement n'est estimé sans données.
              </p>
              <Button variant="outline" className="w-full rounded-full" onClick={() => navigate("/merchant/analytics")}>
                Voir mes statistiques <ChevronRight size={15} className="ml-2" />
              </Button>
            </Card>

            <Card className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-primary" />
                <h3 className="font-heading font-bold text-foreground">Abonnement QMAPS</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Vérifiez les forfaits disponibles et leur facturation. Aucun budget publicitaire
                n'est débité depuis cette page.
              </p>
              <Button variant="outline" className="w-full rounded-full" onClick={() => navigate("/merchant/billing/plans")}>
                Consulter les forfaits <ChevronRight size={15} className="ml-2" />
              </Button>
            </Card>

            <div className="flex items-start gap-2 px-1 text-xs text-muted-foreground">
              <ShieldCheck size={16} className="text-primary shrink-0" />
              La visibilité sponsorisée requiert une campagne enregistrée et validée. Le statut
              « Approuvée » ne garantit pas à lui seul une diffusion ou un nombre de clics.
            </div>
          </>
        )}
      </main>
      <MerchantBottomNav />
    </div>
  );
};

export default MerchantOptimization;
