import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getCurrentPosition } from "@/lib/geo";
import type { ActivityFeedItem } from "@/lib/social";

type FollowRow = { following_id: string };

const distanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const dy = (lat1 - lat2) * 111000;
  const dx = (lng1 - lng2) * 85000;
  return Math.round(Math.sqrt(dx * dx + dy * dy));
};

export const useActivityFeed = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [allItems, setAllItems] = useState<ActivityFeedItem[]>([]);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [reviewsResult, photosResult, businessesResult, followsResult] = await Promise.all([
        supabase
          .from("reviews")
          .select("id, user_id, business_id, rating, body, created_at, businesses(id, name, city, image_url, latitude, longitude)")
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("business_photos")
          .select("id, user_id, business_id, url, caption, created_at, businesses(id, name, city, image_url, latitude, longitude)")
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("businesses")
          .select("id, owner_user_id, name, city, image_url, latitude, longitude, created_at")
          .order("created_at", { ascending: false })
          .limit(12),
        user
          ? supabase.from("follows" as any).select("following_id").eq("follower_id", user.id)
          : Promise.resolve({ data: [] }),
      ]);

      const userIds = new Set<string>();
      for (const row of (reviewsResult.data || []) as any[]) userIds.add(row.user_id);
      for (const row of (photosResult.data || []) as any[]) userIds.add(row.user_id);
      for (const row of (businessesResult.data || []) as any[]) if (row.owner_user_id) userIds.add(row.owner_user_id);

      const { data: profiles } = userIds.size
        ? await supabase.from("profiles").select("id, display_name").in("id", Array.from(userIds))
        : { data: [] };

      const profileMap = new Map<string, string>();
      for (const profile of (profiles || []) as any[]) profileMap.set(profile.id, profile.display_name || "Utilisateur");

      const reviewItems: ActivityFeedItem[] = ((reviewsResult.data || []) as any[]).map((review) => ({
        id: `review-${review.id}`,
        type: "review",
        actor_id: review.user_id,
        actor_name: profileMap.get(review.user_id) || "Utilisateur",
        created_at: review.created_at,
        business_id: review.businesses?.id || review.business_id,
        business_name: review.businesses?.name || "Commerce local",
        business_city: review.businesses?.city || null,
        business_image_url: review.businesses?.image_url || null,
        business_latitude: review.businesses?.latitude,
        business_longitude: review.businesses?.longitude,
        rating: review.rating,
        body: review.body,
      }));

      const photoItems: ActivityFeedItem[] = ((photosResult.data || []) as any[]).map((photo) => ({
        id: `photo-${photo.id}`,
        type: "photo",
        actor_id: photo.user_id,
        actor_name: profileMap.get(photo.user_id) || "Utilisateur",
        created_at: photo.created_at,
        business_id: photo.businesses?.id || photo.business_id,
        business_name: photo.businesses?.name || "Commerce local",
        business_city: photo.businesses?.city || null,
        business_image_url: photo.businesses?.image_url || photo.url || null,
        business_latitude: photo.businesses?.latitude,
        business_longitude: photo.businesses?.longitude,
        media_url: photo.url,
        body: photo.caption,
      }));

      const businessItems: ActivityFeedItem[] = ((businessesResult.data || []) as any[]).map((business) => ({
        id: `business-${business.id}`,
        type: "business",
        actor_id: business.owner_user_id || business.id,
        actor_name: profileMap.get(business.owner_user_id) || "QMaps",
        created_at: business.created_at,
        business_id: business.id,
        business_name: business.name,
        business_city: business.city,
        business_image_url: business.image_url,
        business_latitude: business.latitude,
        business_longitude: business.longitude,
        body: "Nouveau commerce à découvrir",
      }));

      setFriendIds((((followsResult as { data?: FollowRow[] }).data) || []).map((row) => row.following_id));
      setAllItems([...reviewItems, ...photoItems, ...businessItems].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 40));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger l'activité.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handleRefresh = () => {
      void refresh();
    };

    window.addEventListener("qmaps:follows-updated", handleRefresh);

    return () => window.removeEventListener("qmaps:follows-updated", handleRefresh);
  }, [refresh]);

  const all = useMemo(() => allItems, [allItems]);
  const friends = useMemo(() => allItems.filter((item) => friendIds.includes(item.actor_id)), [allItems, friendIds]);
  const [nearby, setNearby] = useState<ActivityFeedItem[]>([]);

  useEffect(() => {
    const loadNearby = async () => {
      try {
        const coords = await getCurrentPosition();
        setNearby(
          allItems
            .map((item) => ({
              ...item,
              distance_meters: item.business_latitude != null && item.business_longitude != null
                ? distanceMeters(item.business_latitude, item.business_longitude, coords.latitude, coords.longitude)
                : null,
            }))
            .filter((item) => item.distance_meters != null && (item.distance_meters || 0) <= 5000)
            .sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0))
            .slice(0, 20),
        );
      } catch {
        setNearby([]);
      }
    };

    void loadNearby();
  }, [allItems]);

  return { all, friends, nearby, friendIds, loading, error, refresh };
};
