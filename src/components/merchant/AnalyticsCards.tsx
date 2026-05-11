import { useMerchantAnalytics } from "@/hooks/useMerchantAnalytics";
import { formatAnalyticsCount } from "@/lib/merchantAnalytics";
import { Eye, Phone, Globe, Navigation, MessageSquare, Bookmark } from "lucide-react";

interface AnalyticsCardsProps {
  businessId: string;
}

const ITEMS = [
  { key: "profile_view", label: "Vues du profil", icon: Eye },
  { key: "phone_click", label: "Clics téléphone", icon: Phone },
  { key: "website_click", label: "Clics site web", icon: Globe },
  { key: "directions_click", label: "Itinéraires", icon: Navigation },
  { key: "message_click", label: "Messages", icon: MessageSquare },
  { key: "save_click", label: "Sauvegardes", icon: Bookmark },
] as const;

const AnalyticsCards = ({ businessId }: AnalyticsCardsProps) => {
  const { totals, loading } = useMerchantAnalytics(businessId, 7);

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-heading font-bold text-foreground">Performance (7 jours)</h3>
        {loading && <span className="text-xs text-muted-foreground">…</span>}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {ITEMS.map(({ key, label, icon: Icon }) => (
          <div key={key} className="flex flex-col items-center text-center p-2 rounded-xl bg-secondary/40">
            <Icon size={16} className="text-primary mb-1" />
            <span className="text-lg font-bold text-foreground leading-none">
              {formatAnalyticsCount(totals[key as keyof typeof totals] ?? 0)}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1 leading-tight">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsCards;
