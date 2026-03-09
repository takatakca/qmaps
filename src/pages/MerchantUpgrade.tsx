import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Check, TrendingUp, Eye, Target, Award, Image, MessageSquare, Megaphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";

const FEATURES = [
  { icon: MessageSquare, title: "Rejoignez vos clients d'une nouvelle façon", desc: "Créez des publications importantes, des mises à jour ou des nouvelles sur votre entreprise pour les clients nouveaux et existants." },
  { icon: Eye, title: "Gardez l'attention sur votre entreprise", desc: "Le Package Upgrade élimine les publicités de concurrents de votre page. Cela aide à garder vos clients concentrés après qu'ils aient cliqué sur votre page." },
  { icon: Target, title: "Convertissez les visites en clients", desc: "Le Package Upgrade est optimisé pour convertir les vues de votre page en appels, messages et visites. Ajoutez un appel à l'action entièrement personnalisable." },
  { icon: TrendingUp, title: "Démarquez-vous dans les résultats de recherche", desc: "Distinguez-vous de vos concurrents avec des badges Business Highlights. Choisissez parmi 30+ badges accrocheurs pour mettre en valeur 2 points forts." },
  { icon: Award, title: "Renforcez la confiance et la notoriété", desc: "Téléchargez le logo de votre entreprise et affichez-le sur votre page et dans les résultats de recherche. Un moyen subtil mais efficace de donner une apparence plus professionnelle." },
  { icon: Image, title: "Choisissez vos photos vedettes", desc: "Les premières impressions sont importantes. Le diaporama vous permet de choisir les photos que vous souhaitez mettre en avant en haut de votre page." },
];

const MerchantUpgrade = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"info" | "checkout">("info");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [postalCode, setPostalCode] = useState("");

  if (step === "checkout") {
    return (
      <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
        <div className="px-4 pt-4">
          <button onClick={() => setStep("info")} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center mb-4">
            <ArrowLeft size={18} className="text-foreground" />
          </button>

          <h1 className="font-heading text-xl font-bold text-foreground mb-1">Commencez votre essai gratuit de 14 jours</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Shield size={14} /> Paiement sécurisé
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Vos informations de carte sont nécessaires pour commencer, mais vous pouvez annuler à tout moment avant la fin de votre période d'essai le {new Date(Date.now() + 14 * 86400000).toLocaleDateString("fr-CA")} gratuitement.
          </p>

          {/* Order Summary */}
          <h2 className="font-heading font-bold text-foreground mb-3">Résumé de la commande</h2>
          <div className="bg-card rounded-xl border border-border p-4 mb-4">
            <div className="flex items-start gap-3 mb-4">
              <Megaphone size={20} className="text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Package Upgrade <span className="line-through text-muted-foreground text-xs">CA$14</span> <span className="font-bold">CA$6/jour moy</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Votre package inclut QMAPS Connect, Business Highlights, Appel à l'action, Logo, Suppression des pubs concurrentes, et Diaporama.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 border-t border-border pt-3">
              <Check size={20} className="text-green-500 mt-0.5" />
              <div className="flex-1">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-foreground">Essai gratuit de 14 jours</p>
                  <span className="text-sm font-bold text-green-600">Gratuit</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Les entreprises voient en moyenne 50 visites supplémentaires sur leur page 14 jours après la mise en place du Package Upgrade.*
                </p>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
            <div className="flex justify-between mb-1">
              <p className="font-bold text-foreground">Votre total aujourd'hui</p>
              <p className="font-bold text-foreground">CA$0</p>
            </div>
            <p className="text-xs text-muted-foreground">Vous pouvez annuler gratuitement avant la fin de la période d'essai.</p>
            <p className="text-xs text-muted-foreground mt-3">
              Après la période d'essai, votre charge mensuelle sera de CA$180, proratée pour les mois partiels. Votre première facture sera le {new Date(Date.now() + 14 * 86400000).toLocaleDateString("fr-CA")}, très probablement pour un montant proraté.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              *Basé sur un échantillon d'entreprises qui ont configuré le Package Upgrade. L'étude a comparé les pages vues reçues 14 jours avant la configuration par rapport aux 14 jours suivants.
            </p>
          </div>

          {/* Payment Form */}
          <h2 className="font-heading font-bold text-foreground mb-4">Informations de paiement</h2>
          <div className="space-y-3">
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
            <p className="text-[10px] text-muted-foreground">
              En procédant, j'accepte les <button className="text-primary underline">Conditions de service</button> de QMAPS.
            </p>
            <Button className="w-full rounded-full font-bold">Essayer gratuitement pendant 14 jours</Button>
            <button onClick={() => setStep("info")} className="w-full text-center text-sm text-muted-foreground py-2">Annuler</button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="px-4 pt-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center mb-4">
          <ArrowLeft size={18} className="text-foreground" />
        </button>

        <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Package Upgrade</h1>
        <p className="text-sm text-muted-foreground mb-1">
          Les entreprises voient en moyenne <span className="font-bold text-foreground">50 visites de page supplémentaires</span> 14 jours après la configuration.*
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Un ensemble de fonctionnalités qui augmente l'attrait de votre page et de votre entreprise.
        </p>

        <div className="space-y-1 mb-6">
          {["Se démarquer dans les résultats de recherche", "Mettre en valeur votre meilleur travail", "Convertir les vues en clients"].map(t => (
            <div key={t} className="flex items-center gap-2">
              <Check size={16} className="text-primary" />
              <span className="text-sm text-foreground">{t}</span>
            </div>
          ))}
          <p className="text-xs text-primary font-medium mt-1">💰 Seulement CA$6/jour moy (normalement CA$14/jour)</p>
        </div>

        <h2 className="font-heading font-bold text-foreground mb-4">Le Package Upgrade vous permet de…</h2>

        <div className="space-y-6 mb-8">
          {FEATURES.map((f, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <f.icon size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Sticky CTA */}
        <div className="bg-card border-t border-border p-4 rounded-xl mb-4">
          <p className="text-center text-sm font-bold text-foreground mb-1">Package Upgrade · Essai gratuit</p>
          <Button onClick={() => setStep("checkout")} className="w-full rounded-full font-bold">
            Essayer gratuitement pendant 14 jours
          </Button>
          <button onClick={() => navigate(-1)} className="w-full text-center text-sm text-muted-foreground py-2">Annuler</button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default MerchantUpgrade;
