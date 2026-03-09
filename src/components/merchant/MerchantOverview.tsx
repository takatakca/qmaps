import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";
import StarRating from "@/components/StarRating";
import {
  Eye, Users, Phone, MapPin, Globe, X, CheckCircle, Lightbulb, Star,
  Megaphone, MessageSquare, ArrowUpCircle, ChevronRight, MousePointerClick,
  Building, CalendarCheck, Camera, Inbox, Receipt, Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  business: Tables<"businesses">;
  reviews: any[];
}

const businessQuestions = [
  { q: "Avez-vous des **places en terrasse** ?", key: "outdoor_seating" },
  { q: "Offrez-vous le **Wi-Fi gratuit** ?", key: "free_wifi" },
  { q: "Acceptez-vous les **réservations** ?", key: "reservations" },
  { q: "Avez-vous un **stationnement** ?", key: "parking" },
  { q: "Offrez-vous la **livraison** ?", key: "delivery" },
  { q: "Avez-vous un **menu végétarien** ?", key: "vegetarian" },
  { q: "Acceptez-vous les **cartes de crédit** ?", key: "credit_cards" },
  { q: "Avez-vous un **bar** ?", key: "bar" },
  { q: "Êtes-vous **accessible en fauteuil roulant** ?", key: "wheelchair" },
  { q: "Offrez-vous le **service à emporter** ?", key: "takeout" },
  { q: "Avez-vous un **menu enfants** ?", key: "kids_menu" },
  { q: "Offrez-vous un **brunch** ?", key: "brunch" },
  { q: "Avez-vous la **climatisation** ?", key: "ac" },
  { q: "Proposez-vous des **événements privés** ?", key: "private_events" },
  { q: "Avez-vous un **service de traiteur** ?", key: "catering" },
];

const pageVisitsData = [
  { month: "Mar", you: 180, competitor: 286 },
  { month: "Avr", you: 210, competitor: 250 },
  { month: "Juin", you: 150, competitor: 220 },
  { month: "Août", you: 120, competitor: 171 },
  { month: "Oct", you: 90, competitor: 200 },
  { month: "Déc", you: 60, competitor: 180 },
  { month: "Fév", you: 87, competitor: 150 },
];

const competitors = [
  { name: "Café St-Barth", rating: 4.6, reviews: 171 },
  { name: "Le Petit Dep", rating: 4.3, reviews: 126 },
  { name: "Café Lulu", rating: 4.7, reviews: 98 },
];

const MerchantOverview = ({ business, reviews }: Props) => {
  const navigate = useNavigate();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [dismissedQuestion, setDismissedQuestion] = useState(false);

  const currentQuestion = businessQuestions[questionIndex];

  const handleAnswer = (answer: "yes" | "no" | "skip") => {
    if (questionIndex < businessQuestions.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else {
      setDismissedQuestion(true);
    }
  };

  const renderBoldText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/);
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
    );
  };

  const reminders = [
    {
      icon: <CheckCircle size={20} className="text-primary" />,
      text: "Vérifiez les détails de votre page pour apparaître dans plus de résultats.",
      action: "Terminer la configuration",
    },
    {
      icon: <Lightbulb size={20} className="text-amber-500" />,
      text: "Découvrez ce qui a changé chez vos principaux concurrents récemment.",
      action: "Voir les tendances",
    },
    {
      icon: <Star size={20} className="text-primary" />,
      text: "Aidez-nous à améliorer le système de recommandation QMAPS.",
      action: "Répondre au sondage",
    },
  ];

  const products = [
    { icon: <Megaphone size={22} className="text-primary" />, title: "Publicités QMAPS", desc: "Touchez plus de clients avec des annonces ciblées.", cta: "Créer une publicité", route: "/merchant/ads" },
    { icon: <MessageSquare size={22} className="text-primary" />, title: "QMAPS Connect", desc: "Partagez des publications avec vos clients.", cta: "Découvrir Connect", route: "/merchant/connect" },
    { icon: <MousePointerClick size={22} className="text-primary" />, title: "Call to Action", desc: "Convertissez les visites en clients.", cta: "À partir de CA$2/jour", route: "/merchant/cta" },
    { icon: <Star size={22} className="text-primary" />, title: "Business Highlights", desc: "Badges pour mettre en valeur votre entreprise.", cta: "À partir de CA$2/jour", route: "/merchant/highlights" },
    { icon: <Camera size={22} className="text-primary" />, title: "Photos & Vidéos", desc: "Gérez les photos de votre entreprise.", cta: "Gérer les photos", route: "/merchant/photos" },
    { icon: <MessageSquare size={22} className="text-primary" />, title: "Avis", desc: "Consultez et répondez aux avis clients.", cta: "Voir les avis", route: "/merchant/dashboard" },
    { icon: <Phone size={22} className="text-primary" />, title: "QMAPS Host", desc: "Réceptionniste virtuel IA.", cta: "Découvrir Host", route: "/merchant/host" },
    { icon: <CalendarCheck size={22} className="text-primary" />, title: "QMAPS Guest Manager", desc: "Gérez vos réservations en ligne.", cta: "Découvrir", route: "/merchant/guest-manager" },
    { icon: <Building size={22} className="text-primary" />, title: "Informations", desc: "Gérez catégories, heures, adresse.", cta: "Modifier", route: "/merchant/business-info" },
    { icon: <Inbox size={22} className="text-primary" />, title: "Boîte de réception", desc: "Messages de vos clients.", cta: "Voir les messages", route: "/merchant/inbox" },
    { icon: <Receipt size={22} className="text-primary" />, title: "Facturation", desc: "Solde, paiements et produits.", cta: "Voir la facturation", route: "/merchant/billing" },
  ];

  return (
    <div className="space-y-4">
      {/* Business card */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {business.image_url ? (
              <img src={business.image_url} alt={business.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-muted-foreground">{business.name[0]}</span>
            )}
          </div>
          <div className="flex-1">
            <h2 className="font-heading font-semibold text-foreground">{business.name}</h2>
            <p className="text-xs text-muted-foreground">{business.address}</p>
          </div>
          <button onClick={() => navigate(`/business/${business.id}`)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <Pencil size={14} className="text-foreground" />
          </button>
        </div>
      </div>

      {/* Questionnaire section */}
      {!dismissedQuestion && (
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-2">{questionIndex + 1} sur {businessQuestions.length} questions</p>
          <Progress value={((questionIndex + 1) / businessQuestions.length) * 100} className="h-1.5 mb-4" />
          <p className="text-foreground text-base mb-4">{renderBoldText(currentQuestion.q)}</p>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" className="rounded-full px-6" onClick={() => handleAnswer("yes")}>Oui</Button>
            <Button variant="outline" className="rounded-full px-6" onClick={() => handleAnswer("no")}>Non</Button>
            <Button variant="ghost" className="rounded-full px-6 text-muted-foreground" onClick={() => handleAnswer("skip")}>Passer</Button>
          </div>
        </div>
      )}

      {/* Insights - Page visits chart */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-heading font-bold text-foreground text-lg mb-1">Analyses</h3>
        <p className="text-xs text-muted-foreground mb-2">12 derniers mois</p>
        <p className="text-sm font-semibold text-foreground mb-3">Visites de page : vous vs concurrents</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={pageVisitsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="you" name="Votre entreprise" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="competitor" name="Concurrents" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary inline-block rounded" /> Votre entreprise</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-muted-foreground inline-block rounded" /> Plage typique</span>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" className="rounded-full text-xs flex-1">Comparer les visites</Button>
          <Button variant="outline" size="sm" className="rounded-full text-xs flex-1 text-primary border-primary">Modifier concurrents</Button>
        </div>
      </div>

      {/* Highly viewed competitors */}
      <div className="bg-card rounded-xl border border-border p-4">
        <p className="text-xs text-muted-foreground mb-1">30 derniers jours</p>
        <h3 className="font-heading font-semibold text-foreground mb-3">Concurrents les plus vus</h3>
        <div className="space-y-3">
          {competitors.map((c, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">{c.name[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{c.name}</p>
                <div className="flex items-center gap-1">
                  <StarRating rating={c.rating} size={12} />
                  <span className="text-xs text-muted-foreground">{c.rating} ({c.reviews} avis)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Potential customers */}
      <div className="bg-card rounded-xl border border-border p-4">
        <p className="text-xs text-muted-foreground mb-1">14 derniers jours</p>
        <h3 className="font-heading font-semibold text-foreground mb-3">Clients potentiels</h3>
        <div className="w-full h-40 bg-muted rounded-lg flex items-center justify-center mb-3">
          <MapPin size={32} className="text-muted-foreground" />
        </div>
        <div className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
          <Globe size={18} className="text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-foreground">Des gens cherchent des services que vous offrez mais ne vous trouvent pas. Mettez à jour vos informations pour plus de visibilité.</p>
            <button onClick={() => navigate("/merchant/business-info")} className="text-sm font-medium text-primary mt-1">Mettre à jour mes informations</button>
          </div>
        </div>
      </div>

      {/* Recent competitor reviews */}
      <div className="bg-card rounded-xl border border-border p-4">
        <p className="text-xs text-muted-foreground mb-1">30 derniers jours</p>
        <h3 className="font-heading font-semibold text-foreground mb-3">Avis récents des concurrents</h3>
        {competitors.length > 0 ? (
          <div className="space-y-3">
            <div className="border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-foreground">Café Lulu</span>
                <StarRating rating={4.7} size={12} />
                <span className="text-xs text-muted-foreground">4.7 (96 avis)</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3">Le service était incroyable! Le personnel était très accueillant. Un endroit charmant à visiter à Montréal...</p>
              <button className="text-xs font-medium text-primary mt-1">Voir sur QMAPS</button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Aucun avis de concurrent récent.</p>
        )}
      </div>

      {/* Learn tips */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-start gap-3">
          <Lightbulb size={20} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-foreground">Apprenez 5 choses gratuites que vous pouvez faire sur QMAPS pour rester compétitif.</p>
            <button className="text-sm font-medium text-primary mt-1">En savoir plus</button>
          </div>
        </div>
      </div>

      {/* Upgrade banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">⬆ Upgrade</span>
          <button className="text-muted-foreground"><X size={16} /></button>
        </div>
        <h3 className="font-heading font-semibold text-foreground mb-1">Améliorez votre page</h3>
        <p className="text-xs text-muted-foreground mb-3">Ces fonctionnalités peuvent améliorer votre page QMAPS et booster l'attrait de votre entreprise.</p>
        <div className="bg-card rounded-lg p-3 border border-border mb-3">
          <div className="flex items-start justify-between">
            <p className="text-sm text-foreground">Accédez aux fonctionnalités améliorées pour <strong>62% de moins</strong> avec le Package Upgrade.</p>
            <button className="text-muted-foreground"><X size={14} /></button>
          </div>
          <button onClick={() => navigate("/merchant/upgrade")} className="text-sm font-medium text-primary mt-1">Économisez avec le Bundle →</button>
        </div>
      </div>

      {/* Products grid */}
      <div className="space-y-3">
        <h3 className="font-heading font-semibold text-foreground px-1">Produits & Services FLEXS</h3>
        {products.map((p, i) => (
          <button
            key={i}
            onClick={() => navigate(p.route)}
            className="w-full bg-card rounded-xl border border-border p-4 flex items-center gap-3 text-left hover:border-primary/40 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">{p.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{p.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{p.desc}</p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default MerchantOverview;
