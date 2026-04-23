import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentPosition } from "@/lib/geo";
import type { BusinessWithDistance } from "@/lib/business";

interface UseNearbyBusinessesResult {
  businesses: BusinessWithDistance[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useNearbyBusinesses = (limit = 8): UseNearbyBusinessesResult => {
  const [businesses, setBusinesses] = useState<BusinessWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const position = await getCurrentPosition();
      const { data, error: queryError } = await supabase
        .from("businesses")
        .select("*")
        .eq("is_active", true)
        .limit(limit * 3);

      if (queryError) throw queryError;

      const withDistance = (data || []).map((business) => ({
        ...business,
        distance_meters: Math.round(
          Math.sqrt(
            Math.pow((business.latitude - position.latitude) * 111000, 2) +
            Math.pow((business.longitude - position.longitude) * 85000, 2),
          ),
        ),
      }));

      withDistance.sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0));
      setBusinesses(withDistance.slice(0, limit));
    } catch (err) {
      const { data, error: fallbackError } = await supabase
        .from("businesses")
        .select("*")
        .eq("is_active", true)
        .order("avg_rating", { ascending: false })
        .limit(limit);

      if (fallbackError) {
        setError("Impossible de charger les commerces à proximité.");
        setBusinesses([]);
      } else {
        setBusinesses((data || []) as BusinessWithDistance[]);
        setError(err instanceof Error ? err.message : "Position indisponible.");
      }
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { businesses, loading, error, refresh };
};