import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SponsoredPlacement, SponsoredStatus } from "@/lib/sponsored";

export interface SponsoredCampaign {
  id: string;
  business_id: string;
  user_id: string;
  status: SponsoredStatus;
  placement: SponsoredPlacement;
  headline: string | null;
  description: string | null;
  target_city: string | null;
  target_category_id: string | null;
  daily_budget_cents: number | null;
  starts_at: string | null;
  ends_at: string | null;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Hook for the merchant: list + mutations on their own campaigns. */
export const useSponsoredCampaigns = (businessId?: string | null) => {
  const [campaigns, setCampaigns] = useState<SponsoredCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    if (!businessId) {
      setCampaigns([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("sponsored_campaigns" as any)
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    setCampaigns((data as any) ?? []);
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const createDraft = useCallback(
    async (params: {
      business_id: string;
      placement: SponsoredPlacement;
      headline?: string;
      description?: string;
      target_city?: string | null;
      target_category_id?: string | null;
      daily_budget_cents?: number | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("not_authenticated");
      const { data, error } = await supabase
        .from("sponsored_campaigns" as any)
        .insert({
          business_id: params.business_id,
          user_id: user.id,
          status: "draft",
          placement: params.placement,
          headline: params.headline ?? null,
          description: params.description ?? null,
          target_city: params.target_city ?? null,
          target_category_id: params.target_category_id ?? null,
          daily_budget_cents: params.daily_budget_cents ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      await fetchCampaigns();
      return data as any as SponsoredCampaign;
    },
    [fetchCampaigns],
  );

  const submitForReview = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("sponsored_campaigns" as any)
        .update({ status: "pending_review" })
        .eq("id", id);
      if (error) throw error;
      await fetchCampaigns();
    },
    [fetchCampaigns],
  );

  const pauseCampaign = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("sponsored_campaigns" as any)
        .update({ status: "paused" })
        .eq("id", id);
      if (error) throw error;
      await fetchCampaigns();
    },
    [fetchCampaigns],
  );

  const updateCampaign = useCallback(
    async (id: string, patch: Partial<SponsoredCampaign>) => {
      const { error } = await supabase
        .from("sponsored_campaigns" as any)
        .update(patch as any)
        .eq("id", id);
      if (error) throw error;
      await fetchCampaigns();
    },
    [fetchCampaigns],
  );

  return {
    campaigns,
    loading,
    refresh: fetchCampaigns,
    createDraft,
    submitForReview,
    pauseCampaign,
    updateCampaign,
  };
};

export interface ApprovedSponsoredListing extends SponsoredCampaign {
  business: {
    id: string;
    name: string;
    image_url: string | null;
    avg_rating: number;
    reviews_count: number;
    city: string;
    address: string;
  } | null;
}

export const useApprovedSponsoredListings = (params: {
  placement: SponsoredPlacement;
  city?: string | null;
  categoryId?: string | null;
  limit?: number;
}) => {
  const { placement, city, categoryId, limit = 3 } = params;
  const [listings, setListings] = useState<ApprovedSponsoredListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      let query = supabase
        .from("sponsored_campaigns" as any)
        .select(
          `*, business:businesses(id, name, image_url, avg_rating, reviews_count, city, address)`,
        )
        .eq("status", "approved")
        .in("placement", [placement, "all"])
        .limit(limit);

      if (city) query = query.or(`target_city.is.null,target_city.eq.${city}`);
      if (categoryId)
        query = query.or(
          `target_category_id.is.null,target_category_id.eq.${categoryId}`,
        );

      const { data } = await query;
      if (cancelled) return;
      const now = new Date();
      const filtered = ((data as any) ?? []).filter((c: ApprovedSponsoredListing) => {
        if (c.starts_at && new Date(c.starts_at) > now) return false;
        if (c.ends_at && new Date(c.ends_at) < now) return false;
        return c.business !== null;
      });
      setListings(filtered);
      setLoading(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [placement, city, categoryId, limit]);

  return { listings, loading };
};

export type SponsoredMetricsRange = "7d" | "30d" | "all";

export interface SponsoredMetricsBreakdown {
  impressions: number;
  clicks: number;
  ctr: number;
  byPlacement: Array<{ placement: string; impressions: number; clicks: number }>;
  byDay: Array<{ day: string; impressions: number; clicks: number }>;
  loading: boolean;
}

export const useSponsoredCampaignMetrics = (
  campaignId?: string | null,
  range: SponsoredMetricsRange = "all",
): SponsoredMetricsBreakdown => {
  const [state, setState] = useState<Omit<SponsoredMetricsBreakdown, "loading">>({
    impressions: 0,
    clicks: 0,
    ctr: 0,
    byPlacement: [],
    byDay: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!campaignId) {
      setState({ impressions: 0, clicks: 0, ctr: 0, byPlacement: [], byDay: [] });
      setLoading(false);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      let q = supabase
        .from("sponsored_campaign_events" as any)
        .select("event_type, placement, created_at")
        .eq("campaign_id", campaignId);
      if (range !== "all") {
        const days = range === "7d" ? 7 : 30;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        q = q.gte("created_at", since);
      }
      const { data } = await q;
      if (cancelled) return;
      const rows = (data as any[]) ?? [];
      const impressions = rows.filter((r) => r.event_type === "impression").length;
      const clicks = rows.filter((r) => r.event_type === "click").length;
      const ctr = impressions > 0 ? clicks / impressions : 0;

      const placementMap = new Map<string, { impressions: number; clicks: number }>();
      const dayMap = new Map<string, { impressions: number; clicks: number }>();
      for (const r of rows) {
        const p = (r.placement as string) ?? "unknown";
        const day = (r.created_at as string).slice(0, 10);
        const pe = placementMap.get(p) ?? { impressions: 0, clicks: 0 };
        const de = dayMap.get(day) ?? { impressions: 0, clicks: 0 };
        if (r.event_type === "impression") {
          pe.impressions++;
          de.impressions++;
        } else if (r.event_type === "click") {
          pe.clicks++;
          de.clicks++;
        }
        placementMap.set(p, pe);
        dayMap.set(day, de);
      }
      const byPlacement = Array.from(placementMap.entries())
        .map(([placement, v]) => ({ placement, ...v }))
        .sort((a, b) => b.impressions - a.impressions);
      const byDay = Array.from(dayMap.entries())
        .map(([day, v]) => ({ day, ...v }))
        .sort((a, b) => a.day.localeCompare(b.day));

      setState({ impressions, clicks, ctr, byPlacement, byDay });
      setLoading(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [campaignId, range]);

  return { ...state, loading };
};
