import { Camera, Check, Clock, UtensilsCrossed } from "lucide-react";
import { getBusinessTrustBadges, type BusinessLike, type MenuItemLike } from "@/lib/businessTrustBadges";

interface BusinessTrustBadgesProps {
  business: BusinessLike;
  menuItems?: MenuItemLike[];
}

const ICONS = {
  check: Check,
  clock: Clock,
  menu: UtensilsCrossed,
  camera: Camera,
} as const;

const BusinessTrustBadges = ({ business, menuItems = [] }: BusinessTrustBadgesProps) => {
  const badges = getBusinessTrustBadges(business, menuItems);
  if (badges.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 px-4 pt-3">
      {badges.map((b) => {
        const Icon = b.icon ? ICONS[b.icon] : Check;
        return (
          <span
            key={b.id}
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground"
          >
            <Icon size={12} /> {b.label}
          </span>
        );
      })}
    </div>
  );
};

export default BusinessTrustBadges;
