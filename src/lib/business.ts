import type { Tables } from "@/integrations/supabase/types";
import { isBusinessOpenNow, type SearchableBusiness } from "@/lib/searchFilters";
import type { Business } from "@/types";

export const priceLabels = ["$", "$$", "$$$", "$$$$"];

export type BusinessWithDistance = Tables<"businesses"> & {
  distance_meters?: number | null;
  category_slug?: string | null;
  category_name?: string | null;
  business_categories?: {
    categories?: { name?: string | null; slug?: string | null } | null;
  }[] | null;
};

export type BusinessSearchHit = Pick<Tables<"businesses">, "id" | "name" | "address" | "image_url">;

export const categoryNameFromEmbed = (business: object, fallback = "Local"): string => {
  const embedded = business as BusinessWithDistance;
  return embedded.business_categories?.[0]?.categories?.name || embedded.category_name || fallback;
};

export type BusinessCardSource = SearchableBusiness & Pick<BusinessWithDistance,
  "id" | "name" | "city" | "address" | "avg_rating" | "reviews_count" | "price_level" |
  "image_url" | "phone" | "hours" | "description" | "amenities" | "photos" | "category_name"
>;

export const mapBusinessToCard = (business: BusinessCardSource): Business => ({
  id: business.id,
  name: business.name,
  category: business.category_name || categoryNameFromEmbed(business),
  rating: Number(business.avg_rating),
  reviewCount: business.reviews_count,
  priceLevel: priceLabels[(business.price_level ?? 0) - 1] || "",
  neighborhood: business.city,
  image: business.image_url || "/placeholder.svg",
  isOpen: isBusinessOpenNow(business),
  distance: business.distance_meters != null ? `${Math.round(business.distance_meters)} m` : undefined,
  address: business.address,
  phone: business.phone || "",
  hours: business.hours || "",
  description: business.description || "",
  amenities: business.amenities || [],
  photos: business.photos || [],
});