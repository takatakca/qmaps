// Phase 7C — Stripe test-mode checklist (developer reference, not user-facing):
//   1. Add secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
//      STRIPE_STARTER_PRICE_ID, STRIPE_PRO_PRICE_ID, STRIPE_PREMIUM_PRICE_ID
//   2. Deploy edge functions (checkout, portal, webhook)
//   3. Configure Stripe webhook endpoint -> /functions/v1/stripe-webhook
//   4. Create test prices in Stripe (test mode) and copy IDs into the secrets above
//   5. From /merchant/billing/plans click "Choisir ce plan"
//   6. Complete checkout with test card 4242 4242 4242 4242
//   7. Verify a row appears/updates in merchant_subscriptions for the business
//   8. Verify a row appears in merchant_billing_events with provider_event_id
//   9. Open billing portal via "Gérer l'abonnement"
//  10. Cancel subscription in Stripe portal — verify cancel_at_period_end + status
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Zap, Smartphone, Phone, HelpCircle, ExternalLink, Sparkles, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useMerchantSubscription } from "@/hooks/useMerchantSubscription";
import { planLabel, statusLabel } from "@/lib/billing";
import type { Tables } from "@/integrations/supabase/types";

const MerchantBilling = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [events, setEvents] = useState<Tables<"merchant_billing_events">[]>([]);
  const { subscription, plan, status, isFree, loading: subLoading } = useMerchantSubscription(businessId);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (data?.id) setBusinessId(data.id);
    })();
  }, [user]);

  useEffect(() => {
    if (!businessId) return;
    (async () => {
      const { data } = await supabase
        .from("merchant_billing_events")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(10);
      setEvents(data || []);
    })();
  }, [businessId]);

  const handleAddCard = () => {
    if (!cardNumber || !expiry || !cvc || !cardName) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs.", variant: "destructive" });
      return;
    }
    toast({ title: "Carte ajoutée", description: "Votre méthode de paiement a été enregistrée." });
    setShowAddCard(false);
    setCardNumber(""); setExpiry(""); setCvc(""); setCardName("");
  };

  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("fr-CA")
    : null;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <h1 className="font-heading text-lg font-bold text-foreground">Facturation</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Current plan */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              Plan actuel <Sparkles size={16} className="text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {subLoading ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-foreground">{planLabel(plan)}</span>
                  <Badge variant={isFree ? "secondary" : "default"}>{statusLabel(status)}</Badge>
                </div>
                {periodEnd && (
                  <p className="text-xs text-muted-foreground">
                    Période en cours jusqu'au {periodEnd}
                    {subscription?.cancel_at_period_end ? " — annulation prévue" : ""}
                  </p>
                )}
                {isFree && (
                  <p className="text-xs text-muted-foreground">
                    Vous êtes sur le plan gratuit. Découvrez ce que les plans payants offrent.
                  </p>
                )}
                {subscription?.provider_customer_id ? (
                  <Button
                    className="w-full justify-between rounded-full"
                    disabled={portalLoading}
                    onClick={async () => {
                      if (portalLoading) return;
                      setPortalLoading(true);
                      try {
                        const { data, error } = await supabase.functions.invoke(
                          "create-merchant-billing-portal-session",
                          { body: { business_id: businessId } }
                        );
                        let payload = data as { url?: string; error?: string; message?: string } | null;
                        if (error && !payload) {
                          const ctx = (error as { context?: Response }).context;
                          if (ctx && typeof ctx.json === "function") {
                            try { payload = await ctx.json(); } catch { /* ignore */ }
                          }
                        }
                        if (payload?.url) {
                          window.location.href = payload.url;
                          return;
                        }
                        const code = payload?.error;
                        if (code === "provider_not_configured") {
                          toast({ title: "Bientôt disponible", description: payload?.message });
                        } else if (code === "no_customer") {
                          toast({
                            title: "Aucun abonnement actif",
                            description: "Choisissez un plan pour commencer.",
                          });
                          navigate("/merchant/billing/plans");
                        } else if (code === "forbidden") {
                          toast({
                            title: "Accès refusé",
                            description: "Cette entreprise ne vous appartient pas.",
                            variant: "destructive",
                          });
                        } else {
                          toast({
                            title: "Impossible d'ouvrir le portail",
                            description: payload?.message || "Veuillez réessayer plus tard.",
                            variant: "destructive",
                          });
                        }
                      } finally {
                        setPortalLoading(false);
                      }
                    }}
                  >
                    <span>{portalLoading ? "Ouverture..." : "Gérer l'abonnement"}</span>
                    {portalLoading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full justify-between rounded-full"
                    onClick={() => navigate("/merchant/billing/plans")}
                  >
                    <span>Voir les plans</span>
                    <ChevronRight size={16} />
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Billing Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Résumé de facturation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Solde impayé :</span>
              <span className="font-semibold text-foreground">Aucun — 0,00 $</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prochaine date de facturation :</span>
              <span className="text-foreground">1 avr. 2026</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Promotions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              Promotions actives <Zap size={16} className="text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Aucune promotion active</p>
          </CardContent>
        </Card>

        {/* Billing events */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Historique de facturation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun événement de facturation pour le moment.
              </p>
            ) : (
              events.map((e) => (
                <div key={e.id} className="flex justify-between text-sm">
                  <span className="text-foreground">{e.event_type}</span>
                  <span className="text-muted-foreground">
                    {new Date(e.created_at).toLocaleDateString("fr-CA")}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-secondary/50 border-primary/20">
          <CardContent className="flex items-center gap-3 py-4">
            <Smartphone size={28} className="text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Gérez votre page QMAPS en déplacement</p>
            </div>
            <Button size="sm" className="rounded-full shrink-0">
              Ouvrir l'app
            </Button>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Méthodes de paiement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-center gap-2"
              onClick={() => setShowAddCard(true)}
            >
              <CreditCard size={16} />
              Ajouter une nouvelle carte
            </Button>
            <p className="text-xs text-muted-foreground">Aucune carte enregistrée</p>
          </CardContent>
        </Card>

        {/* Your Products */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold">Vos produits</CardTitle>
            <Button variant="outline" size="sm" disabled>Gérer</Button>
          </CardHeader>
          <CardContent>
            <button
              onClick={() => navigate("/merchant/ads")}
              className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline"
            >
              Lancer QMAPS Ads <ExternalLink size={14} />
            </button>
          </CardContent>
        </Card>

        <Separator />

        {/* Contact Us */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Contactez-nous</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Les représentants du service client sont disponibles de 8h00 à 21h00 HE.
            </p>
            <button className="flex items-center gap-2 text-primary font-semibold hover:underline">
              <HelpCircle size={16} /> Signaler un problème
            </button>
            <button className="flex items-center gap-2 text-primary font-semibold hover:underline">
              <HelpCircle size={16} /> Centre d'aide
            </button>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone size={16} />
              <span>Appelez le (877) 767-9357</span>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-xs text-muted-foreground text-center pt-4 pb-8 space-y-2">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <span>À propos</span>
            <span>Découvrir</span>
            <span>Langues</span>
          </div>
          <p>© 2024–2026 QMAPS Professional</p>
        </div>
      </div>

      {/* Add Card Dialog */}
      <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Ajouter une carte</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Nom sur la carte</Label>
              <Input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Jean Dupont" />
            </div>
            <div>
              <Label>Numéro de carte</Label>
              <Input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4242 4242 4242 4242" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Expiration</Label>
                <Input value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="MM/AA" />
              </div>
              <div>
                <Label>CVC</Label>
                <Input value={cvc} onChange={(e) => setCvc(e.target.value)} placeholder="123" />
              </div>
            </div>
          </div>
          <Button onClick={handleAddCard} className="w-full">Ajouter</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MerchantBilling;
