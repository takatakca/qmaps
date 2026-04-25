import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { BusinessEventType } from "@/lib/analytics";

export interface AnalyticsEventRow {
  id: string;
  business_id: string;
  user_id: string | null;
  event_type: BusinessEventType;
  source: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AnalyticsTotals {
  profile_view: number;
  phone_click: number;
  website_click: number;
  directions_click: number;
  message_click: number;
  save_click: number;
  photo_view: number;
  project_start: number;
  quote_sent: number;
}

const EMPTY_TOTALS: AnalyticsTotals = {
  profile_view: 0, phone_click: 0, website_click: 0, directions_click: 0,
  message_click: 0, save_click: 0, photo_view: 0, project_start: 0, quote_sent: 0,
};

export const useMerchantAnalytics = (businessId: string | null, days: 7 | 30 = 7) => {
  const [events, setEvents] = useState<AnalyticsEventRow[]>([]);
  const [totals, setTotals] = useState<AnalyticsTotals>(EMPTY_TOTALS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!businessId) {
      setEvents([]);
      setTotals(EMPTY_TOTALS);
      setLoading(false);
      return;
    }
    setLoading(true);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("business_events" as any)
      .select("*")
      .eq("business_id", businessId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(500);

    const rows = (data as unknown as AnalyticsEventRow[]) || [];
    const t: AnalyticsTotals = { ...EMPTY_TOTALS };
    rows.forEach((r) => {
      if (r.event_type in t) t[r.event_type] += 1;
    });
    setEvents(rows);
    setTotals(t);
    setLoading(false);
  }, [businessId, days]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { events, totals, loading, refresh };
};
