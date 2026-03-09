import { Eye, Users, MousePointerClick, Info } from "lucide-react";

interface Props {
  reviewsCount: number;
}

const PerformanceSection = ({ reviewsCount }: Props) => {
  const impressions = reviewsCount * 12 || 0;
  const pageVisits = reviewsCount * 3 || 0;
  const leads = reviewsCount || 0;

  const metrics = [
    { label: "Impressions", value: impressions, icon: Eye },
    { label: "Visites du profil", value: pageVisits, icon: Users },
    { label: "Prospects", value: leads, icon: MousePointerClick },
  ];

  return (
    <div>
      <h2 className="font-heading font-bold text-foreground mb-1">Résumé des performances</h2>
      <p className="text-xs text-muted-foreground mb-3">Derniers 30 jours</p>
      <div className="grid grid-cols-3 gap-2">
        {metrics.map((m, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-[11px] text-muted-foreground">{m.label}</span>
              <Info size={10} className="text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground">{m.value > 0 ? m.value : "—"}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceSection;
