import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Zap, Smartphone, Phone, HelpCircle, ExternalLink, Sparkles, ChevronRight } from "lucide-react";
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
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardName, setCardName] = useState("");

  const handleAddCard = () => {
    if (!cardNumber || !expiry || !cvc || !cardName) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs.", variant: "destructive" });
      return;
    }
    toast({ title: "Carte ajoutée", description: "Votre méthode de paiement a été enregistrée." });
    setShowAddCard(false);
    setCardNumber(""); setExpiry(""); setCvc(""); setCardName("");
  };

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

        {/* Mobile app CTA */}
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
