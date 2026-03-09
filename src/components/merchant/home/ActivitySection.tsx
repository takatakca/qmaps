import { useNavigate } from "react-router-dom";
import { ChevronRight, BarChart3 } from "lucide-react";

interface Props {
  hasActivity: boolean;
}

const ActivitySection = ({ hasActivity }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-heading font-bold text-foreground">Activité</h2>
        <button onClick={() => navigate("/merchant")} className="text-muted-foreground">
          <ChevronRight size={18} />
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-3">Derniers 30 jours</p>

      <div className="flex gap-3 mb-3">
        <span className="text-xs font-semibold text-foreground border-b-2 border-primary pb-1">Visites du profil</span>
        <span className="text-xs text-muted-foreground pb-1">Prospects</span>
      </div>

      {!hasActivity ? (
        <div className="text-center py-6">
          <BarChart3 size={40} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            Nous venons de commencer à suivre l'activité de votre page. Revenez demain pour voir les résultats.
          </p>
        </div>
      ) : (
        <div className="h-32 bg-muted/30 rounded-lg flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Graphique d'activité</span>
        </div>
      )}
    </div>
  );
};

export default ActivitySection;
