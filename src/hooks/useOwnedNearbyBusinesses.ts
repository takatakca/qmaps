import { useEffect, useState } from "react";
import { nearbyPlaces } from "@/lib/ownedDirectory";
import { getCurrentPosition } from "@/lib/geo";
import type { HomeListing } from "@/hooks/useHomeListings";

export function useOwnedNearbyBusinesses(limit: number) {
  const [businesses, setBusinesses] = useState<HomeListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setLoading(true);
    setError(null);
    setBusinesses([]);
    async function load() {
      let position;
      try {
        position = await getCurrentPosition();
      } catch (reason) {
        if (signal.aborted) return;
        setError(reason instanceof Error ? reason.message : "Position indisponible.");
        setLoading(false);
        return;
      }
      if (signal.aborted) return;
      try {
        const places = await nearbyPlaces(position, limit, signal);
        if (signal.aborted) return;
        setBusinesses(places.map(place => {
          const category = place.business_categories?.[0]?.categories;
          return { ...place, category_name: category?.name ?? null, category_slug: category?.slug ?? null };
        }));
      } catch {
        if (!signal.aborted) setError("Impossible de charger les commerces à proximité.");
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [limit]);

  return { businesses, loading, error };
}
