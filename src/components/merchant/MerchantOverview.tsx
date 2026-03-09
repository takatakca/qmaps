import { useNavigate } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";
import StarRating from "@/components/StarRating";
import { Eye, Users, Phone, MapPin, Globe, X, CheckCircle, Lightbulb, Star, Megaphone, MessageSquare, ArrowUpCircle, ChevronRight, MousePointerClick, Building, CalendarCheck, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  business: Tables<"businesses">;
  reviews: any[];
}

const MerchantOverview = ({ business, reviews }: Props) => {
  const navigate = useNavigate();

  const reminders = [
    {
      icon: <CheckCircle size={20} className="text-primary" />,
      text: "Vérifiez les détails de votre page pour apparaître dans plus de résultats.",
      action: "Terminer la configuration",
      onAction: () => {},
    },
    {
      icon: <Lightbulb size={20} className="text-amber-500" />,
      text: "Découvrez ce qui a changé chez vos principaux concurrents récemment.",
      action: "Voir les tendances",
      onAction: () => {},
    },
    {
      icon: <Star size={20} className="text-primary" />,
      text: "Aidez-nous à améliorer le système de recommandation QMAPS.",
      action: "Répondre au sondage",
      onAction: () => {},
    },
  ];

  const products = [
    {
      icon: <Megaphone size={22} className="text-primary" />,
      title: "Publicités QMAPS",
      desc: "Touchez plus de clients avec des annonces ciblées dans les résultats de recherche.",
      cta: "Créer une publicité",
      route: "/merchant/ads",
    },
    {
      icon: <MessageSquare size={22} className="text-primary" />,
      title: "QMAPS Connect",
      desc: "Partagez des publications et mises à jour directement avec vos clients.",
      cta: "Découvrir Connect",
      route: "/merchant/connect",
    },
    {
      icon: <Phone size={22} className="text-primary" />,
      title: "QMAPS Host",
      desc: "Réceptionniste virtuel IA — ne manquez jamais un appel.",
      cta: "Découvrir Host",
      route: "/merchant/host",
    },
    {
      icon: <ArrowUpCircle size={22} className="text-primary" />,
      title: "Package Upgrade",
      desc: "Supprimez les pubs concurrentes, ajoutez un CTA personnalisé et plus encore.",
      cta: "Essai gratuit 14 jours",
      route: "/merchant/upgrade",
    },
    {
      icon: <Star size={22} className="text-primary" />,
      title: "Business Highlights",
      desc: "Affichez des badges pour mettre en valeur ce qui rend votre entreprise unique.",
      cta: "À partir de CA$2/jour",
      route: "/merchant/highlights",
    },
    {
      icon: <MousePointerClick size={22} className="text-primary" />,
      title: "Call to Action",
      desc: "Convertissez les visites en clients avec un CTA personnalisable sur votre page.",
      cta: "À partir de CA$2/jour",
      route: "/merchant/cta",
    },
    {
      icon: <Building size={22} className="text-primary" />,
      title: "Informations de l'entreprise",
      desc: "Gérez vos catégories, heures, adresse, commodités et plus encore.",
      cta: "Modifier les infos",
      route: "/merchant/business-info",
    },
    {
      icon: <CalendarCheck size={22} className="text-primary" />,
      title: "QMAPS Guest Manager",
      desc: "Gérez vos réservations en ligne et optimisez le remplissage de vos tables.",
      cta: "Découvrir Guest Manager",
      route: "/merchant/guest-manager",
    },
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
          </div>
          <button
            onClick={() => navigate(`/business/${business.id}`)}
            className="text-sm font-medium text-primary"
          >
            Voir
          </button>
        </div>
      </div>

      {/* Reminders */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-4">
        <h3 className="font-heading font-semibold text-foreground">Rappels</h3>
        {reminders.map((r, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="mt-0.5">{r.icon}</div>
            <div className="flex-1">
              <p className="text-sm text-foreground">{r.text}</p>
              <button className="text-sm font-medium text-primary mt-1">{r.action}</button>
            </div>
            <button className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Ad preview */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <h3 className="font-heading font-semibold text-foreground">Aperçu de votre annonce QMAPS</h3>
        <div className="bg-muted rounded-lg p-3 flex gap-3">
          <div className="w-20 h-20 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
            {business.image_url ? (
              <img src={business.image_url} alt={business.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">Photo</div>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{business.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{business.description || "Restaurant"}</p>
            <p className="text-xs text-muted-foreground">{business.address}</p>
          </div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 flex items-start gap-3">
          <div className="text-primary mt-0.5">📈</div>
          <div>
            <p className="text-sm text-foreground">
              Les gens ont cherché votre catégorie <strong>1 219 fois</strong> le mois dernier dans un rayon de 15 km.
            </p>
            <button onClick={() => navigate("/merchant/ads")} className="text-sm font-medium text-primary mt-1 border border-primary rounded-full px-3 py-1">
              Créer une publicité QMAPS
            </button>
          </div>
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
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              {p.icon}
            </div>
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
