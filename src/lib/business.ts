import type { Tables } from "@/integrations/supabase/types";
import type { Business } from "@/types";

export const priceLabels = ["$", "$$", "$$$", "$$$$"];

export type BusinessWithDistance = Tables<"businesses"> & {
  distance_meters?: number | null;
  category_name?: string | null;
};

export const mapBusinessToCard = (business: BusinessWithDistance): Business => ({
  id: business.id,
  name: business.name,
  category: business.category_name || "Local",
  rating: Number(business.avg_rating),
  reviewCount: business.reviews_count,
  priceLevel: priceLabels[(business.price_level || 1) - 1] || "$",
  neighborhood: business.city,
  image: business.image_url || "/placeholder.svg",
  isOpen: business.is_open,
  distance: business.distance_meters ? `${Math.round(business.distance_meters)} m` : undefined,
  address: business.address,
  phone: business.phone || "",
  hours: business.hours || "",
  description: business.description || "",
  amenities: business.amenities || [],
  photos: business.photos || [],
});