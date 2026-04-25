import { supabase } from "@/integrations/supabase/client";

export type SponsoredPlacement =
  | "home"
  | "search"
  | "category"
  | "city"
  | "business_detail"
  | "all";

export type SponsoredStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "paused"
  | "rejected"
  | "ended";

export type SponsoredEventType = "impression" | "click";

/**
 * Fire-and-forget sponsored event tracker. Never throws, never blocks UI.
 */
const SESSION_DEDUPE_KEY = "qmaps:sponsored:impressions";

const getSessionDedupeSet = (): Set<string> => {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.sessionStorage.getItem(SESSION_DEDUPE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
};

const persistSessionDedupe = (set: Set<string>): void => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      SESSION_DEDUPE_KEY,
      JSON.stringify(Array.from(set)),
    );
  } catch {
    // silent
  }
};

/**
 * Returns true the first time (campaignId, placement) is seen this session,
 * false on subsequent calls. Lets callers avoid spamming impressions on rerenders.
 */
export const shouldRecordImpression = (
  campaignId: string,
  placement?: string,
): boolean => {
  const key = `${campaignId}:${placement ?? "_"}`;
  const set = getSessionDedupeSet();
  if (set.has(key)) return false;
  set.add(key);
  persistSessionDedupe(set);
  return true;
};

export const trackSponsoredEvent = (
  campaignId: string,
  businessId: string,
  eventType: SponsoredEventType,
  placement?: string,
  metadata?: Record<string, unknown>,
): void => {
  if (!campaignId || !businessId) return;
  void (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("sponsored_campaign_events" as any).insert({
        campaign_id: campaignId,
        business_id: businessId,
        user_id: user?.id ?? null,
        event_type: eventType,
        placement: placement ?? null,
        metadata: metadata ?? {},
      });
    } catch {
      // silent
    }
  })();
};

export const SPONSORED_STATUS_LABELS: Record<SponsoredStatus, string> = {
  draft: "Brouillon",
  pending_review: "En attente",
  approved: "Approuvée",
  paused: "En pause",
  rejected: "Rejetée",
  ended: "Terminée",
};

export const SPONSORED_PLACEMENT_LABELS: Record<SponsoredPlacement, string> = {
  home: "Accueil",
  search: "Recherche",
  category: "Catégorie",
  city: "Ville",
  business_detail: "Fiche entreprise",
  all: "Toutes les surfaces",
};
