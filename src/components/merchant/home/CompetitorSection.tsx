import { useNavigate } from "react-router-dom";
import StarRating from "@/components/StarRating";
import { ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import MvpPreviewBadge from "@/components/common/MvpPreviewBadge";

const mockCompetitors = [
  { name: "Café Lumière", rating: 4.3, reviews: 61 },
  { name: "Bistro du Parc", rating: 4.7, reviews: 96 },
  { name: "Le Petit Déjeuner", rating: 4.3, reviews: 100 },
];

const CompetitorSection = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* Competitors list */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-bold text-foreground">Comparez vos visites</h2>
            <MvpPreviewBadge variant="inline" />
          </div>
          <button className="text-xs text-primary font-semibold">Modifier →</button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Données d'exemple — branchement en cours</p>

        <p className="text-sm font-semibold text-foreground mb-2">Concurrents les plus consultés</p>
        <div className="space-y-2">
          {mockCompetitors.map((c, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/30">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
                {c.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                <div className="flex items-center gap-1.5">
                  <StarRating rating={c.rating} size={11} />
                  <span className="text-[11px] text-muted-foreground">{c.rating} ({c.reviews} avis)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Potential customers map placeholder */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground">Carte des recherches locales</p>
          <MvpPreviewBadge variant="inline" />
        </div>
        <h2 className="font-heading font-bold text-foreground mb-3">Clients potentiels</h2>
        <div className="h-40 bg-muted/30 rounded-lg flex items-center justify-center mb-3">
          <MapPin size={32} className="text-muted-foreground/30" />
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Attirez plus de clients des zones qui vous recherchent le plus avec QMAPS Ads.
        </p>
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigate("/merchant/optimization")}>
          Commencer →
        </Button>
      </div>
    </>
  );
};

export default CompetitorSection;
