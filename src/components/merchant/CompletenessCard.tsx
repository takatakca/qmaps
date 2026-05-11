import { useNavigate } from "react-router-dom";
import { Camera, Clock, ListChecks, Languages, CreditCard, Accessibility, Tag, Phone, MapPin, Sparkles, Utensils, ImageIcon } from "lucide-react";
import {
  COMPLETENESS_LABELS_FR,
  getBusinessCompleteness,
  type CompletenessBusiness,
} from "@/lib/businessCompleteness";
import type { MenuItem } from "@/lib/menuItems";

const ICONS: Record<string, any> = {
  name: Tag,
  address: MapPin,
  contact: Phone,
  hours: Clock,
  photos: ImageIcon,
  menu: Utensils,
  amenities: ListChecks,
  payment_methods: CreditCard,
  languages: Languages,
  accessibility: Accessibility,
};

const QUICK_ROUTE: Record<string, string> = {
  photos: "/merchant/photos",
  menu: "/merchant/menu",
  hours: "/merchant/business-info",
  contact: "/merchant/business-info",
  address: "/merchant/business-info",
  amenities: "/merchant/business-info",
  payment_methods: "/merchant/business-info",
  languages: "/merchant/business-info",
  accessibility: "/merchant/business-info",
  name: "/merchant/business-info",
};

interface Props {
  business: CompletenessBusiness;
  menuItems?: MenuItem[];
}

const CompletenessCard = ({ business, menuItems = [] }: Props) => {
  const navigate = useNavigate();
  const { score, missing } = getBusinessCompleteness(business, menuItems);

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="relative w-12 h-12 shrink-0">
          <div
            className="w-12 h-12 rounded-full"
            style={{
              background: `conic-gradient(hsl(var(--primary)) ${score * 3.6}deg, hsl(var(--muted)) 0deg)`,
            }}
          />
          <div className="absolute inset-1 rounded-full bg-card flex items-center justify-center">
            <span className="text-sm font-bold text-foreground">{score}%</span>
          </div>
        </div>
        <div className="flex-1">
          <p className="font-heading font-semibold text-foreground inline-flex items-center gap-1">
            <Sparkles size={14} className="text-primary" /> Complétez votre profil
          </p>
          <p className="text-xs text-muted-foreground">
            Un profil complet attire plus de clients.
          </p>
        </div>
      </div>

      {missing.length === 0 ? (
        <p className="text-sm text-success font-medium">Profil 100% complet 🎉</p>
      ) : (
        <ul className="space-y-1.5">
          {missing.slice(0, 5).map((key) => {
            const Icon = ICONS[key] ?? Tag;
            return (
              <li key={key}>
                <button
                  onClick={() => navigate(QUICK_ROUTE[key] ?? "/merchant/business-info")}
                  className="w-full flex items-center gap-2 text-sm text-foreground hover:bg-muted/50 rounded-lg px-2 py-1.5 text-left transition-colors"
                >
                  <Icon size={14} className="text-muted-foreground" />
                  <span className="flex-1">Ajouter : {COMPLETENESS_LABELS_FR[key] ?? key}</span>
                  <span className="text-xs text-primary">→</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default CompletenessCard;
