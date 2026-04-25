import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MerchantServiceArea {
  id: string;
  business_id: string;
  region: string | null;
  city: string | null;
  postal_code_prefix: string | null;
  radius_km: number | null;
  created_at: string;
}

export interface MerchantServiceCategory {
  id: string;
  business_id: string;
  category_id: string;
  created_at: string;
}

export interface ServiceAreaInput {
  region?: string | null;
  city?: string | null;
  postal_code_prefix?: string | null;
  radius_km?: number | null;
}

/**
 * Manages a merchant's service areas and service categories for a given
 * business. Used by the Projects marketplace to match leads to providers.
 */
export const useMerchantServiceSetup = (businessId?: string) => {
  const [areas, setAreas] = useState<MerchantServiceArea[]>([]);
  const [categories, setCategories] = useState<MerchantServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!businessId) {
      setAreas([]);
      setCategories([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [areasRes, catsRes] = await Promise.all([
      supabase
        .from("merchant_service_areas" as any)
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false }),
      supabase
        .from("merchant_service_categories" as any)
        .select("*")
        .eq("business_id", businessId),
    ]);
    if (areasRes.error || catsRes.error) {
      setError(areasRes.error?.message ?? catsRes.error?.message ?? "Unknown error");
    } else {
      setError(null);
    }
    setAreas((areasRes.data ?? []) as unknown as MerchantServiceArea[]);
    setCategories((catsRes.data ?? []) as unknown as MerchantServiceCategory[]);
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addArea = useCallback(
    async (input: ServiceAreaInput) => {
      if (!businessId) return { error: "Missing business" as const };
      const { error } = await supabase
        .from("merchant_service_areas" as any)
        .insert({ ...input, business_id: businessId });
      if (!error) await fetchAll();
      return { error: error?.message ?? null };
    },
    [businessId, fetchAll],
  );

  const removeArea = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("merchant_service_areas" as any)
        .delete()
        .eq("id", id);
      if (!error) await fetchAll();
      return { error: error?.message ?? null };
    },
    [fetchAll],
  );

  const addCategory = useCallback(
    async (categoryId: string) => {
      if (!businessId) return { error: "Missing business" as const };
      const { error } = await supabase
        .from("merchant_service_categories" as any)
        .insert({ business_id: businessId, category_id: categoryId });
      if (!error) await fetchAll();
      return { error: error?.message ?? null };
    },
    [businessId, fetchAll],
  );

  const removeCategory = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("merchant_service_categories" as any)
        .delete()
        .eq("id", id);
      if (!error) await fetchAll();
      return { error: error?.message ?? null };
    },
    [fetchAll],
  );

  return {
    areas,
    categories,
    loading,
    error,
    refresh: fetchAll,
    addArea,
    removeArea,
    addCategory,
    removeCategory,
  };
};
