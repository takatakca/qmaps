import { useNavigate } from "react-router-dom";
import { Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const UpgradePromoSection = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="bg-primary/5 px-3 py-1.5">
        <span className="text-[11px] font-bold text-primary uppercase tracking-wide flex items-center gap-1">
          <Crown size={12} /> Mise à niveau
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-heading font-bold text-foreground mb-1">Démarquez-vous de la concurrence</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Montrez à vos clients ce qui rend votre entreprise unique avec des fonctionnalités améliorées.
        </p>
        <Button onClick={() => navigate("/merchant/optimization")} className="w-full rounded-full">
          Essai gratuit de 14 jours
        </Button>
      </div>
    </div>
  );
};

export default UpgradePromoSection;
