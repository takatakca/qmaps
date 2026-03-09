import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Pause, Phone, MessageSquare, Globe, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BottomNav from "@/components/BottomNav";

const features = [
  { icon: Phone, text: "Gère les réservations et listes d'attente, et répond à chaque appel, même après les heures de service." },
  { icon: MessageSquare, text: "Filtre les questions des clients et le spam pendant que votre équipe se concentre sur le service." },
  { icon: Globe, text: "Parle 16 langues dont le français, l'anglais, l'espagnol et le mandarin." },
  { icon: MessageSquare, text: "Envoie aux clients un lien pour les commandes à emporter. Bientôt, les clients pourront commander via QMAPS Host." },
  { icon: Users, text: "Se synchronise avec QMAPS Guest Manager, pour que les réservations et listes d'attente soient mises à jour en temps réel." },
];

const QmapsHost = () => {
  const navigate = useNavigate();
  const [playing, setPlaying] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (firstName && phone && email) setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="font-heading text-lg font-bold text-foreground">QMAPS Host</h1>
      </div>

      <div className="px-4 pt-6">
        {/* Hero */}
        <div className="mb-6">
          <h2 className="font-heading text-2xl font-bold text-primary leading-tight">Ne manquez jamais un appel</h2>
          <h3 className="font-heading text-2xl font-bold text-foreground">avec QMAPS Host</h3>
        </div>

        {/* Audio player */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-2">Écoutez QMAPS Host en action</p>
          <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
            <button onClick={() => setPlaying(!playing)} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
              {playing ? <Pause size={18} className="text-primary-foreground" /> : <Play size={18} className="text-primary-foreground ml-0.5" />}
            </button>
            <div className="flex-1">
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: playing ? "45%" : "0%" }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">0:00 / 1:06</span>
              </div>
            </div>
          </div>
        </div>

        {/* Demo form */}
        <div className="bg-card border border-border rounded-xl p-5 mb-8">
          {submitted ? (
            <div className="text-center py-6">
              <CheckCircle size={48} className="text-primary mx-auto mb-3" />
              <h3 className="font-heading font-bold text-foreground mb-1">Demande envoyée!</h3>
              <p className="text-sm text-muted-foreground">Nous vous contacterons bientôt pour planifier votre démo.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-foreground mb-1">Remplissez le formulaire ci-dessous</p>
              <p className="text-sm text-foreground mb-4">
                ou appelez le <span className="font-bold text-primary">(888) 670-9357</span> pour réserver une démo
              </p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <Label className="text-xs">Prénom</Label>
                  <Input value={firstName} onChange={e => setFirstName(e.target.value)} className="rounded-lg" />
                </div>
                <div>
                  <Label className="text-xs">Nom</Label>
                  <Input value={lastName} onChange={e => setLastName(e.target.value)} className="rounded-lg" />
                </div>
              </div>
              <div className="space-y-3 mb-4">
                <div>
                  <Label className="text-xs">Téléphone</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} type="tel" className="rounded-lg" />
                </div>
                <div>
                  <Label className="text-xs">Courriel</Label>
                  <Input value={email} onChange={e => setEmail(e.target.value)} type="email" className="rounded-lg" />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mb-3">
                En continuant, vous acceptez les <button className="text-primary underline">Conditions d'utilisation</button> et la <button className="text-primary underline">Politique de confidentialité</button> de QMAPS.
              </p>
              <Button onClick={handleSubmit} className="w-full rounded-full">Planifier un appel</Button>
            </>
          )}
        </div>

        {/* Features */}
        <div className="space-y-5 mb-8">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <f.icon size={16} className="text-primary" />
              </div>
              <p className="text-sm text-foreground">{f.text}</p>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <p className="text-xs text-muted-foreground mb-1">Économisez avec QMAPS Host + Guest Manager</p>
          <p className="text-foreground text-sm">
            À partir de <span className="font-bold text-primary text-lg">199$/mois</span>
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            1. QMAPS Host + Guest Manager à 199$/mois (régulièrement 278$/mois). Après 500 appels par mois, un frais de 0,25$ par appel s'applique. Les appels spam sont exclus. Nouveaux clients admissibles uniquement. Ne peut être combiné avec d'autres offres.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default QmapsHost;
