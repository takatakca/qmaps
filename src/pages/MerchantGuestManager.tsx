import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Users, Globe, CalendarCheck, BarChart3, Smartphone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const features = [
  "Gérez les réservations en ligne à partir d'un seul endroit",
  "Acceptez les réservations via QMAPS, votre site web et d'autres réseaux",
  "Configurez et personnalisez votre propre « Page Réservation »",
  "Accédez à des données et analyses en temps réel",
  "Utilisez un logiciel facile à prendre en main",
];

const networkFeatures = [
  { icon: Globe, title: "Réseau de réservation", desc: "Les convives réservent via QMAPS, votre site web et plus encore." },
  { icon: CalendarCheck, title: "Réservations en ligne", desc: "Gérez toutes vos réservations depuis un tableau de bord unique." },
  { icon: BarChart3, title: "Données et analyses", desc: "Accédez aux données en temps réel pour optimiser votre activité." },
  { icon: Smartphone, title: "Application mobile", desc: "Gérez les réservations où que vous soyez." },
];

const plans = [
  {
    name: "Gratuit",
    price: "0",
    period: "",
    desc: "Pour commencer",
    features: ["Page de réservation QMAPS", "Liste d'attente", "Statistiques de base", "Application mobile"],
    highlight: false,
  },
  {
    name: "Basic",
    price: "149",
    period: "/mois",
    desc: "Tout dans Gratuit, avec",
    features: ["100 réservations/mois", "Intégration site web", "Rappels par courriel", "Rapports avancés"],
    highlight: true,
  },
  {
    name: "Plus",
    price: "299",
    period: "/mois",
    desc: "Tout dans Basic, avec",
    features: ["Réservations illimitées", "Gestion des invités", "Rapports sur mesure", "Support prioritaire"],
    highlight: false,
  },
];

const MerchantGuestManager = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", restaurant: "", zip: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!form.firstName || !form.email || !form.restaurant) {
      toast({ title: "Veuillez remplir les champs obligatoires", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      toast({ title: "Demande envoyée!", description: "Notre équipe vous contactera sous peu." });
      setSubmitting(false);
      setForm({ firstName: "", lastName: "", email: "", restaurant: "", zip: "", phone: "" });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="font-heading text-lg font-bold text-foreground">QMAPS Guest Manager</h1>
      </div>

      {/* Hero */}
      <div className="bg-primary px-6 py-10 text-primary-foreground">
        <h2 className="font-heading text-2xl font-bold leading-tight">
          Affichez vos tables partout avec QMAPS Guest Manager
        </h2>
        <ul className="mt-5 space-y-2.5">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm">
              <Check size={16} className="shrink-0 mt-0.5 text-primary-foreground/80" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Contact form */}
      <div className="px-4 py-6 space-y-4">
        <h3 className="font-heading text-lg font-bold text-foreground">Entrez vos coordonnées et un conseiller vous contactera</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-medium">Prénom *</Label>
            <Input value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} className="mt-1" />
          </div>
          <div>
            <Label className="text-sm font-medium">Nom</Label>
            <Input value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} className="mt-1" />
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium">Courriel *</Label>
          <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="mt-1" />
        </div>
        <div>
          <Label className="text-sm font-medium">Nom du restaurant *</Label>
          <Input value={form.restaurant} onChange={e => setForm(p => ({ ...p, restaurant: e.target.value }))} className="mt-1" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-medium">Code postal</Label>
            <Input value={form.zip} onChange={e => setForm(p => ({ ...p, zip: e.target.value }))} className="mt-1" />
          </div>
          <div>
            <Label className="text-sm font-medium">Téléphone</Label>
            <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="mt-1" />
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={submitting} className="w-full rounded-full">
          {submitting ? "Envoi..." : "Soumettre"}
        </Button>
      </div>

      {/* Stats */}
      <div className="bg-secondary px-6 py-8 text-center">
        <p className="font-heading text-4xl font-black text-foreground tracking-tight">Des millions</p>
        <p className="text-sm text-muted-foreground mt-1">de convives dans le réseau de réservation QMAPS</p>
      </div>

      {/* Network section */}
      <div className="px-4 py-6">
        <h3 className="font-heading text-lg font-bold text-foreground text-center mb-1">Le plus grand réseau de réservation ouvert</h3>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Les convives réservent via QMAPS, votre site web et plus encore. Atteignez les convives où qu'ils soient.
        </p>
        <div className="grid grid-cols-2 gap-4">
          {networkFeatures.map((f) => (
            <div key={f.title} className="bg-card border border-border rounded-xl p-4 text-center">
              <f.icon size={28} className="mx-auto text-primary mb-2" />
              <p className="text-sm font-bold text-foreground">{f.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="px-4 py-6 bg-muted/30">
        <h3 className="font-heading text-lg font-bold text-foreground text-center mb-1">Trouvez le plan adapté à vos besoins</h3>
        <p className="text-sm text-muted-foreground text-center mb-6">Des plans flexibles pour chaque restaurant.</p>
        <div className="space-y-4">
          {plans.map((plan) => (
            <div key={plan.name} className={`bg-card border rounded-xl p-5 ${plan.highlight ? "border-primary ring-2 ring-primary/20" : "border-border"}`}>
              <p className="font-heading text-base font-bold text-foreground">{plan.name}</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-foreground">{plan.price}$</span>
                {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{plan.desc}</p>
              <ul className="mt-3 space-y-1.5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <Check size={14} className="text-primary shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button variant={plan.highlight ? "default" : "outline"} className="w-full mt-4 rounded-full">
                {plan.price === "0" ? "Commencer gratuitement" : "Choisir ce plan"}
              </Button>
            </div>
          ))}
        </div>

        {/* Custom pricing */}
        <div className="bg-card border border-border rounded-xl p-5 mt-4 text-center">
          <p className="font-heading font-bold text-foreground">Tarification personnalisée</p>
          <p className="text-sm text-muted-foreground mt-1">Pour les grands groupes de restaurants.</p>
          <Button variant="outline" className="mt-3 rounded-full">Contactez-nous</Button>
        </div>
      </div>

      {/* Testimonial */}
      <div className="px-4 py-8">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} size={16} className="fill-star text-star" />
            ))}
          </div>
          <p className="text-sm text-foreground italic leading-relaxed">
            "QMAPS Guest Manager a révolutionné notre gestion des réservations. Nous avons augmenté notre taux de remplissage de 30% en seulement trois mois."
          </p>
          <p className="text-xs text-muted-foreground mt-3 font-medium">— Marie L., Restauratrice à Montréal</p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-primary px-6 py-8 text-center text-primary-foreground">
        <h3 className="font-heading text-xl font-bold">Prêt à commencer?</h3>
        <p className="text-sm mt-2 opacity-90">Rejoignez des milliers de restaurants qui utilisent QMAPS Guest Manager.</p>
        <Button variant="secondary" className="mt-4 rounded-full" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          Demander une démo
        </Button>
      </div>

      <div className="h-6" />
    </div>
  );
};

export default MerchantGuestManager;
