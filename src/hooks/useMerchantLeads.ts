import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ProjectRequest } from "@/hooks/useProjectRequests";

export interface MerchantLead extends ProjectRequest {
  category_name?: string | null;
  already_quoted?: boolean;
}

interface ServiceArea {
  business_id: string;
  city: string | null;
  region: string | null;
  postal_code_prefix: string | null;
}

const REFRESH_EVENT = "qmaps:project-quotes-updated";

/**
 * Returns project requests visible to the current merchant, filtered to
 * the merchant's service areas (city / region / postal prefix) when at
 * least one area is configured. Radius matching is intentionally left
 * out for now — geocoded coordinates aren't always present on requests.
 *
 * RLS already restricts visibility to matching service categories, so
 * this hook focuses on geographic narrowing + enrichment.
 */
export const useMerchantLeads = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<MerchantLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const matchesArea = (req: ProjectRequest, areas: ServiceArea[]): boolean => {
    if (areas.length === 0) return true; // no areas configured → don't filter
    return areas.some(a => {
      const cityOk = a.city ? (req.city ?? "").toLowerCase() === a.city.toLowerCase() : true;
      const regionOk = a.region ? (req.region ?? "").toLowerCase() === a.region.toLowerCase() : true;
      const postalOk = a.postal_code_prefix
        ? (req.postal_code ?? "").toUpperCase().startsWith(a.postal_code_prefix.toUpperCase())
        : true;
      // Require at least one of city/region/postal to actually match (not all default-true)
      const hasAnyConstraint = !!(a.city || a.region || a.postal_code_prefix);
      if (!hasAnyConstraint) return true;
      return cityOk && regionOk && postalOk;
    });
  };

  const fetchLeads = useCallback(async () => {
    if (!user) {
      setLeads([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    // 1. Owned businesses + their service areas + existing quotes
    const ownedRes = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_user_id", user.id);
    const ownedIds = (ownedRes.data ?? []).map((b: { id: string }) => b.id);

    let areas: ServiceArea[] = [];
    let quotedRequestIds = new Set<string>();
    if (ownedIds.length > 0) {
      const [areasRes, quotesRes] = await Promise.all([
        supabase
          .from("merchant_service_areas" as any)
          .select("business_id, city, region, postal_code_prefix")
          .in("business_id", ownedIds),
        supabase
          .from("project_quotes" as any)
          .select("project_request_id")
          .in("business_id", ownedIds),
      ]);
      areas = ((areasRes.data ?? []) as unknown as ServiceArea[]);
      quotedRequestIds = new Set(
        ((quotesRes.data ?? []) as unknown as { project_request_id: string }[])
          .map(q => q.project_request_id),
      );
    }

    // 2. Open project requests (RLS narrows to matching service categories)
    const { data, error } = await supabase
      .from("project_requests" as any)
      .select("*")
      .neq("user_id", user.id)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      setError(error.message);
      setLeads([]);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as unknown as ProjectRequest[];
    const inArea = rows.filter(r => matchesArea(r, areas));

    // 3. Enrich with category names
    const catIds = Array.from(new Set(inArea.map(r => r.category_id).filter(Boolean) as string[]));
    let catMap: Record<string, string> = {};
    if (catIds.length > 0) {
      const { data: cats } = await supabase
        .from("categories")
        .select("id, name")
        .in("id", catIds);
      (cats ?? []).forEach((c: { id: string; name: string }) => { catMap[c.id] = c.name; });
    }

    const enriched: MerchantLead[] = inArea.map(r => ({
      ...r,
      category_name: r.category_id ? catMap[r.category_id] ?? null : null,
      already_quoted: quotedRequestIds.has(r.id),
    }));

    setLeads(enriched);
    setError(null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchLeads();
    const handler = () => fetchLeads();
    window.addEventListener(REFRESH_EVENT, handler);
    return () => window.removeEventListener(REFRESH_EVENT, handler);
  }, [fetchLeads]);

  return { leads, loading, error, refresh: fetchLeads };
};
