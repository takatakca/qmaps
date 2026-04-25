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
