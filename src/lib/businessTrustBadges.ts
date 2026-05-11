export interface TrustBadge {
  id: string;
  label: string;
  icon?: "check" | "clock" | "menu" | "camera";
}

export interface BusinessLike {
  is_claimed?: boolean | null;
  hours_json?: unknown;
  hours?: string | null;
  photos?: string[] | null;
}

export interface MenuItemLike {
  is_available?: boolean | null;
}

export const getBusinessTrustBadges = (
  business: BusinessLike | null | undefined,
  menuItems: readonly MenuItemLike[] = [],
): TrustBadge[] => {
  const badges: TrustBadge[] = [];
  if (!business) return badges;

  if (business.is_claimed) {
    badges.push({ id: "verified-owner", label: "Propriétaire vérifié", icon: "check" });
  }

  const hasHours =
    (business.hours_json && typeof business.hours_json === "object" && Object.keys(business.hours_json as Record<string, unknown>).length > 0) ||
    (typeof business.hours === "string" && business.hours.trim().length > 0);
  if (hasHours) {
    badges.push({ id: "hours-confirmed", label: "Horaires confirmés", icon: "clock" });
  }

  const hasMenu = menuItems.some((m) => m && m.is_available !== false);
  if (hasMenu) {
    badges.push({ id: "menu-available", label: "Menu disponible", icon: "menu" });
  }

  const photos = Array.isArray(business.photos) ? business.photos.filter(Boolean) : [];
  if (photos.length > 0) {
    badges.push({ id: "photos-added", label: "Photos ajoutées", icon: "camera" });
  }

  return badges;
};
