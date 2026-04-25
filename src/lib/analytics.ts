import { supabase } from "@/integrations/supabase/client";

export type BusinessEventType =
  | "profile_view"
  | "phone_click"
  | "website_click"
  | "directions_click"
  | "message_click"
  | "save_click"
  | "photo_view"
  | "project_start"
  | "quote_sent";

/**
 * Fire-and-forget event tracker. Never throws, never blocks UI.
 */
export const trackBusinessEvent = (
  businessId: string,
  eventType: BusinessEventType,
  options?: { source?: string; metadata?: Record<string, unknown> }
): void => {
  if (!businessId) return;
  void (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("business_events" as any).insert({
        business_id: businessId,
        user_id: user?.id ?? null,
        event_type: eventType,
        source: options?.source ?? null,
        metadata: options?.metadata ?? {},
      });
    } catch {
      // silent
    }
  })();
};
