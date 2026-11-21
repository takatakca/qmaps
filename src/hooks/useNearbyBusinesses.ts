import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { distanceMeters, getCurrentPosition } from "@/lib/geo";
import type { BusinessWithDistance } from "@/lib/business";

const radiusMeters = 10000;
const pageSize = 200;

export const useNearbyBusinesses = (limit = 8) => {
  const [businesses, setBusinesses] = useState<BusinessWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const request = useRef<symbol | null>(null);

  const refresh = useCallback(async () => {
    const id = Symbol();
    request.current = id;
    setLoading(true);
    setError(null);
    try {
      const position = await getCurrentPosition();
      // Bound the query before fetching. Calculate great-circle distances for
      // the candidates inside the box, then keep only the nearest results.
      const latDelta = radiusMeters / 110000;
      const lonDelta = latDelta / Math.max(0.001, Math.cos((Math.abs(position.latitude) + latDelta) * Math.PI / 180));
      const nearest: BusinessWithDistance[] = [];
      for (let offset = 0; id === request.current; offset += pageSize) {
        const { data, error } = await supabase.from("businesses")
          .select("*, business_categories(categories(name, slug))")
          .eq("is_active", true)
          .gte("latitude", position.latitude - latDelta).lte("latitude", position.latitude + latDelta)
          .gte("longitude", position.longitude - lonDelta).lte("longitude", position.longitude + lonDelta)
          .order("id").range(offset, offset + pageSize - 1);
        if (error) throw new Error("Impossible de charger les commerces à proximité.");
        for (const row of data ?? []) {
          const distance = distanceMeters(position, row.latitude, row.longitude);
          if (distance != null && distance <= radiusMeters) {
            const cat = row.business_categories?.[0]?.categories;
            nearest.push({ ...row, category_name: cat?.name, category_slug: cat?.slug, distance_meters: distance });
          }
        }
        if (!data || data.length < pageSize) break;
      }
      if (id === request.current) {
        setBusinesses(nearest.sort((a, b) => a.distance_meters! - b.distance_meters!).slice(0, limit));
      }
    } catch (err) {
      if (id === request.current) {
        setBusinesses([]);
        setError(err instanceof Error ? err.message : "Position indisponible.");
      }
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void refresh();
    return () => { request.current = null; };
  }, [refresh]);

  return { businesses, loading, error, refresh };
};
