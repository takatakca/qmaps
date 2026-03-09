import { useNavigate } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";
import StarRating from "@/components/StarRating";
import { Eye, Users, Phone, MapPin, Globe, X, CheckCircle, Lightbulb, Star } from "lucide-react";

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
            <button className="text-sm font-medium text-primary mt-1 border border-primary rounded-full px-3 py-1">
              Atteindre avec des Annonces
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantOverview;
