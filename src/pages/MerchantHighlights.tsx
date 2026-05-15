import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Check, ShoppingBag, Award, Heart, Building, Clock, Users, Briefcase, Sparkles, Star, Globe, Truck, Leaf, Zap, Coffee, Wrench, Camera, Music, BookOpen, Gift, Palette, Umbrella, Flame, Gem, Crown, ThumbsUp, HandHeart, Baby, Dog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const HIGHLIGHTS = [
  { id: "shopping", label: "Shopping", icon: ShoppingBag },
  { id: "certified", label: "Professionnels certifiés", icon: Award },
  { id: "family", label: "Entreprise familiale", icon: Heart },
  { id: "local", label: "Propriété locale", icon: Building },
  { id: "years", label: "Années d'expérience", icon: Clock },
  { id: "women", label: "Propriété féminine", icon: Users },
  { id: "eco", label: "Éco-responsable", icon: Leaf },
  { id: "fast", label: "Service rapide", icon: Zap },
  { id: "delivery", label: "Livraison disponible", icon: Truck },
  { id: "luxury", label: "Service premium", icon: Gem },
  { id: "handmade", label: "Fait main", icon: HandHeart },
  { id: "pet", label: "Animaux bienvenus", icon: Dog },
  { id: "kid", label: "Adapté aux enfants", icon: Baby },
  { id: "award", label: "Primé", icon: Crown },
  { id: "trusted", label: "Recommandé", icon: ThumbsUp },
  { id: "creative", label: "Créatif", icon: Palette },
  { id: "music", label: "Musique live", icon: Music },
  { id: "cafe", label: "Café & détente", icon: Coffee },
  { id: "repair", label: "Réparations", icon: Wrench },
  { id: "photo", label: "Photos professionnelles", icon: Camera },
  { id: "education", label: "Formations", icon: BookOpen },
  { id: "gift", label: "Cartes cadeaux", icon: Gift },
  { id: "outdoor", label: "Terrasse", icon: Umbrella },
  { id: "trending", label: "Tendance", icon: Flame },
  { id: "international", label: "International", icon: Globe },
  { id: "boutique", label: "Boutique", icon: Sparkles },
  { id: "toprated", label: "Très bien noté", icon: Star },
  { id: "commercial", label: "Services commerciaux", icon: Briefcase },
];

const MerchantHighlights = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"select" | "checkout">("select");
  const [selected, setSelected] = useState<string[]>([]);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [hasPromo, setHasPromo] = useState(false);

  const toggleHighlight = (id: string) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(h => h !== id)
        : prev.length < 6 ? [...prev, id] : prev
    );
  };

  const selectedHighlights = HIGHLIGHTS.filter(h => selected.includes(h.id));

  if (step === "checkout") {
    return (
      <div className="min-h-screen bg-background max-w-lg mx-auto pb-12">
        <div className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => setStep("select")}><ArrowLeft size={22} className="text-foreground" /></button>
          <h1 className="font-heading text-base font-bold text-foreground">Achat Business Highlights</h1>
        </div>

        <div className="px-4 pt-6">
          <h2 className="font-heading text-xl font-bold text-foreground mb-1">Achat Business Highlights</h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
            <Shield size={14} /> Paiement sécurisé
          </div>

          {/* Order summary */}
          <h3 className="font-heading font-bold text-foreground mb-3">Résumé de la commande</h3>
          <div className="bg-card rounded-xl border border-border p-4 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <Star size={20} className="text-primary mt-0.5" />
              <div className="flex-1">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-foreground">Business Highlights</p>
                  <p className="text-sm font-medium text-foreground">CA$2/jour moy</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Mettez en valeur ce qui rend votre entreprise unique.
                </p>
              </div>
            </div>

            {/* Selected badges */}
            {selectedHighlights.length > 0 && (
              <div className="border-t border-border pt-3 mb-3">
                <p className="text-xs text-muted-foreground mb-2">Badges sélectionnés ({selectedHighlights.length}/6):</p>
                <div className="flex flex-wrap gap-2">
                  {selectedHighlights.map(h => (
                    <span key={h.id} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      <h.icon size={12} /> {h.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-border pt-3">
              <div className="flex justify-between">
                <p className="font-bold text-foreground">Total</p>
                <p className="font-bold text-foreground">CA$2/jour moy</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Facturation mensuelle. Annulez à tout moment.</p>
            </div>
          </div>

          {/* Payment form */}
          <h3 className="font-heading font-bold text-foreground mb-4">Informations de paiement</h3>
          <div className="space-y-3 mb-6">
            <div>
              <Label className="text-xs">Nom sur la carte</Label>
              <Input value={cardName} onChange={e => setCardName(e.target.value)} className="rounded-lg" />
            </div>
            <div>
              <Label className="text-xs">Numéro de carte</Label>
              <Input value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="•••• •••• •••• ••••" className="rounded-lg" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="text-xs">Date d'expiration</Label>
                <div className="flex gap-2">
                  <Input value={expMonth} onChange={e => setExpMonth(e.target.value)} placeholder="MM" className="rounded-lg" />
                  <Input value={expYear} onChange={e => setExpYear(e.target.value)} placeholder="AA" className="rounded-lg" />
                </div>
              </div>
              <div className="w-24">
                <Label className="text-xs">CVV</Label>
                <Input value={cvv} onChange={e => setCvv(e.target.value)} className="rounded-lg" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Code postal</Label>
              <Input value={postalCode} onChange={e => setPostalCode(e.target.value)} className="rounded-lg" />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" checked={hasPromo} onChange={e => setHasPromo(e.target.checked)} className="rounded" />
              <span className="text-sm text-foreground">Avez-vous un code promo QMAPS?</span>
            </div>
            {hasPromo && (
              <Input value={promoCode} onChange={e => setPromoCode(e.target.value)} placeholder="Code promo" className="rounded-lg" />
            )}

            <p className="text-[10px] text-muted-foreground">
              En procédant, j'accepte les <button className="text-primary underline">Conditions publicitaires</button> de QMAPS.
            </p>

            <Button onClick={() => navigate("/merchant/billing/plans")} className="w-full rounded-full font-bold">
              Voir les plans d'abonnement
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-32">
      <div className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/merchant")}><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="font-heading text-base font-bold text-foreground">Business Highlights</h1>
      </div>

      <div className="px-4 pt-6">
        {/* Hero */}
        <h2 className="font-heading text-xl font-bold text-foreground mb-2">Mettez en valeur le meilleur de votre entreprise</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Votre entreprise est spéciale et vos clients doivent le savoir. Les entreprises constatent jusqu'à <span className="font-bold text-foreground">15% de leads supplémentaires</span> en mettant en avant ce qui les rend uniques.
        </p>

        {/* CTA buttons */}
        <Button onClick={() => setStep("checkout")} className="w-full rounded-full mb-2" disabled={selected.length === 0}>
          Acheter · CA$2/jour
        </Button>
        <Button variant="outline" onClick={() => navigate("/merchant/upgrade")} className="w-full rounded-full mb-6">
          Économisez avec le Package
        </Button>

        {/* Badge grid */}
        <h3 className="font-heading font-bold text-foreground mb-3">
          Choisissez parmi plus de {HIGHLIGHTS.length} badges pour montrer ce qui rend votre entreprise unique.
        </h3>
        <p className="text-xs text-muted-foreground mb-4">Sélectionnez jusqu'à 6 badges ({selected.length}/6)</p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {HIGHLIGHTS.map(h => {
            const isSelected = selected.includes(h.id);
            return (
              <button
                key={h.id}
                onClick={() => toggleHighlight(h.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSelected ? "bg-primary/20" : "bg-muted"}`}>
                  <h.icon size={16} className={isSelected ? "text-primary" : "text-muted-foreground"} />
                </div>
                <span className={`text-[11px] leading-tight ${isSelected ? "text-primary font-semibold" : "text-foreground"}`}>{h.label}</span>
                {isSelected && <Check size={14} className="text-primary" />}
              </button>
            );
          })}
        </div>

        {/* Preview section */}
        {selected.length > 0 && (
          <div className="mb-8">
            <h3 className="font-heading font-bold text-foreground mb-3">Aperçu sur votre page</h3>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground mb-2">Highlights de l'entreprise</p>
              <div className="flex flex-wrap gap-2">
                {selectedHighlights.map(h => (
                  <span key={h.id} className="inline-flex items-center gap-1.5 text-xs bg-muted px-3 py-1.5 rounded-full">
                    <h.icon size={14} className="text-primary" /> {h.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Value props */}
        <div className="space-y-8 mb-8">
          <div>
            <h3 className="font-heading text-lg font-bold text-foreground mb-2">Convertissez les visiteurs en clients</h3>
            <p className="text-sm text-muted-foreground">
              Affichez jusqu'à 6 badges accrocheurs sur votre page QMAPS pour mettre en avant ce qui rend votre entreprise spéciale.
            </p>
          </div>

          <div>
            <h3 className="font-heading text-lg font-bold text-foreground mb-2">Vos 2 meilleurs badges apparaissent dans les résultats de recherche</h3>
            <p className="text-sm text-muted-foreground">
              Vos 2 premiers badges apparaîtront dans les résultats de recherche, vous démarquant de la concurrence.
            </p>
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-card border-t border-border p-4 z-30">
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/merchant/upgrade")} className="flex-1 rounded-full text-sm">
            Économisez avec le Package
          </Button>
          <Button onClick={() => setStep("checkout")} className="flex-1 rounded-full text-sm" disabled={selected.length === 0}>
            Acheter · CA$2/jour
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MerchantHighlights;
