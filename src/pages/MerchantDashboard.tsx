import { fetchReviewsWithAuthors, type ReviewWithAuthor } from "@/lib/reviewsWithAuthors";
import { useState, useEffect, lazy, Suspense } from "react";
import { chooseMerchantBusiness, getSavedMerchantBusinessId, saveMerchantBusinessId } from "@/lib/merchantSelection";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import MerchantBottomNav from "@/components/MerchantBottomNav";
import { ArrowLeft, Plus, Store, LayoutDashboard, BarChart3, Settings, MessageSquare, Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MerchantOverview = lazy(() => import("@/components/merchant/MerchantOverview"));
const MerchantPerformance = lazy(() => import("@/components/merchant/MerchantPerformance"));
const MerchantEditForm = lazy(() => import("@/components/merchant/MerchantEditForm"));
const MerchantReviews = lazy(() => import("@/components/merchant/MerchantReviews"));

const PanelFallback = () => (
  <div className="space-y-3" role="status" aria-label="Chargement">
    <div className="h-32 w-full rounded-xl bg-muted animate-pulse" />
    <div className="h-24 w-full rounded-xl bg-muted animate-pulse" />
  </div>
);
import type { Tables } from "@/integrations/supabase/types";
import { useMerchantSubscription } from "@/hooks/useMerchantSubscription";
import { planLabel } from "@/lib/billing";
import { Badge } from "@/components/ui/badge";

const MerchantDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState<Tables<"businesses">[]>([]);
  const [selectedBiz, setSelectedBiz] = useState<Tables<"businesses"> | null>(null);
  const [reviews, setReviews] = useState<ReviewWithAuthor[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsForBusinessId, setReviewsForBusinessId] = useState<string | null>(null);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [businessesOwnerId, setBusinessesOwnerId] = useState<string | null>(null);
  const [reloadReviews, setReloadReviews] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "performance" | "edit" | "reviews">("overview");
  const { plan, isFree } = useMerchantSubscription(selectedBiz?.id ?? null);

  useEffect(() => {
    if (user && selectedBiz && businessesOwnerId === user.id) {
      saveMerchantBusinessId(user.id, selectedBiz.id);
    }
  }, [user?.id, selectedBiz?.id, businessesOwnerId]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setBusinesses([]);
      setSelectedBiz(null);
      setReviews([]);
      setReviewsError(null);
      setBusinessesOwnerId(null);
      setReviewsForBusinessId(null);
      navigate("/merchant/login");
      return;
    }
    void fetchBusinesses();
    // Re-fetch when the authenticated identity changes.
  }, [user?.id, authLoading, navigate]);

  useEffect(() => {
    if (!selectedBiz) {
      setReviews([]);
      setReviewsForBusinessId(null);
      setReviewsError(null);
      setReviewsLoading(false);
      return;
    }
    // Ignore responses for a business the user has already switched away from.
    let cancelled = false;
    setReviews([]);
    setReviewsForBusinessId(null);
    setReviewsError(null);
    setReviewsLoading(true);
    void fetchReviewsWithAuthors(selectedBiz.id)
      .then((results) => {
        if (!cancelled) {
          setReviews(results);
          setReviewsForBusinessId(selectedBiz.id);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setReviewsError(error instanceof Error ? error.message : "Veuillez réessayer.");
          setReviewsForBusinessId(selectedBiz.id);
        }
      })
      .finally(() => {
        if (!cancelled) setReviewsLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedBiz?.id, reloadReviews]);

  const fetchBusinesses = async () => {
    if (!user) return;
    setLoading(true);
    setLoadError(null);
    setBusinessesOwnerId(null);
    try {
      const { data, error } = await supabase.from("businesses")
        .select("*")
        .eq("owner_user_id", user.id)
        .order("name", { ascending: true });
      if (error) throw error;
      const ownedBusinesses = data ?? [];
      setBusinesses(ownedBusinesses);
      setSelectedBiz((current) => chooseMerchantBusiness(ownedBusinesses, current?.id ?? getSavedMerchantBusinessId(user.id)));
      setBusinessesOwnerId(user.id);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Le chargement des entreprises a échoué.");
      setBusinesses([]);
      setSelectedBiz(null);
      setBusinessesOwnerId(null);
    } finally {
      setLoading(false);
    }
  };

  const selectBiz = (businessId: string) => {
    // Only select an already-loaded business belonging to the current user.
    const owned = businesses.find((business) => business.id === businessId);
    if (!owned) return;
    setSelectedBiz(owned);
  };

  const handleCreateBusiness = () => {
    // Collect a real name and address; do not silently create a fictitious
    // already-claimed listing from a dashboard shortcut.
    navigate("/add-business");
  };

  if (authLoading || loading || (user && businessesOwnerId !== user.id && !loadError)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  const tabs = [
    { key: "overview" as const, label: "Aperçu", icon: LayoutDashboard },
    { key: "performance" as const, label: "Stats", icon: BarChart3 },
    { key: "edit" as const, label: "Modifier", icon: Settings },
    { key: "reviews" as const, label: "Avis", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="px-4 pt-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="font-heading text-xl font-bold text-foreground">
              QMAPS <span className="text-primary">Commerçant</span>
            </h1>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4 ml-12">Gérez votre entreprise sur QMAPS</p>

        {loadError ? (
          <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 mb-4">
            <p className="text-sm text-destructive">Impossible de charger vos entreprises : {loadError}</p>
            <Button size="sm" className="mt-3" variant="outline" onClick={() => void fetchBusinesses()}>
              Réessayer
            </Button>
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-16">
            <Store size={48} className="mx-auto text-muted-foreground mb-4" />
            <h2 className="font-heading font-semibold text-foreground mb-2">Aucune entreprise</h2>
            <p className="text-sm text-muted-foreground mb-6">Ajoutez votre entreprise pour commencer</p>
            <Button onClick={handleCreateBusiness} className="rounded-full gap-2">
              <Plus size={16} /> Ajouter une entreprise
            </Button>
          </div>
        ) : (
          <>
            {businesses.length > 1 && selectedBiz && (
              <div className="mb-4 space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="qmaps-merchant-business">
                  Entreprise active
                </label>
                <Select value={selectedBiz.id} onValueChange={selectBiz}>
                  <SelectTrigger id="qmaps-merchant-business" aria-label="Choisir l'entreprise active">
                    <SelectValue placeholder="Sélectionner une entreprise" />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map((business) => (
                      <SelectItem key={business.id} value={business.id}>
                        {business.name}{business.city ? ` — ${business.city}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleCreateBusiness}
                >
                  <Plus size={14} /> Ajouter une entreprise
                </Button>
              </div>
            )}
            {/* Tabs */}
            <div className="flex gap-1 bg-secondary rounded-full p-1 mb-4">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-full text-xs font-medium transition-colors ${
                    tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  <t.icon size={13} /> {t.label}
                </button>
              ))}
            </div>

            {selectedBiz && (
              <button
                onClick={() => navigate("/merchant/billing/plans")}
                className="w-full flex items-center justify-between gap-2 mb-4 px-3 py-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles size={14} className="text-primary" />
                  <span className="text-muted-foreground">Plan :</span>
                  <Badge variant={isFree ? "secondary" : "default"}>{planLabel(plan)}</Badge>
                </div>
                <span className="text-xs text-primary font-semibold">
                  {isFree ? "Améliorer" : "Gérer"}
                </span>
              </button>
            )}

            {(reviewsLoading || reviewsForBusinessId !== selectedBiz?.id) && tab === "reviews" ? (
              <PanelFallback />
            ) : null}
            <Suspense fallback={<PanelFallback />}>
              {selectedBiz && tab === "overview" && <MerchantOverview business={selectedBiz} reviews={reviewsForBusinessId === selectedBiz.id ? reviews : []} onRefresh={fetchBusinesses} />}
              {selectedBiz && tab === "performance" && <MerchantPerformance business={selectedBiz} />}
              {selectedBiz && tab === "edit" && <MerchantEditForm business={selectedBiz} onSaved={fetchBusinesses} />}
              {selectedBiz && tab === "reviews" && !reviewsLoading && reviewsForBusinessId === selectedBiz.id && reviewsError && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4" role="alert">
                  <p className="text-sm text-destructive">Impossible de charger les avis : {reviewsError}</p>
                  <Button className="mt-3" size="sm" variant="outline" onClick={() => setReloadReviews((v) => v + 1)}>
                    Réessayer
                  </Button>
                </div>
              )}
              {selectedBiz && tab === "reviews" && !reviewsError && !reviewsLoading && reviewsForBusinessId === selectedBiz.id && (
                <MerchantReviews
                  key={selectedBiz.id}
                  reviews={reviews}
                  onReplySaved={() => {
                    setReviewsForBusinessId(null);
                    setReloadReviews((version) => version + 1);
                  }}
                />
              )}
            </Suspense>
          </>
        )}
      </div>
      <MerchantBottomNav />
    </div>
  );
};

export default MerchantDashboard;
