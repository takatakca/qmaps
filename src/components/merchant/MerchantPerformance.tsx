import { Eye, Users, Phone, MapPin, Globe } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  business: Tables<"businesses">;
}

const pageVisitsData = [
  { month: "Mar", you: 2, competitor: 120, typical: 10 },
  { month: "Mai", you: 1, competitor: 80, typical: 8 },
  { month: "Jul", you: 3, competitor: 60, typical: 12 },
  { month: "Sep", you: 1, competitor: 155, typical: 15 },
  { month: "Nov", you: 2, competitor: 90, typical: 10 },
  { month: "Jan", you: 0, competitor: 50, typical: 8 },
];

const leadsData = [
  { month: "Mai", leads: 0, potential: 20 },
  { month: "Jul", leads: 0, potential: 40 },
  { month: "Sep", leads: 0, potential: 80 },
  { month: "Nov", leads: 0, potential: 120 },
  { month: "Jan", leads: 0, potential: 160 },
  { month: "Mar", leads: 0, potential: 220 },
];

const MerchantPerformance = ({ business }: Props) => {
  const stats = [
    { label: "Impressions", value: "148", icon: Eye, info: true },
    { label: "Visites de page", value: "--", icon: Users, info: true },
    { label: "Leads", value: "--", icon: Globe, info: true },
  ];

  const leadsBreakdown = [
    { label: "Visites site web", value: 0, icon: Globe },
    { label: "Appels", value: 0, icon: Phone },
    { label: "Itinéraires & vues carte", value: 0, icon: MapPin },
  ];

  return (
    <div className="space-y-4">
      {/* Performance summary hero */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-heading font-semibold text-foreground text-lg mb-3">Résumé de performance</h3>
        <div className="bg-muted rounded-lg p-4 mb-4">
          <p className="text-sm text-foreground">
            <strong>Nous mettons votre entreprise en avant.</strong> Vous êtes apparu{" "}
            <strong>148 fois</strong> dans les résultats de recherche QMAPS au cours des 30 derniers jours.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Consultez les analyses ci-dessous pour voir comment atteindre plus de clients.
          </p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">30 derniers jours</span>
          <button className="text-sm font-medium text-primary">Voir le détail →</button>
        </div>

        <div className="space-y-4">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <s.icon size={18} className="text-muted-foreground" />
              <span className="text-sm text-foreground flex-1">{s.label}</span>
              <span className="text-2xl font-bold text-foreground">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Leads breakdown */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-heading font-semibold text-foreground mb-3">Détail de vos leads</h3>
        <div className="space-y-3">
          {leadsBreakdown.map((l, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <l.icon size={18} className="text-muted-foreground" />
                <span className="text-sm text-foreground">{l.label}</span>
              </div>
              <span className="font-semibold text-foreground">{l.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Insights - Page visits chart */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-heading font-semibold text-foreground mb-1">Analyses</h3>
        <p className="text-xs text-muted-foreground mb-3">12 derniers mois</p>
        <p className="text-sm font-semibold text-foreground mb-4">Visites de page : vous vs concurrents</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={pageVisitsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="you" name="Votre entreprise" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="competitor" name="Concurrent" stroke="hsl(var(--foreground))" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="typical" name="Plage typique" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="4 4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Leads chart */}
      <div className="bg-card rounded-xl border border-border p-4">
        <p className="text-xs text-muted-foreground mb-1">12 derniers mois</p>
        <p className="text-sm font-semibold text-foreground mb-4">Leads</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={leadsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="potential" name="Potentiel avec Annonces" fill="hsl(var(--primary) / 0.2)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="leads" name="Leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 mt-4">
          <p className="text-sm text-foreground">
            Les entreprises comme la vôtre peuvent obtenir environ <strong>206-248 leads par mois</strong> avec un budget moyen de 24$/jour.
          </p>
          <button className="text-sm font-medium text-primary mt-1">Obtenir plus de leads avec des Annonces</button>
        </div>
      </div>

      {/* Competitor reviews */}
      <div className="bg-card rounded-xl border border-border p-4">
        <p className="text-xs text-muted-foreground mb-1">30 derniers jours</p>
        <h3 className="font-heading font-semibold text-foreground mb-3">Avis récents des concurrents</h3>
        <div className="text-center py-6 text-muted-foreground text-sm">
          Aucun avis de concurrent récent à afficher.
        </div>
      </div>
    </div>
  );
};

export default MerchantPerformance;
