import { BarChart3, TrendingUp } from "lucide-react";

const InsightsSection = () => {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h2 className="font-heading font-bold text-foreground mb-1">Aperçus</h2>
      <p className="text-xs text-muted-foreground mb-3">Derniers 12 mois</p>

      <p className="text-sm text-foreground mb-3">Visites du profil : vous vs concurrents</p>

      {/* Chart placeholder */}
      <div className="h-40 bg-muted/30 rounded-lg flex items-center justify-center mb-3">
        <BarChart3 size={32} className="text-muted-foreground/30" />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded bg-primary" />
          <span className="text-[11px] text-muted-foreground">Votre entreprise</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded bg-muted-foreground/40" />
          <span className="text-[11px] text-muted-foreground">Concurrents locaux</span>
        </div>
      </div>
    </div>
  );
};

export default InsightsSection;
