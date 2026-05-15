import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, MousePointerClick, ExternalLink, Phone as PhoneIcon, UtensilsCrossed, PenLine, Calendar as CalendarIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const POPULAR_MESSAGES = [
  { id: "free_app", label: "Achetez 2 entrées, obtenez l'app GRATUITE", desc: "Offre spéciale" },
  { id: "weekly", label: "Spéciaux de la semaine", desc: "Hebdomadaire" },
];

const DESTINATIONS = [
  { id: "website", label: "Vers mon site web", icon: ExternalLink },
  { id: "menu", label: "Vers mon menu", icon: UtensilsCrossed },
  { id: "call", label: "Appelez-nous", icon: PhoneIcon },
];

const CTA_TYPES = [
  "Obtenir l'offre",
  "Acheter des billets",
  "Contactez-nous",
  "Réserver",
  "En savoir plus",
];

type Step = "info" | "checkout";

const MerchantCTA = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("info");

  // Form state
  const [messageType, setMessageType] = useState<"popular" | "custom">("custom");
  const [selectedPopular, setSelectedPopular] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [ctaLabel, setCtaLabel] = useState("Obtenir l'offre");
  const [destination, setDestination] = useState("website");
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState<Date | undefined>();

  // Payment state
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [hasPromo, setHasPromo] = useState(false);
  const [promoCode, setPromoCode] = useState("");

  if (step === "checkout") {
    return (
      <div className="min-h-screen bg-background max-w-lg mx-auto pb-12">
        <div className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => setStep("info")}><ArrowLeft size={22} className="text-foreground" /></button>
          <h1 className="font-heading text-base font-bold text-foreground">Achat Call to Action</h1>
        </div>

        <div className="px-4 pt-6">
          <h2 className="font-heading text-xl font-bold text-foreground mb-1">Achat Call to Action</h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
            <Shield size={14} /> Paiement sécurisé
          </div>

          {/* Order summary */}
          <h3 className="font-heading font-bold text-foreground mb-3">Résumé de la commande</h3>
          <div className="bg-card rounded-xl border border-border p-4 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <MousePointerClick size={20} className="text-primary mt-0.5" />
              <div className="flex-1">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Call to Action</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Convertissez les visites en clients potentiels.</p>
                  </div>
                  <p className="text-sm font-medium text-foreground">CA$2/jour moy</p>
                </div>
              </div>
            </div>
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
        <h1 className="font-heading text-base font-bold text-foreground">Call to Action</h1>
      </div>

      <div className="px-4 pt-6">
        {/* Hero */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <MousePointerClick size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">Call to Action</h2>
            <p className="text-xs text-muted-foreground">CA$2/jour moyenne</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Facilitez la tâche aux clients pour en savoir plus sur vos spéciaux hebdomadaires, vos offres Happy Hour ou obtenir un rabais avec un Call to Action entièrement personnalisable.
        </p>

        <Button onClick={() => navigate("/merchant/billing/plans")} className="w-full rounded-full mb-2">
          Bientôt disponible · Voir les plans
        </Button>
        <Button variant="outline" onClick={() => navigate("/merchant/upgrade")} className="w-full rounded-full mb-8">
          Économisez avec le Package
        </Button>

        {/* Get more customers */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">👋</span>
            <h3 className="font-heading text-lg font-bold text-foreground">Attirez plus de clients</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Encouragez plus de trafic en promouvant des offres spéciales pendant les heures creuses ou des articles de menu saisonniers.
          </p>

          {/* Preview card */}
          <div className="bg-card rounded-xl border border-border p-4 mb-2">
            <div className="bg-muted rounded-lg h-24 mb-3 flex items-center justify-center">
              <span className="text-muted-foreground text-xs">Nom de l'entreprise</span>
            </div>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="w-3 h-3 rounded-full bg-primary" />
              ))}
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
              <p className="text-sm font-medium text-foreground">💰 5$ de rabais sur un achat de 25$</p>
              <button className="text-xs text-primary font-medium mt-1">Obtenir l'offre</button>
            </div>
          </div>
        </div>

        {/* Customize your message */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <PenLine size={20} className="text-primary" />
            <h3 className="font-heading text-lg font-bold text-foreground">Personnalisez votre message</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Choisissez parmi les options populaires ou créez votre propre message adapté à votre entreprise.
          </p>

          <RadioGroup value={messageType === "popular" ? selectedPopular : "custom"} onValueChange={(v) => {
            if (v === "custom") {
              setMessageType("custom");
              setSelectedPopular("");
            } else {
              setMessageType("popular");
              setSelectedPopular(v);
            }
          }}>
            {POPULAR_MESSAGES.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-border mb-2">
                <RadioGroupItem value={m.id} id={m.id} />
                <label htmlFor={m.id} className="flex-1 cursor-pointer">
                  <p className="text-sm font-medium text-foreground">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </label>
              </div>
            ))}
            <div className={`p-3 rounded-lg border mb-2 ${messageType === "custom" ? "border-primary bg-primary/5" : "border-border"}`}>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="custom" id="custom" />
                <label htmlFor="custom" className="text-sm font-medium text-foreground cursor-pointer">
                  Créer mon propre Call to Action
                </label>
              </div>
              {messageType === "custom" && (
                <div className="mt-3 space-y-3 pl-7">
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Textarea value={customDesc} onChange={e => setCustomDesc(e.target.value)} placeholder="Écrivez votre message" className="rounded-lg mt-1" rows={2} />
                  </div>
                  <div>
                    <Label className="text-xs">Call to Action</Label>
                    <select
                      value={ctaLabel}
                      onChange={e => setCtaLabel(e.target.value)}
                      className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    >
                      {CTA_TYPES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </RadioGroup>
        </div>

        {/* Choose destination */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <ExternalLink size={20} className="text-primary" />
            <h3 className="font-heading text-lg font-bold text-foreground">Choisissez où envoyer les clients</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Envoyez les clients vers votre site web, votre menu ou faites-les vous appeler directement.
          </p>

          <div className="bg-card rounded-xl border border-border p-3">
            <p className="text-xs text-muted-foreground mb-2">Choisissez la destination</p>
            <div className="grid grid-cols-3 gap-2">
              {DESTINATIONS.map(d => (
                <button
                  key={d.id}
                  onClick={() => setDestination(d.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                    destination === d.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <d.icon size={18} className={destination === d.id ? "text-primary" : "text-muted-foreground"} />
                  <span className={`text-[11px] leading-tight text-center ${destination === d.id ? "text-primary font-semibold" : "text-foreground"}`}>{d.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Update anytime */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <CalendarIcon size={20} className="text-primary" />
            <h3 className="font-heading text-lg font-bold text-foreground">Mettez à jour votre Call to Action à tout moment</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Changez votre message aussi souvent que vous le souhaitez pour répondre à de nouveaux objectifs ou promouvoir des offres saisonnières.
          </p>

          <div className="bg-card rounded-xl border border-border p-4 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <CalendarIcon size={14} className="text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Spécial du Nouvel An!</p>
            </div>
            <button className="text-xs text-primary font-medium">Obtenir l'offre</button>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <input type="checkbox" checked={hasEndDate} onChange={e => setHasEndDate(e.target.checked)} className="rounded" />
            <span className="text-sm text-foreground">Planifier une date de fin</span>
          </div>

          {hasEndDate && (
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                className="rounded-xl border border-border"
              />
            </div>
          )}
        </div>
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-card border-t border-border p-4 z-30">
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/merchant/upgrade")} className="flex-1 rounded-full text-sm">
            Économisez avec le Package
          </Button>
          <Button onClick={() => navigate("/merchant/billing/plans")} className="flex-1 rounded-full text-sm">
            Bientôt disponible
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MerchantCTA;
